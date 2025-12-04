// client/src/component/video/RecordingManager.jsx
import React, { useState, useRef, useEffect } from 'react';
import RecordingService from '../../service/recordingService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RecordingManager = ({ localStream, roomId, isEducatorMode, courseId, userId, userName }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [serverRecordings, setServerRecordings] = useState([]);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStartTimeRef = useRef(null);
  const screenStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Load existing recordings from server
  useEffect(() => {
    if (roomId) {
      loadServerRecordings();
    }
  }, [roomId]);

  const loadServerRecordings = async () => {
    try {
      const serverRecs = await RecordingService.getRoomRecordings(roomId);
      setServerRecordings(serverRecs);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  // Create combined stream
  const createCombinedStream = async () => {
    try {
      setRecordingStatus('creating_stream');
      
      let audioStream = null;
      let videoStream = null;
      
      // 1. Get audio from localStream (microphone)
      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioStream = new MediaStream([audioTracks[0]]);
        }
      }
      
      // 2. Get video from camera (or screen if sharing)
      if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoStream = new MediaStream([videoTracks[0]]);
        }
      }
      
      // 3. Combine audio and video if both exist
      if (audioStream && videoStream) {
        const combined = new MediaStream([
          ...audioStream.getTracks(),
          ...videoStream.getTracks()
        ]);
        return combined;
      }
      
      // 4. Fallback to just audio or just video
      if (audioStream) return audioStream;
      if (videoStream) return videoStream;
      
      throw new Error('No media tracks available for recording');
      
    } catch (error) {
      console.error('Error creating combined stream:', error);
      throw error;
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      setRecordingStatus('preparing');
      
      // Ask for screen sharing (optional)
      let screenStream = null;
      if (isEducatorMode && window.confirm('Do you want to share your screen for recording?')) {
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: "always",
              displaySurface: "monitor"
            },
            audio: false
          });
          screenStreamRef.current = screenStream;
          
          // Handle screen share ending
          const videoTrack = screenStream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.onended = () => {
              console.log('Screen sharing stopped by user');
              screenStreamRef.current = null;
            };
          }
        } catch (error) {
          console.warn('Screen sharing cancelled or failed:', error);
          // Continue without screen share
        }
      }
      
      setRecordingStatus('creating_stream');
      
      // Create recording stream
      const recordingStream = await createCombinedStream();
      
      if (!recordingStream) {
        throw new Error('Failed to create recording stream');
      }
      
      // Check if stream has any tracks
      if (recordingStream.getTracks().length === 0) {
        throw new Error('No media tracks available for recording');
      }
      
      // Configure MediaRecorder with fallback mime types
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      if (!selectedMimeType) {
        console.warn('No supported mime type found, using default');
        selectedMimeType = 'video/webm';
      }
      
      const options = {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 1000000,
        audioBitsPerSecond: 128000
      };
      
      const mediaRecorder = new MediaRecorder(recordingStream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setRecordingStatus('processing');
        
        try {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { 
              type: selectedMimeType || 'video/webm' 
            });
            
            // Save locally
            const localUrl = URL.createObjectURL(blob);
            const localRecording = {
              id: Date.now(),
              url: localUrl,
              timestamp: new Date(),
              roomId,
              duration: recordingDuration,
              hasScreenShare: !!screenStreamRef.current,
              size: blob.size,
              format: selectedMimeType.includes('webm') ? 'webm' : 'mp4',
              isLocal: true
            };
            
            setRecordings(prev => [localRecording, ...prev]);
            
            // Upload to server (optional)
            if (roomId && courseId && userId) {
              try {
                await uploadToServer(blob, recordingDuration);
              } catch (uploadError) {
                console.error('Upload failed:', uploadError);
                toast.warning('Recording saved locally, but upload failed');
              }
            }
            
            toast.success(`Recording saved! Duration: ${RecordingService.formatDuration(recordingDuration)}`);
          } else {
            toast.warning('Recording produced no data');
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          toast.error('Failed to save recording');
        } finally {
          cleanupRecording();
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError(event.error?.message || 'Recording error');
        toast.error(`Recording error: ${event.error?.message || 'Unknown error'}`);
        cleanupRecording();
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      setRecordingStatus('recording');
      
      // Update duration
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
      }, 1000);
      
      toast.success('Recording started!');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError(error.message);
      toast.error(`Failed to start recording: ${error.message}`);
      cleanupRecording();
    }
  };

  // Upload recording to server
  const uploadToServer = async (blob, duration) => {
    try {
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('recording', blob, `recording-room-${roomId}-${Date.now()}.webm`);
      formData.append('roomId', roomId);
      formData.append('courseId', courseId);
      formData.append('userId', userId);
      formData.append('userName', userName);
      formData.append('duration', duration.toString());
      formData.append('isEducator', isEducatorMode.toString());
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      // Upload to server
      const result = await RecordingService.uploadRecording(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('Upload successful:', result);
      
      // Reload server recordings
      await loadServerRecordings();
      
      // Reset progress after 2 seconds
      setTimeout(() => setUploadProgress(0), 2000);
      
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(0);
      throw error;
    }
  };

  // Cleanup function
  const cleanupRecording = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recorder:', e);
      }
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    // Reset state
    setTimeout(() => {
      setRecordingDuration(0);
      setRecordingStatus('idle');
      setIsRecording(false);
      setError(null);
    }, 500);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Download recording
  const downloadRecording = (recording) => {
    try {
      const a = document.createElement('a');
      a.href = recording.url;
      a.download = `stema-recording-${recording.roomId}-${new Date(recording.timestamp).toISOString().replace(/[:.]/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Failed to download recording');
    }
  };

  // Delete recording
  const deleteRecording = async (recordingId, isLocal = false) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      if (isLocal) {
        setRecordings(prev => prev.filter(r => r.id !== recordingId));
        toast.success('Local recording deleted');
      } else {
        try {
          await RecordingService.deleteRecording(recordingId);
          await loadServerRecordings();
          toast.success('Recording deleted successfully');
        } catch (error) {
          toast.error('Failed to delete recording: ' + error.message);
        }
      }
    }
  };

  // Play recording
  const playRecording = (recording) => {
    try {
      if (recording.recordingUrl) {
        window.open(`http://localhost:3000${recording.recordingUrl}`, '_blank');
      } else if (recording.url) {
        window.open(recording.url, '_blank');
      } else {
        toast.error('No playback URL available');
      }
    } catch (error) {
      console.error('Error playing recording:', error);
      toast.error('Failed to play recording');
    }
  };

  if (!isEducatorMode) return null;

  const allRecordings = [...recordings, ...serverRecordings];

  return (
    <div className="sidebar-section">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">🎥 Session Recording</h3>
        <div className="flex gap-2">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={recordingStatus !== 'idle'}
              className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <div className="w-3 h-3 bg-white rounded-full"></div>
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 flex items-center gap-2"
            >
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              Stop Recording ({RecordingService.formatDuration(recordingDuration)})
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 rounded border border-red-500/50">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs bg-red-700 text-white px-2 py-1 rounded hover:bg-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Recording Status */}
      {recordingStatus === 'preparing' && (
        <div className="mb-4 p-3 bg-blue-900/30 rounded border border-blue-500/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-blue-300">Preparing recording...</p>
          </div>
        </div>
      )}

      {recordingStatus === 'creating_stream' && (
        <div className="mb-4 p-3 bg-yellow-900/30 rounded border border-yellow-500/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <p className="text-yellow-300">Creating recording stream...</p>
          </div>
        </div>
      )}

      {isRecording && recordingStatus === 'recording' && (
        <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-500/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-red-300">RECORDING</span>
            </div>
            <div className="text-lg font-bold text-red-300">
              {RecordingService.formatDuration(recordingDuration)}
            </div>
          </div>
          
          <div className="text-sm text-red-200 space-y-1">
            <div>Duration: {RecordingService.formatDuration(recordingDuration)}</div>
            {screenStreamRef.current && (
              <div className="flex items-center gap-1">
                <span>🖥️ Screen sharing active</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>Uploading to server...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* All Recordings */}
      {allRecordings.length > 0 && (
        <div className="recordings-list">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-white">📁 Recordings ({allRecordings.length})</h4>
            <button
              onClick={loadServerRecordings}
              className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
              title="Refresh recordings"
            >
              ↻ Refresh
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allRecordings.map((recording, index) => (
              <div key={index} className="bg-gray-800 p-3 rounded hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-white font-medium">
                        {new Date(recording.timestamp || recording.createdAt).toLocaleDateString()}
                      </p>
                      {recording.hasScreenShare && (
                        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">Screen</span>
                      )}
                      {recording.isLocal && (
                        <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded">Local</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{RecordingService.formatDuration(recording.duration || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{RecordingService.formatFileSize(recording.size || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format:</span>
                        <span className="text-green-300">{recording.format || 'webm'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 ml-2">
                    <button
                      onClick={() => playRecording(recording)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      title="Play recording"
                    >
                      Play
                    </button>
                    <button
                      onClick={() => downloadRecording(recording)}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      title="Download recording"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => deleteRecording(recording.id || recording._id, recording.isLocal)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                      title="Delete recording"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Recordings Message */}
      {allRecordings.length === 0 && !isRecording && recordingStatus === 'idle' && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🎥</div>
          <p className="text-sm">No recordings yet</p>
          <p className="text-xs mt-1">Start your first recording above</p>
        </div>
      )}
    </div>
  );
};

export default RecordingManager;