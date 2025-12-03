import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { saveAttendance, getAttendanceReport } from '../../utils/attendanceService';

const AttendanceTracker = ({ roomId, courseId, users }) => {
  const { user } = useUser();
  const [attendance, setAttendance] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);

  // Record attendance periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (users.length > 0) {
        const attendanceData = {
          roomId,
          courseId,
          timestamp: new Date().toISOString(),
          participants: users.map(u => ({
            userId: u.userId,
            userName: u.userName,
            isEducator: u.isEducator,
            joinedAt: u.joinedAt
          }))
        };
        
        saveAttendance(attendanceData);
        setAttendance(prev => [...prev.slice(-19), attendanceData]); // Keep last 20 records
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [roomId, courseId, users]);

  const generateReport = async () => {
    const report = await getAttendanceReport(roomId, courseId);
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
        p.duration > 300000 ? 'Active' : 'Brief' // 5 minutes threshold
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${roomId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="attendance-tracker">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📊 Attendance</h3>
        <div className="flex gap-2">
          <button 
            onClick={generateReport}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Generate Report
          </button>
          <button 
            onClick={exportToCSV}
            disabled={!report}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {showReport && report && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">Attendance Report</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Total Participants: <span className="font-bold">{report.totalParticipants}</span></div>
            <div>Duration: <span className="font-bold">{Math.round(report.totalDuration / 60000)} mins</span></div>
            <div>Start Time: <span className="font-bold">{new Date(report.startTime).toLocaleTimeString()}</span></div>
            <div>End Time: <span className="font-bold">{new Date(report.endTime).toLocaleTimeString()}</span></div>
          </div>
          
          <div className="mt-4 max-h-40 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Name</th>
                  <th className="text-left py-1">Duration</th>
                  <th className="text-left py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.participants.map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-700">
                    <td className="py-1">
                      {p.userName} {p.isEducator && '👨‍🏫'}
                    </td>
                    <td className="py-1">{Math.round(p.duration / 60000)} mins</td>
                    <td className="py-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${p.duration > 300000 ? 'bg-green-500' : 'bg-yellow-500'}`}>
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
        <h4 className="text-sm font-semibold mb-2">Recent Activity</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {attendance.slice().reverse().map((record, idx) => (
            <div key={idx} className="text-xs bg-gray-800 p-2 rounded">
              <span className="text-gray-400">
                {new Date(record.timestamp).toLocaleTimeString()}: 
              </span>
              <span className="ml-2">{record.participants.length} participants</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;