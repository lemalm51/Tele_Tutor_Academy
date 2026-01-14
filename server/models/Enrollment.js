import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema({
    courseId: {type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true},
    userId: {type: String, ref: 'User', required: true},
    status: {type: String, enum: ['enrolled', 'withdrawn'], default: 'enrolled'},
}, { timestamps: true });

export const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
