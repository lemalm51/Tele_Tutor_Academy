import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import educatorRouter from './routes/educatorRoutes.js';
import { seedSampleData } from './seedData.js';

// Initialize express 
const app = express();

// Connect to db and cloudinary
await connectDB();
await connectCloudinary();

// Seed sample data after database connection
await seedSampleData();

// Simple CORS configuration
app.use(cors());

// Middleware
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Server is working!' });
});

// Public routes
app.use('/api/course', courseRouter);

// Mock auth middleware
const mockAuth = (req, res, next) => {
    req.auth = {
        userId: 'user_35nUwHrNypikUQof05Wmu5VeGMv',
        fullName: 'Test User',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        imageUrl: '/default-avatar.png',
        publicMetadata: { role: 'educator' }
    };
    next();
};

// Protected routes
app.use('/api/user', mockAuth, userRouter);
app.use('/api/educator', mockAuth, educatorRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.method} ${req.originalUrl} not found` 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

// Start server
const PORT = process.env.PORT || 3000;
console.log('🔧 Starting server on port:', PORT);

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log('✅ Database connected successfully!');
    console.log('✅ Cloudinary connected successfully!');
});