import Course from '../models/Course.js';
import User from '../models/User.js';
import { Purchase } from '../models/Purchase.js';

// Get educator courses
export const getEducatorCourses = async (req, res) => {
    try {
        const auth = req.auth;
        const educator = auth?.userId || 'mock_educator_id';
        console.log("🔍 Fetching courses for educator:", educator);
        
        const courses = await Course.find({ educator });
        
        console.log(`✅ Found ${courses.length} courses for educator`);
        return res.json({ success: true, courses });
    } catch (error) {
        console.error("❌ Error fetching educator courses:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Add new course 
export const addCourse = async (req, res) => {
    try {
        const auth = req.auth;
        const educatorId = auth?.userId || 'mock_educator_id';
        const { courseData } = req.body;

        console.log("📝 Adding course for educator:", educatorId);

        if (!courseData) {
            return res.json({ success: false, message: "Course data is required" });
        }

        const parsedCourseData = JSON.parse(courseData);
        parsedCourseData.educator = educatorId;
        parsedCourseData.courseThumbnail = "https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Course+Thumbnail";

        const newCourse = await Course.create(parsedCourseData);
        await newCourse.save();

        return res.json({ success: true, message: "Course Added", course: newCourse });

    } catch (error) {
        console.error("❌ Add course error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Get educator dashboard data
export const educatorDashboardData = async (req, res) => {
    try {
        const auth = req.auth;
        const educator = auth?.userId || 'mock_educator_id';
        const courses = await Course.find({ educator });
        const totalCourses = courses.length;

        let totalEarnings = 0;
        courses.forEach(course => {
            totalEarnings += course.enrolledStudents.length;
        });

        const enrolledStudentsData = [];
        for (const course of courses) {
            const students = await User.find({
                _id: { $in: course.enrolledStudents }
            }, 'name imageUrl');

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }

        return res.json({
            success: true,
            dashboardData: {
                totalEarnings,
                enrolledStudentsData,
                totalCourses
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Get Enrolled Students Data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const auth = req.auth;
        const educator = auth?.userId || 'mock_educator_id';
        const courses = await Course.find({ educator });

        const enrolledStudents = [];
        for (const course of courses) {
            const students = await User.find({
                _id: { $in: course.enrolledStudents }
            }, 'name imageUrl');

            students.forEach(student => {
                enrolledStudents.push({
                    student,
                    courseTitle: course.courseTitle,
                    purchaseDate: course.createdAt
                });
            });
        }

        return res.json({ success: true, enrolledStudents });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Update role to educator
export const updateRoleToEducator = async (req, res) => {
    try {
        const auth = req.auth;
        const userId = auth?.userId || 'mock_user_id';

        await User.findByIdAndUpdate(userId, { role: 'educator' });

        return res.json({ success: true, message: 'You can publish courses now!' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}