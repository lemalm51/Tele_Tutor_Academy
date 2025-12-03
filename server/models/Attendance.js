import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  courseId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  participants: [{
    userId: String,
    userName: String,
    isEducator: Boolean,
    joinedAt: Date
  }]
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;