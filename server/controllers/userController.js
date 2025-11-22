import User from "../models/User.js";
import Course from "../models/Course.js";
import { CourseProgress } from "../models/CourseProgress.js";

// Get users data
export const getUserData = async (req, res) => {
    try {
        // FIX: Use req.auth directly (not as function) since we're using mock auth
        const auth = req.auth;
        const userId = auth?.userId || 'mock_user_id';
        console.log("🔍 Fetching user data for userId:", userId);
        
        let user = await User.findById(userId);
        
        // If user doesn't exist, create them
        if (!user) {
            console.log("📋 User not found in database, creating new user...");
            
            user = await User.create({
                _id: userId,
                name: auth?.fullName || 'Test User',
                email: auth?.primaryEmailAddress?.emailAddress || 'test@example.com',
                imageUrl: auth?.imageUrl || '/default-avatar.png',
                role: auth?.publicMetadata?.role || 'student'
            });
            
            console.log("✅ New user created:", user.name);
        } else {
            console.log("✅ Found existing user:", user.name);
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error("❌ Error in getUserData:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// User enrolled courses
export const userEnrolledCourses = async (req, res) => {
    try {
        const auth = req.auth; // FIX: Use req.auth directly
        const userId = auth?.userId || 'mock_user_id';
        const userData = await User.findById(userId).populate('enrolledCourses');
        
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ success: true, enrolledCourses: userData.enrolledCourses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Purchase course (free enrollment)
export const purchaseCourse = async (req, res) => {
    try {
        const auth = req.auth; // FIX: Use req.auth directly
        const userId = auth?.userId || 'mock_user_id';
        const { courseId } = req.body;

        console.log("🛒 Purchase request:", { userId, courseId });

        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);
        
        if (!userData || !courseData) {
            return res.json({ success: false, message: "User or course not found" });
        }

        // Check if already enrolled
        if (userData.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: "Already enrolled in this course" });
        }

        // Add user to enrolled students
        if (!courseData.enrolledStudents.includes(userId)) {
            courseData.enrolledStudents.push(userId);
            await courseData.save();
        }

        // Add course to user's enrolled courses
        userData.enrolledCourses.push(courseId);
        await userData.save();

        console.log("✅ Enrollment successful");
        res.json({ success: true, message: "Course enrolled successfully!" });

    } catch (error) {
        console.error("❌ Purchase error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update user Course progress
export const updateUserCourseProgress = async (req, res) => {
    try {
        const auth = req.auth; // FIX: Use req.auth directly
        const userId = auth?.userId || 'mock_user_id';
        const { courseId, lectureId } = req.body;
        
        let progressData = await CourseProgress.findOne({ userId, courseId });

        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: "Lecture Already Completed" });
            }
            
            progressData.lectureCompleted.push(lectureId);
            progressData.completed = true;
            await progressData.save();
        } else {
            progressData = await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            });
        }
        
        res.json({ success: true, message: 'Progress Updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get user course progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const auth = req.auth; // FIX: Use req.auth directly
        const userId = auth?.userId || 'mock_user_id';
        const { courseId } = req.body;
        
        const progressData = await CourseProgress.findOne({ userId, courseId });
        res.json({ success: true, progressData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Add user ratings to course
export const addUserRating = async (req, res) => {
    try {
        const auth = req.auth; // FIX: Use req.auth directly
        const userId = auth?.userId || 'mock_user_id';
        const { courseId, rating } = req.body;

        if (!courseId || !rating || rating < 1 || rating > 5) {
            return res.json({ success: false, message: "Invalid rating data" });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.json({ success: false, message: "Course not found" });
        }

        const user = await User.findById(userId);
        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: "User has not purchased this course" });
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId);
        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            course.courseRatings.push({ userId, rating });
        }

        await course.save();
        res.json({ success: true, message: "Rating Added" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}