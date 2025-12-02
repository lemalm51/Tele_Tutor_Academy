import express from 'express'
import { 
    addCourse, 
    educatorDashboardData, 
    getEducatorCourses, 
    getEnrolledStudentsData, 
    updateRoleToEducator 
} from '../controllers/educatorController.js'
import { protectEducator } from '../middlewares/authMiddleware.js'
import upload from '../configs/multer.js'

const educatorRouter = express.Router()

// Add educator role - Make sure this route exists
educatorRouter.get('/update-role', updateRoleToEducator)

// Add new course
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)

// Get educator courses
educatorRouter.get('/courses', protectEducator, getEducatorCourses)

// Get educator dashboard data
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)

// Get enrolled students data
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)

export default educatorRouter