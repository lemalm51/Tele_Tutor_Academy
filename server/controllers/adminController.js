import User from '../models/User.js';
import Course from '../models/Course.js';

// Mock users data for when database is not connected
const mockUsers = [
    {
        _id: 'user_35nUwHrNypikUQof05Wmu5VeGMv',
        name: 'John Doe',
        email: 'john.doe@example.com',
        imageUrl: 'https://images.clerk.dev/og-image.png',
        role: 'admin',
        enrolledCourses: [],
        createdAt: new Date('2024-01-01')
    },
    {
        _id: 'user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        imageUrl: 'https://images.clerk.dev/og-image.png',
        role: 'admin',
        enrolledCourses: [],
        createdAt: new Date('2024-01-02')
    },
    {
        _id: 'user_2qjlgkAqIMpiR2flWIRzvWKtE0w',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        imageUrl: 'https://images.clerk.dev/og-image.png',
        role: 'admin',
        enrolledCourses: [],
        createdAt: new Date('2024-01-03')
    },
    {
        _id: 'user_demo1',
        name: 'Alice Wilson',
        email: 'alice.wilson@example.com',
        imageUrl: 'https://images.clerk.dev/og-image.png',
        role: 'student',
        enrolledCourses: ['course1', 'course2'],
        createdAt: new Date('2024-01-04')
    },
    {
        _id: 'user_demo2',
        name: 'Charlie Brown',
        email: 'charlie.brown@example.com',
        imageUrl: 'https://images.clerk.dev/og-image.png',
        role: 'educator',
        enrolledCourses: [],
        createdAt: new Date('2024-01-05')
    }
];

// Get all users for admin
export const getAllUsers = async (req, res) => {
    try {
        // Check if MongoDB is connected
        const isDbConnected = process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '';

        if (isDbConnected) {
            const users = await User.find({}, 'name email imageUrl role enrolledCourses createdAt')
                .populate('enrolledCourses', 'courseTitle')
                .sort({ createdAt: -1 });

            // Add enrollment count for each user
            const usersWithCount = users.map(user => ({
                ...user.toObject(),
                enrollmentCount: user.enrolledCourses.length
            }));

            console.log(`✅ Found ${usersWithCount.length} users for admin`);
            return res.json({ success: true, users: usersWithCount });
        } else {
            // Return mock users when database is not connected
            const usersWithCount = mockUsers.map(user => ({
                ...user,
                enrollmentCount: user.enrolledCourses.length
            })).sort((a, b) => b.createdAt - a.createdAt);

            console.log(`✅ Found ${usersWithCount.length} mock users for admin`);
            return res.json({ success: true, users: usersWithCount });
        }
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { userId, newRole } = req.body;

        if (!userId || !newRole) {
            return res.json({ success: false, message: "User ID and new role are required" });
        }

        const validRoles = ['student', 'educator', 'admin'];
        if (!validRoles.includes(newRole)) {
            return res.json({ success: false, message: "Invalid role specified" });
        }

        // Check if MongoDB is connected
        const isDbConnected = process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '';

        if (isDbConnected) {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { role: newRole },
                { new: true }
            );

            if (!updatedUser) {
                return res.json({ success: false, message: "User not found" });
            }

            console.log(`✅ Updated user ${updatedUser.name} role to ${newRole}`);
            return res.json({
                success: true,
                message: "User role updated successfully",
                user: updatedUser
            });
        } else {
            // Mock update for when database is not connected
            const userIndex = mockUsers.findIndex(user => user._id === userId);
            if (userIndex === -1) {
                return res.json({ success: false, message: "User not found" });
            }

            // Prevent changing admin role in mock data
            if (mockUsers[userIndex].role === 'admin' && newRole !== 'admin') {
                return res.json({ success: false, message: "Cannot change admin role in mock mode" });
            }

            mockUsers[userIndex].role = newRole;
            console.log(`✅ Mock updated user ${mockUsers[userIndex].name} role to ${newRole}`);
            return res.json({
                success: true,
                message: "User role updated successfully (mock)",
                user: mockUsers[userIndex]
            });
        }
    } catch (error) {
        console.error("❌ Error updating user role:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.json({ success: false, message: "User ID is required" });
        }

        // Check if MongoDB is connected
        const isDbConnected = process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '';

        if (isDbConnected) {
            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.json({ success: false, message: "User not found" });
            }

            // Prevent deleting admin users
            if (user.role === 'admin') {
                return res.json({ success: false, message: "Cannot delete admin users" });
            }

            // Remove user from all enrolled courses
            await Course.updateMany(
                { enrolledStudents: userId },
                { $pull: { enrolledStudents: userId } }
            );

            // Delete the user
            await User.findByIdAndDelete(userId);

            console.log(`✅ Deleted user ${user.name}`);
            return res.json({
                success: true,
                message: "User deleted successfully"
            });
        } else {
            // Mock delete for when database is not connected
            const userIndex = mockUsers.findIndex(user => user._id === userId);
            if (userIndex === -1) {
                return res.json({ success: false, message: "User not found" });
            }

            // Prevent deleting admin users
            if (mockUsers[userIndex].role === 'admin') {
                return res.json({ success: false, message: "Cannot delete admin users" });
            }

            const deletedUser = mockUsers.splice(userIndex, 1)[0];
            console.log(`✅ Mock deleted user ${deletedUser.name}`);
            return res.json({
                success: true,
                message: "User deleted successfully (mock)"
            });
        }
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get admin dashboard data
export const getAdminDashboardData = async (req, res) => {
    try {
        // Check if MongoDB is connected
        const isDbConnected = process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '';

        if (isDbConnected) {
            // Get total users count
            const totalUsers = await User.countDocuments();

            // Get total courses count
            const totalCourses = await Course.countDocuments();

            // Get total enrollments (sum of all enrolled students across courses)
            const courses = await Course.find({}, 'enrolledStudents');
            const totalEnrollments = courses.reduce((sum, course) => sum + course.enrolledStudents.length, 0);

            // Get users by role
            const usersByRole = await User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]);

            const dashboardData = {
                totalUsers,
                totalCourses,
                totalEnrollments,
                usersByRole: usersByRole.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            };

            console.log(`✅ Admin dashboard data retrieved`);
            return res.json({ success: true, dashboardData });
        } else {
            // Return mock dashboard data when database is not connected
            const totalUsers = mockUsers.length;
            const totalCourses = 5; // Mock course count
            const totalEnrollments = mockUsers.reduce((sum, user) => sum + user.enrolledCourses.length, 0);

            // Calculate users by role from mock data
            const usersByRole = mockUsers.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {});

            const dashboardData = {
                totalUsers,
                totalCourses,
                totalEnrollments,
                usersByRole
            };

            console.log(`✅ Mock admin dashboard data retrieved`);
            return res.json({ success: true, dashboardData });
        }
    } catch (error) {
        console.error("❌ Error fetching admin dashboard data:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
