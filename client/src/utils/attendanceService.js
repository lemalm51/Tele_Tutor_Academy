// Simulated attendance storage (in production, use backend API)
let attendanceRecords = [];

export const saveAttendance = (attendanceData) => {
  attendanceRecords.push(attendanceData);
  
  // Keep only last 100 records
  if (attendanceRecords.length > 100) {
    attendanceRecords = attendanceRecords.slice(-100);
  }
  
  // In production, send to backend API
  console.log('Attendance saved:', attendanceData);
  
  // Example API call:
  // fetch('/api/attendance/save', {
  //   method: 'POST',
  //   headers: {'Content-Type': 'application/json'},
  //   body: JSON.stringify(attendanceData)
  // });
  
  return true;
};

export const getAttendanceReport = async (roomId, courseId) => {
  // Filter records for this room
  const roomRecords = attendanceRecords.filter(r => r.roomId === roomId);
  
  if (roomRecords.length === 0) {
    return {
      roomId,
      courseId,
      totalParticipants: 0,
      totalDuration: 0,
      startTime: new Date(),
      endTime: new Date(),
      participants: []
    };
  }
  
  // Calculate participation
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
    courseId,
    totalParticipants: participants.length,
    totalDuration: participants.reduce((sum, p) => sum + p.duration, 0),
    startTime: roomRecords[0].timestamp,
    endTime: roomRecords[roomRecords.length - 1].timestamp,
    participants: participants.sort((a, b) => b.duration - a.duration)
  };
};

// Export attendance data
export const exportAttendanceData = () => {
  return JSON.stringify(attendanceRecords, null, 2);
};

// Clear attendance data
export const clearAttendanceData = () => {
  attendanceRecords = [];
};