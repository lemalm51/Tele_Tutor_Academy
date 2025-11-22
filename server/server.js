import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js';
import connectCloudinay from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import educatorRouter from './routes/educatorRoutes.js';
import { seedSampleData } from './seedData.js';

// Initialize express 
const app = express();

// Connect to db
await connectDB();
await connectCloudinay();

// Seed sample data after database connection
await seedSampleData();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Server is working!' });
});

// Public routes
app.use('/api/course', courseRouter);

// Mock auth middleware - UPDATED with educator role
const mockAuth = (req, res, next) => {
    req.auth = {
        userId: 'user_35nUwHrNypikUQof05Wmu5VeGMv',
        fullName: 'Test User',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        imageUrl: '/default-avatar.png',
        publicMetadata: { role: 'educator' } // Changed to educator
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
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log('🔧 Development mode with mock authentication');
    console.log('🖼️  Cloudinary disabled - using placeholder images');
    console.log('📚 Available API endpoints:');
    console.log('   - GET  /api/test');
    console.log('   - GET  /api/course/all');
    console.log('   - GET  /api/course/:id');
    console.log('   - GET  /api/user/data');
    console.log('   - GET  /api/user/enrolled-courses');
    console.log('   - POST /api/user/purchase');
    console.log('   - GET  /api/educator/courses');
});