import Course from "../models/Course.js"
import User from "../models/User.js"
import { CourseProgress } from "../models/CourseProgress.js"

// Get users data
export const getUserData = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const user = await User.findById(userId)
        if(!user){
            res.json({success: false, message:"User not found!"})
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

// Purchase course - FREE ENROLLMENT
export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.auth.userId;

        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);
        
        if (!userData || !courseData) {
            return res.json({ success: false, message: "Data Not Found" });
        }

        // Check if already enrolled
        if (userData.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: "Already enrolled in this course" });
        }

        // Free enrollment - just add to user's courses
        userData.enrolledCourses.push(courseId);
        await userData.save();

        // Add user to course's enrolled students
        courseData.enrolledStudents.push(userId);
        await courseData.save();

        res.json({ success: true, message: "Successfully enrolled in course!" });

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