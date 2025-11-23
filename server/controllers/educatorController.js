import { cloudinary } from '../configs/cloudinary.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

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

// Add new course - FIXED: Make sure this export exists
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

        // Handle image upload
        if (req.file) {
            try {
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'stema_courses',
                    resource_type: 'image'
                });
                parsedCourseData.courseThumbnail = result.secure_url;
                console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
            } catch (uploadError) {
                console.error('❌ Cloudinary upload failed:', uploadError);
                // Fallback to placeholder
                parsedCourseData.courseThumbnail = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80';
            }
        } else {
            // Use default placeholder image
            parsedCourseData.courseThumbnail = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80';
        }

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