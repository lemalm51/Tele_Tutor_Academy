import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useUser } from '@clerk/clerk-react';
import './SimpleVideoConference.css';

// Import RecordingManager
import RecordingManager from './RecordingManager';

// Attendance service
const attendanceService = {
  records: [],
  
  saveAttendance: (attendanceData) => {
    attendanceService.records.push(attendanceData);
    if (attendanceService.records.length > 100) {
      attendanceService.records = attendanceService.records.slice(-100);
    }
    console.log('Attendance saved:', attendanceData);
    return true;
  },
  
  getAttendanceReport: (roomId) => {
    const roomRecords = attendanceService.records.filter(r => r.roomId === roomId);
    
    if (roomRecords.length === 0) {
      return {
        roomId,
        totalParticipants: 0,
        totalDuration: 0,
        startTime: new Date(),
        endTime: new Date(),
        participants: []
      };
    }
    
    const participantsMap = new Map();
    
    roomRecords.forEach(record => {
      record.participants.forEach(p => {
        const key = p.userId;
        if (!participantsMap.has(key)) {
          participantsMap.set(key, {
            ...p,
            joinTime: new Date(p.joinedAt),
            lastSeen: new Date(record.timestamp),
            duration: 0
          });
        } else {
          const participant = participantsMap.get(key);
          participant.lastSeen = new Date(record.timestamp);
          participant.duration = participant.lastSeen - participant.joinTime;
        }
      });
    });
    
    const participants = Array.from(participantsMap.values());
    
    return {
      roomId,
      totalParticipants: participants.length,
      totalDuration: participants.reduce((sum, p) => sum + p.duration, 0),
      startTime: roomRecords[0].timestamp,
      endTime: roomRecords[roomRecords.length - 1].timestamp,
      participants: participants.sort((a, b) => b.duration - a.duration)
    };
  }
};

// Attendance Tracker Component
const AttendanceTracker = ({ roomId, users, isEducatorMode }) => {
  const [attendance, setAttendance] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (users.length > 0) {
        const attendanceData = {
          roomId,
          timestamp: new Date().toISOString(),
          participants: users.map(u => ({
            userId: u.userId,
            userName: u.userName,
            isEducator: u.isEducator,
            joinedAt: u.joinedAt
          }))
        };
        
        attendanceService.saveAttendance(attendanceData);
        setAttendance(prev => [...prev.slice(-19), attendanceData]);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [roomId, users]);

  const generateReport = () => {
    const report = attendanceService.getAttendanceReport(roomId);
    setReport(report);
    setShowReport(true);
  };

  const exportToCSV = () => {
    if (!report) return;
    
    const csvContent = [
      ['Name', 'Role', 'Join Time', 'Duration (mins)', 'Status'],
      ...report.participants.map(p => [
        p.userName,
        p.isEducator ? 'Educator' : 'Student',
        new Date(p.joinTime).toLocaleTimeString(),
        Math.round(p.duration / 60000),
        p.duration > 300000 ? 'Active' : 'Brief'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${roomId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isEducatorMode) return null;

  return (
    <div className="sidebar-section">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">📊 Attendance</h3>
        <div className="flex gap-2">
          <button 
            onClick={generateReport}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-all"
          >
            Generate Report
          </button>
          <button 
            onClick={exportToCSV}
            disabled={!report}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {showReport && report && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-white mb-2">Attendance Report</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
            <div>Total Participants: <span className="font-bold text-white">{report.totalParticipants}</span></div>
            <div>Duration: <span className="font-bold text-white">{Math.round(report.totalDuration / 60000)} mins</span></div>
            <div>Start Time: <span className="font-bold text-white">{new Date(report.startTime).toLocaleTimeString()}</span></div>
            <div>End Time: <span className="font-bold text-white">{new Date(report.endTime).toLocaleTimeString()}</span></div>
          </div>
          
          <div className="mt-4 max-h-40 overflow-y-auto">
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Duration</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.participants.map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="py-2">
                      {p.userName} {p.isEducator && '👨‍🏫'}
                    </td>
                    <td className="py-2">{Math.round(p.duration / 60000)} mins</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${p.duration > 300000 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        {p.duration > 300000 ? 'Active' : 'Brief'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="attendance-log">
        <h4 className="text-sm font-semibold text-white mb-2">Recent Activity</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {attendance.slice().reverse().map((record, idx) => (
            <div key={idx} className="text-xs bg-gray-800 p-2 rounded hover:bg-gray-700 transition-colors">
              <span className="text-gray-400">
                {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}: 
              </span>
              <span className="ml-2 text-white">{record.participants.length} participants</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Video Conference Component
const SimpleVideoConference = ({ roomId, courseName, isEducatorMode = false }) => {
  const { user } = useUser();
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [raisedHands, setRaisedHands] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const localVideoRef = useRef(null);
  const socketRef = useRef();
  const screenStreamRef = useRef(null);

  // Show notification
  const showNotification = useCallback((message, type = 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-in ${
      type === 'error' ? 'bg-red-600 text-white' :
      type === 'warning' ? 'bg-yellow-600 text-white' :
      'bg-blue-600 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }, []);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io('http://localhost:3000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      forceNew: true,
      withCredentials: true
    });
    
    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Socket connection events
    socketInstance.on('connect', () => {
      console.log('✅ Connected to server');
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnectionStatus('disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('error');
    });

    // Get user media
    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join room after getting media
        socketInstance.emit('join-room', {
          roomId: roomId,
          userId: user?.id || `user_${Date.now()}`,
          userName: user?.fullName || 'Anonymous Student',
          isEducator: isEducatorMode,
          roomName: courseName
        });

      } catch (error) {
        console.error('Error accessing media:', error);
        // Join without media if permissions denied
        socketInstance.emit('join-room', {
          roomId: roomId,
          userId: user?.id || `user_${Date.now()}`,
          userName: user?.fullName || 'Anonymous Student',
          isEducator: isEducatorMode,
          roomName: courseName
        });
        
        showNotification('Camera/microphone access denied. You can still participate in chat.', 'warning');
      }
    };

    setupMedia();

    // Socket event listeners
    socketInstance.on('room-update', ({ users }) => {
      console.log('Room update:', users);
      setUsers(users);
    });

    socketInstance.on('new-message', (message) => {
      console.log('New message:', message);
      setMessages(prev => [...prev, message]);
      
      // Auto-scroll to latest message
      setTimeout(() => {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    });

    socketInstance.on('user-connected', (userData) => {
      console.log('User connected:', userData);
      showNotification(`${userData.userName} joined the class!`, 'info');
    });

    socketInstance.on('user-disconnected', (userData) => {
      console.log('User disconnected:', userData);
      showNotification(`${userData.userName} left the class.`, 'info');
    });

    socketInstance.on('hand-raised', ({ userName, timestamp }) => {
      console.log('Hand raised:', userName);
      const newHand = { userName, timestamp: new Date(timestamp) };
      setRaisedHands(prev => [...prev, newHand]);
      
      // Remove after 30 seconds
      setTimeout(() => {
        setRaisedHands(prev => prev.filter(h => h.userName !== userName));
      }, 30000);
      
      showNotification(`✋ ${userName} raised their hand!`, 'warning');
    });

    socketInstance.on('user-media-updated', ({ userId, type, enabled }) => {
      console.log(`${userId} ${type}: ${enabled ? 'ON' : 'OFF'}`);
      setUsers(prev => prev.map(u => 
        u.userId === userId ? { ...u, [`${type}Enabled`]: enabled } : u
      ));
    });

    socketInstance.on('educator-action', ({ action, value }) => {
      console.log('Educator action:', action, value);
      if (action === 'mute') {
        if (localStream) {
          const audioTrack = localStream.getAudioTracks()[0];
          if (audioTrack) audioTrack.enabled = false;
          setIsAudioOn(false);
        }
        showNotification('Educator muted your audio', 'warning');
      } else if (action === 'remove') {
        showNotification('You have been removed from the class', 'error');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    });

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up SimpleVideoConference');
      if (socketInstance) {
        socketInstance.emit('leave-room', roomId);
        socketInstance.disconnect();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, courseName, isEducatorMode, user?.id, user?.fullName, showNotification]); // FIXED: Added dependencies

  // Media Controls
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        
        socketRef.current?.emit('toggle-media', {
          roomId: roomId,
          type: 'video',
          enabled: videoTrack.enabled
        });
        
        showNotification(videoTrack.enabled ? 'Camera turned on' : 'Camera turned off', 'info');
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
        
        socketRef.current?.emit('toggle-media', {
          roomId: roomId,
          type: 'audio',
          enabled: audioTrack.enabled
        });
        
        showNotification(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted', 'info');
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
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
        
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const stream = localVideoRef.current.srcObject;
          const oldVideoTrack = stream.getVideoTracks()[0];
          
          if (oldVideoTrack) {
            stream.removeTrack(oldVideoTrack);
            stream.addTrack(videoTrack);
          }
          
          socketRef.current?.emit('start-screen-share', roomId);
          showNotification('Screen sharing started', 'info');
          
          videoTrack.onended = () => {
            if (localStream) {
              const cameraTrack = localStream.getVideoTracks()[0];
              if (cameraTrack) {
                stream.removeTrack(videoTrack);
                stream.addTrack(cameraTrack);
                socketRef.current?.emit('stop-screen-share', roomId);
                setIsScreenSharing(false);
                screenStreamRef.current = null;
                showNotification('Screen sharing stopped', 'info');
              }
            }
          };
        }
      } else {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        
        // Switch back to camera
        if (localStream && localVideoRef.current && localVideoRef.current.srcObject) {
          const stream = localVideoRef.current.srcObject;
          const screenTrack = stream.getVideoTracks().find(t => t.label.includes('screen') || t.label.includes('display'));
          
          if (screenTrack) {
            stream.removeTrack(screenTrack);
            const cameraTrack = localStream.getVideoTracks()[0];
            if (cameraTrack) {
              stream.addTrack(cameraTrack);
            }
          }
        }
        
        socketRef.current?.emit('stop-screen-share', roomId);
        setIsScreenSharing(false);
        showNotification('Screen sharing stopped', 'info');
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      if (error.name !== 'NotAllowedError') {
        showNotification('Failed to share screen: ' + error.message, 'error');
      }
    }
  };

  // Chat functions
  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('send-message', {
        roomId: roomId,
        message: newMessage,
        userName: user?.fullName || 'Anonymous',
        isEducator: isEducatorMode
      });
      setNewMessage('');
    }
  };

  const raiseHand = () => {
    if (socketRef.current) {
      socketRef.current.emit('raise-hand', {
        roomId: roomId,
        userName: user?.fullName || 'Anonymous'
      });
      showNotification('Hand raised! The educator will see your request.', 'info');
    }
  };

  // Educator controls
  const muteUser = (userId, userName) => {
    if (socketRef.current && isEducatorMode) {
      socketRef.current.emit('educator-control', {
        roomId: roomId,
        action: 'mute',
        targetUserId: userId,
        value: true
      });
      showNotification(`${userName} has been muted`, 'warning');
    }
  };

  const removeUser = (userId, userName) => {
    if (socketRef.current && isEducatorMode) {
      if (window.confirm(`Are you sure you want to remove ${userName} from the class?`)) {
        socketRef.current.emit('educator-control', {
          roomId: roomId,
          action: 'remove',
          targetUserId: userId,
          value: true
        });
      }
    }
  };

  const leaveClass = () => {
    if (window.confirm('Are you sure you want to leave the class?')) {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', roomId);
        socketRef.current.disconnect();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      window.location.href = '/';
    }
  };

  // Copy room link
  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/video-class/${roomId}`;
    navigator.clipboard.writeText(roomLink)
      .then(() => showNotification('Room link copied to clipboard!', 'info'))
      .catch(err => console.error('Failed to copy:', err));
  };

  return (
    <div className="simple-video-container">
      {/* Connection Status */}
      <div className={`connection-status ${connectionStatus === 'connected' ? 'connection-connected' : 'connection-disconnected'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Header */}
      <div className="video-header">
        <h2>🎥 Live Class: {courseName}</h2>
        <div className="room-info">
          <span>Room: {roomId}</span>
          <span>👥 {users.length} Online</span>
          {isEducatorMode && <span className="educator-badge">Educator Mode</span>}
        </div>
      </div>

      {/* Main Content */}
      <div className="video-main">
        {/* Video Section */}
        <div className="video-section">
          <div className="video-grid">
            {/* Local Video */}
            <div className="video-tile local">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
              />
              <div className="video-label">
                <div className="flex items-center justify-between">
                  <span>👤 {user?.fullName || 'You'} {isEducatorMode && '(Educator)'}</span>
                  <div className="flex gap-1">
                    {isScreenSharing && <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">🖥️ Sharing</span>}
                    {!isVideoOn && <span className="text-xs bg-red-600 px-2 py-0.5 rounded">🚫 Camera</span>}
                    {!isAudioOn && <span className="text-xs bg-red-600 px-2 py-0.5 rounded">🔇 Mic</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Remote Video Placeholder */}
            <div className="video-tile remote">
              <div className="video-placeholder">
                <div className="placeholder-icon">👥</div>
                <p>{users.length - 1 > 0 ? `${users.length - 1} other participants` : 'Waiting for others...'}</p>
                <small className="mt-2">Room ID: {roomId}</small>
                <button 
                  onClick={copyRoomLink}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Copy Invite Link
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="media-controls">
            <button 
              onClick={toggleVideo} 
              className={`control-btn ${isVideoOn ? 'btn-active' : 'btn-muted'}`}
              title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoOn ? '📹 Camera On' : '🚫 Camera Off'}
            </button>
            
            <button 
              onClick={toggleAudio} 
              className={`control-btn ${isAudioOn ? 'btn-active' : 'btn-muted'}`}
              title={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioOn ? '🎤 Mic On' : '🔇 Mic Off'}
            </button>
            
            <button 
              onClick={toggleScreenShare}
              className={`control-btn ${isScreenSharing ? 'btn-muted' : 'btn-share'}`}
              title={isScreenSharing ? 'Stop screen sharing' : 'Share your screen'}
            >
              {isScreenSharing ? '🖥️ Stop Share' : '🖥️ Share Screen'}
            </button>
            
            <button 
              onClick={raiseHand}
              className="control-btn btn-hand"
              title="Raise hand to ask question"
            >
              ✋ Raise Hand
            </button>
            
            <button 
              onClick={leaveClass}
              className="control-btn btn-leave"
              title="Leave the class"
            >
              📞 Leave Class
            </button>
          </div>

          {/* Raised Hands */}
          {raisedHands.length > 0 && (
            <div className="raised-hands-section">
              <h4 className="font-semibold text-yellow-300 mb-2">✋ Raised Hands ({raisedHands.length})</h4>
              <div className="space-y-1">
                {raisedHands.map((hand, idx) => (
                  <div key={idx} className="text-sm text-yellow-200 flex items-center justify-between">
                    <span>{hand.userName}</span>
                    <span className="text-xs text-yellow-400">
                      {Math.floor((new Date() - new Date(hand.timestamp)) / 1000)}s ago
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Participants */}
          <div className="sidebar-section">
            <h3 className="text-lg font-semibold text-white mb-4">👥 Participants ({users.length})</h3>
            <div className="participants-list">
              {users.length === 0 ? (
                <p className="empty-state">No participants yet</p>
              ) : (
                users.map((participant, index) => (
                  <div key={index} className="participant-item">
                    <div className="participant-info">
                      <div className="participant-avatar">
                        {participant.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="participant-details">
                        <span className="participant-name">
                          {participant.userName}
                          {participant.isEducator && ' 👨‍🏫'}
                        </span>
                        <div className="participant-meta">
                          <div className="participant-status">
                            <span className={`status-dot ${participant.videoEnabled ? 'dot-green' : 'dot-red'}`} title="Video"></span>
                            <span className={`status-dot ${participant.audioEnabled ? 'dot-green' : 'dot-red'}`} title="Audio"></span>
                          </div>
                          <span className="join-time">
                            Joined {new Date(participant.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {isEducatorMode && !participant.isEducator && (
                      <div className="educator-controls">
                        <button 
                          onClick={() => muteUser(participant.userId, participant.userName)}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                          title="Mute participant"
                          disabled={!participant.audioEnabled}
                        >
                          {participant.audioEnabled ? 'Mute' : 'Muted'}
                        </button>
                        <button 
                          onClick={() => removeUser(participant.userId, participant.userName)}
                          className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                          title="Remove participant"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Educator Features */}
          {isEducatorMode && (
            <>
              <AttendanceTracker 
                roomId={roomId}
                users={users}
                isEducatorMode={isEducatorMode}
              />
              
              <RecordingManager 
                localStream={localStream}
                roomId={roomId}
                isEducatorMode={isEducatorMode}
              />
            </>
          )}

          {/* Chat */}
          <div className="sidebar-section chat-section">
            <h3 className="text-lg font-semibold text-white mb-4">💬 Chat ({messages.length})</h3>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <p className="empty-state">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.isEducator ? 'educator-msg' : ''}`}>
                    <div className="message-header">
                      <div className="flex items-center gap-2">
                        <strong className={msg.isEducator ? 'text-yellow-300' : 'text-blue-300'}>
                          {msg.userName}
                        </strong>
                        {msg.isEducator && <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded">Educator</span>}
                      </div>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="message-text">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message here..."
                className="chat-input-field"
              />
              <button 
                onClick={sendMessage}
                className="chat-send-btn"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleVideoConference;