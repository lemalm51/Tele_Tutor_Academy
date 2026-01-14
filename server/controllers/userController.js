import Course from "../models/Course.js"
import User from "../models/User.js"
import { CourseProgress } from "../models/CourseProgress.js"
import { Enrollment } from "../models/Enrollment.js"
// Get users data
export const getUserData = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const user = await User.findById(userId)
        if(!user){
            return res.json({success: false, message:"User not found!"})
        }

        res.json({success: true, user});
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

// User enrolled course with lecture link
export const userEnrolledCourses = async (req,res)=>{
    try {
        const userId = req.auth.userId
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({success:true, enrolledCourses: userData.enrolledCourses})


    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

// Enroll course - FREE ENROLLMENT
export const enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.auth.userId;

        // Log request
        console.log(`ENROLL endpoint called - userId: ${userId}, courseId: ${courseId}`);

        // Quick DB check: if already enrolled, return 409
        try {
            const already = await User.findOne({ _id: userId, enrolledCourses: courseId }).lean();
            if (already) {
                console.log(`ENROLL: user ${userId} already enrolled in ${courseId}`);
                return res.status(409).json({ success: false, message: 'Already enrolled in this course' });
            }
        } catch (dbCheckErr) {
            console.warn('ENROLL: DB pre-check failed:', dbCheckErr.message);
            // continue to attempt enroll
        }

        let userData = await User.findById(userId);
        let courseData = await Course.findById(courseId);

        // If user doesn't exist in DB (dev), create a minimal user record
        if (!userData) {
            userData = await User.create({
                _id: userId,
                name: req.auth.fullName || 'Auto Created User',
                email: req.auth.primaryEmailAddress?.emailAddress || `${userId}@example.com`,
                imageUrl: req.auth.imageUrl || '/default-avatar.png',
                role: 'student',
                enrolledCourses: []
            });
        }

        // If course doesn't exist in DB (dev), create a minimal course so enrollment can proceed
        if (!courseData) {
            courseData = await Course.create({
                _id: courseId,
                courseTitle: 'Imported Course',
                courseDescription: 'Auto-created course for dev enroll',
                courseThumbnail: '',
                coursePrice: 0,
                discount: 0,
                educator: userId,
                enrolledStudents: [],
                courseContent: [],
                isPublished: true
            });
        }

        // Use atomic operations to avoid race conditions and duplicates
        const userUpdate = await User.updateOne(
            { _id: userId },
            { $addToSet: { enrolledCourses: courseId } }
        );

        const courseUpdate = await Course.updateOne(
            { _id: courseId },
            { $addToSet: { enrolledStudents: userId } }
        );

        console.log('ENROLL: userUpdate result:', JSON.stringify(userUpdate));
        console.log('ENROLL: courseUpdate result:', JSON.stringify(courseUpdate));

        // If neither update modified anything, user was already enrolled
        const userModified = userUpdate.modifiedCount && userUpdate.modifiedCount > 0;
        const courseModified = courseUpdate.modifiedCount && courseUpdate.modifiedCount > 0;

        if (!userModified && !courseModified) {
            console.log(`ENROLL: user ${userId} already enrolled in ${courseId}`);
            return res.status(409).json({ success: false, message: "Already enrolled in this course" });
        }

        // Create enrollment record if user was modified
        try {
            let createdEnrollment = null;
            if (userModified) {
                createdEnrollment = await Enrollment.create({ courseId, userId, status: 'enrolled' });
                console.log('ENROLL: created Enrollment id:', createdEnrollment?._id);
            }
            console.log(`ENROLL: user ${userId} successfully enrolled in ${courseId}`);

            // Fetch updated user to return to client for immediate UI update
            try {
                const updatedUser = await User.findById(userId).lean();
                return res.status(201).json({
                    success: true,
                    message: "Successfully enrolled in course!",
                    enrollmentId: createdEnrollment?._id || null,
                    user: updatedUser
                });
            } catch (e) {
                console.warn('ENROLL: failed to fetch updated user for response:', e.message);
                return res.status(201).json({ success: true, message: "Successfully enrolled in course!", enrollmentId: createdEnrollment?._id || null });
            }
        } catch (e) {
            console.error('ENROLL: error creating enrollment record:', e);
            return res.status(500).json({ success: false, message: 'Enrollment failed', error: e.message });
        }

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Update user Course progress
export const updateUserCourseProgress = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const {courseId, lectureId} = req.body
        const progressData = await CourseProgress.findOne({userId, courseId})

        if(progressData){
            if(progressData.lectureCompleted.includes(lectureId)){
                return res.json({success: true, message: "Lecture Already Completed"})
            }
            
            progressData.lectureCompleted.push(lectureId)
            progressData.completed = true
            await progressData.save()
        }
        else{
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]

            })
        }
        res.json({success:true, message: 'Progress Updated'})
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

// get user course progress
export const getUserCourseProgress = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const {courseId} = req.body
        const progressData = await CourseProgress.findOne({userId, courseId})
        res.json({success: true, progressData})
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

// REMOVED: addUserRating function entirely