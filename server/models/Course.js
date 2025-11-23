import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    lectureId: {type: String, required: true},
    lectureTitle: {type: String, required: true},
    lectureDuration: {type: Number, required: true},
    lectureUrl: {type: String, required: true},
    isPreviewFree: {type: Boolean, default: true},
    lectureOrder: {type: Number, required: true},

},{_id: false});

const chapterSchema = new mongoose.Schema({
    chapterId: {type: String, required: true},
    chapterOrder: {type: Number, required: true},
    chapterTitle: {type: String, required: true},
    chapterContent: [lectureSchema]
},{_id: false});

const courseSchema = new mongoose.Schema({
    courseTitle: {type: String, required: true},
    courseDescription: {type: String, required: true},
    courseThumbnail: {type: String},
    coursePrice: {type: Number, default: 0}, // All courses free by default
    isPublished: { type: Boolean, default: true },
    discount: {type: Number, default: 0}, // No discounts needed
    courseContent: [chapterSchema],
    // REMOVED: courseRatings field entirely
    educator:{ type: String, ref: 'User', required: true},
    enrolledStudents: [
        {type: String, ref: 'User'}
    ]
},{timestamps: true, minimize: false})

const Course = mongoose.model('Course', courseSchema)
export default Course;