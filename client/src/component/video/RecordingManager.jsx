import React, { useState, useRef, useEffect } from 'react';

const RecordingManager = ({ localStream, roomId, isEducatorMode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStartTimeRef = useRef(null);
  const combinedStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  
  // Create a canvas to combine video sources
  const canvasRef = useRef(null);
  const canvasContextRef = useRef(null);

  // Initialize canvas
  useEffect(() => {
    canvasRef.current = document.createElement('canvas');
    canvasContextRef.current = canvasRef.current.getContext('2d');
  }, []);

  // Function to combine camera and screen streams
  const combineStreams = async (cameraStream, screenStream = null) => {
    if (!canvasContextRef.current) return cameraStream;
    
    // Create a new canvas stream
    const canvasStream = canvasRef.current.captureStream(30); // 30 FPS
    
    // Set canvas dimensions (HD quality)
    canvasRef.current.width = 1920;
    canvasRef.current.height = 1080;
    
    // Create video elements for sources
    const cameraVideo = document.createElement('video');
    cameraVideo.srcObject = cameraStream;
    cameraVideo.muted = true;
    cameraVideo.play();
    
    let screenVideo = null;
    if (screenStream) {
      screenVideo = document.createElement('video');
      screenVideo.srcObject = screenStream;
      screenVideo.muted = true;
      screenVideo.play();
    }
    
    // Animation frame function to draw both sources
    const drawFrame = () => {
      if (!isRecording || !canvasContextRef.current) return;
      
      // Clear canvas
      canvasContextRef.current.fillStyle = '#000000';
      canvasContextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      if (screenVideo) {
        // Draw screen sharing (main content - 70% width)
        const screenWidth = canvasRef.current.width * 0.7;
        const screenHeight = (screenWidth * 9) / 16; // 16:9 aspect ratio
        
        canvasContextRef.current.drawImage(
          screenVideo,
          20, // X position
          20, // Y position
          screenWidth - 40,
          screenHeight - 40
        );
        
        // Draw camera feed (picture-in-picture)
        const pipWidth = 320;
        const pipHeight = 180;
        
        canvasContextRef.current.drawImage(
          cameraVideo,
          screenWidth - pipWidth - 20, // X position (right side)
          20, // Y position (top)
          pipWidth,
          pipHeight
        );
        
        // Add overlay text
        canvasContextRef.current.font = 'bold 20px Arial';
        canvasContextRef.current.fillStyle = '#ffffff';
        canvasContextRef.current.fillText(`STEMA Live Class - Room: ${roomId}`, 30, 50);
        
        canvasContextRef.current.font = '16px Arial';
        canvasContextRef.current.fillText(new Date().toLocaleString(), 30, 80);
      } else {
        // Only camera - full screen
        canvasContextRef.current.drawImage(
          cameraVideo,
          0, 0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        
        // Add overlay
        canvasContextRef.current.font = 'bold 24px Arial';
        canvasContextRef.current.fillStyle = '#ffffff';
        canvasContextRef.current.fillText(`STEMA Live Class - Room: ${roomId}`, 30, 50);
        canvasContextRef.current.fillText(new Date().toLocaleString(), 30, 90);
      }
      
      requestAnimationFrame(drawFrame);
    };
    
    // Start drawing
    requestAnimationFrame(drawFrame);
    
    return canvasStream;
  };

  // Start screen sharing for recording
  const startScreenSharingForRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor"
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100
        }
      });
      
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      
      // Handle screen share stop
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenSharingForRecording();
      };
      
      return screenStream;
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      return null;
    }
  };

  const stopScreenSharingForRecording = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
  };

  // Main recording function
  const startRecording = async () => {
    if (!localStream) {
      alert('Camera access is required for recording');
      return;
    }
    
    try {
      // Ask for screen sharing if educator
      let screenStream = null;
      if (isEducatorMode) {
        if (window.confirm('Do you want to include screen sharing in the recording?')) {
          screenStream = await startScreenSharingForRecording();
          if (!screenStream) {
            alert('Screen sharing is required for recording. Recording cancelled.');
            return;
          }
        } else {
          alert('Recording will only include camera feed.');
        }
      }
      
      // Combine streams
      const canvasStream = await combineStreams(localStream, screenStream);
      
      // Add audio from camera
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }
      
      // Add audio from screen if available
      if (screenStream) {
        const screenAudio = screenStream.getAudioTracks()[0];
        if (screenAudio) {
          canvasStream.addTrack(screenAudio);
        }
      }
      
      // Create MediaRecorder with higher quality
      const options = {
        mimeType: 'video/webm;codecs=h264,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps for HD quality
        audioBitsPerSecond: 128000   // 128 Kbps for audio
      };
      
      // Fallback to default if h264 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp9,opus';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }
      
      const mediaRecorder = new MediaRecorder(canvasStream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create final video with metadata
        const metadata = new Blob([
          JSON.stringify({
            roomId,
            timestamp: new Date().toISOString(),
            duration: (Date.now() - recordingStartTimeRef.current) / 1000,
            isEducator: isEducatorMode,
            hasScreenShare: !!screenStream
          })
        ], { type: 'application/json' });
        
        // Combine video chunks
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        
        // Create a container blob with both video and metadata
        const combinedBlob = new Blob([metadata, videoBlob], { type: 'video/webm' });
        const url = URL.createObjectURL(combinedBlob);
        
        const recording = {
          id: Date.now(),
          url,
          timestamp: new Date(),
          roomId,
          duration: (Date.now() - recordingStartTimeRef.current) / 1000,
          hasScreenShare: !!screenStream,
          isEducator: isEducatorMode,
          size: combinedBlob.size
        };
        
        setRecordings(prev => [recording, ...prev]);
        saveRecording(combinedBlob, recording);
        
        // Clean up
        if (screenStream) {
          stopScreenSharingForRecording();
        }
      };

      mediaRecorder.onerror = (error) => {
        console.error('Recording error:', error);
        alert('Recording failed: ' + error.message);
        stopRecording();
      };

      // Start recording with 1-second intervals for better performance
      mediaRecorder.start(1000);
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      
      // Show recording status
      alert(`Recording started! ${screenStream ? 'Screen sharing is included.' : 'Only camera feed is being recorded.'}`);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording: ' + error.message);
      stopScreenSharingForRecording();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks in the combined stream
      if (combinedStreamRef.current) {
        combinedStreamRef.current.getTracks().forEach(track => track.stop());
        combinedStreamRef.current = null;
      }
      
      // Stop screen sharing if active
      if (screenStreamRef.current) {
        stopScreenSharingForRecording();
      }
    }
  };

  const saveRecording = (blob, recordingInfo) => {
    // In production, upload to server
    console.log('Recording saved:', {
      size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB',
      duration: recordingInfo.duration + ' seconds',
      hasScreenShare: recordingInfo.hasScreenShare
    });
    
    // Example upload code (commented out):
    /*
    const formData = new FormData();
    formData.append('recording', blob, `recording-${roomId}-${Date.now()}.webm`);
    formData.append('metadata', JSON.stringify(recordingInfo));
    
    fetch('/api/recordings/upload', {
      method: 'POST',
      body: formData
    });
    */
  };

  const downloadRecording = (recording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `stema-recording-${recording.roomId}-${new Date(recording.timestamp).toISOString().replace(/[:.]/g, '-')}.webm`;
    a.click();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isEducatorMode) return null;

  return (
    <div className="sidebar-section">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">🎥 Session Recording</h3>
        <div className="flex gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded font-semibold transition-all flex items-center gap-2 ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isRecording ? (
              <>
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                Stop Recording
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-white rounded-full"></div>
                Start Recording
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="recording-status mb-4 p-3 bg-red-900/30 rounded-lg border border-red-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-red-300">Recording in progress</span>
            </div>
            <div className="text-sm text-gray-300">
              {formatDuration((Date.now() - recordingStartTimeRef.current) / 1000)}
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-green-400">Active</span>
            </div>
            {isScreenSharing && (
              <div className="flex justify-between">
                <span>Screen Sharing:</span>
                <span className="text-blue-400">Enabled</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Quality:</span>
              <span>HD (1080p)</span>
            </div>
          </div>
        </div>
      )}

      {/* Recording Instructions */}
      {!isRecording && (
        <div className="recording-info mb-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
          <h4 className="font-semibold text-blue-300 mb-2">📝 Recording Instructions:</h4>
          <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
            <li>Click "Start Recording" to begin</li>
            <li>You'll be asked to share your screen (recommended)</li>
            <li>Recording includes camera + screen + audio</li>
            <li>Stop recording when class ends</li>
            <li>Downloads are saved as WebM format</li>
          </ul>
        </div>
      )}

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div className="recordings-list">
          <h4 className="font-semibold text-white mb-2">📁 Previous Recordings</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recordings.map(recording => (
              <div key={recording.id} className="bg-gray-800 p-3 rounded hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-white font-medium">
                        {new Date(recording.timestamp).toLocaleDateString()}
                      </p>
                      {recording.hasScreenShare && (
                        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">Screen+Cam</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{formatDuration(recording.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{formatFileSize(recording.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Room:</span>
                        <span className="text-blue-300">{recording.roomId}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadRecording(recording)}
                    className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex-shrink-0"
                    title="Download recording"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recording Statistics */}
      {recordings.length > 0 && (
        <div className="recording-stats mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 flex justify-between">
            <span>Total Recordings: <strong className="text-white">{recordings.length}</strong></span>
            <span>Total Duration: <strong className="text-white">
              {formatDuration(recordings.reduce((sum, r) => sum + r.duration, 0))}
            </strong></span>
            <span>Total Size: <strong className="text-white">
              {formatFileSize(recordings.reduce((sum, r) => sum + r.size, 0))}
            </strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingManager;