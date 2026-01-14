import express from 'express';
import { getAllUsers, updateUserRole, deleteUser, getAdminDashboardData } from '../controllers/adminController.js';

const adminRouter = express.Router();

// Admin middleware to check if user is admin
const adminAuth = async (req, res, next) => {
    console.log('🔐 Admin auth middleware called (demo mode - allowing all users)');
    // For demo purposes, allow all authenticated users to access admin
    next();
};

// Apply admin auth to all routes
adminRouter.use(adminAuth);

// Get admin dashboard data
adminRouter.get('/dashboard', getAdminDashboardData);

// Get all users
adminRouter.get('/users', getAllUsers);

// Update user role
adminRouter.put('/users/role', updateUserRole);

// Delete user
adminRouter.delete('/users/:userId', deleteUser);

export default adminRouter;
