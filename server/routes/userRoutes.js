import express from "express";
import { 
  getUserData, 
  userEnrolledCourses, 
  purchaseCourse, 
  updateUserCourseProgress, 
  getUserCourseProgress 
} from "../controllers/userController.js";
import User from '../models/User.js';

const userRouter = express.Router();

// Your existing routes
userRouter.get('/data', getUserData);
userRouter.get('/enrolled-courses', userEnrolledCourses);
userRouter.post('/purchase', purchaseCourse);
userRouter.post('/update-course-progress', updateUserCourseProgress);
userRouter.post('/get-course-progress', getUserCourseProgress);

// Temporary route to make current user an educator
userRouter.patch('/make-educator', async (req, res) => {
    try {
        const userId = req.auth.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId },
            { role: 'educator' },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "🎉 You are now an educator!",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default userRouter;