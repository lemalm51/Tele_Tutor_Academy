import express from 'express';
import Attendance from '../models/Attendance.js';

const attendanceRouter = express.Router();

// Save attendance record
attendanceRouter.post('/save', async (req, res) => {
  try {
    const attendance = await Attendance.create(req.body);
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance report for a room
attendanceRouter.get('/report/:roomId', async (req, res) => {
  try {
    const records = await Attendance.find({ roomId: req.params.roomId })
      .sort({ timestamp: 1 });
    
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance for a course
attendanceRouter.get('/course/:courseId', async (req, res) => {
  try {
    const records = await Attendance.find({ courseId: req.params.courseId })
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default attendanceRouter;