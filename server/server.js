import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import educatorRouter from './routes/educatorRoutes.js';
import { seedSampleData } from './seedData.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express 
const app = express();

// Configure CORS for Vercel
const allowedOrigins = [
  'https://stema.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple database connection with retry logic
const startServer = async () => {
  try {
    // Connect to db and cloudinary
    await connectDB();
    await connectCloudinary();
    
    // Seed sample data after database connection
    await seedSampleData();
    
    console.log('✅ Database and services connected successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    // Don't crash on Vercel - allow server to start with limited functionality
  }
};

// Initialize server
startServer();

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server of STEMA is working!',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ROOT ROUTE
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: '🚀 Backend API Server is running!',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      test: 'GET /api/test',
      health: 'GET /api/health',
      courses: 'GET /api/course/all',
      course_by_id: 'GET /api/course/:id',
      user_data: 'GET /api/user/data (protected)',
      educator_courses: 'GET /api/educator/courses (protected)'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Public routes
app.use('/api/course', courseRouter);

// Mock auth middleware (for development)
const mockAuth = (req, res, next) => {
  // For Vercel deployment, we'll use a simplified mock auth
  req.auth = {
    userId: process.env.USER_ID || 'user_35nUwHrNypikUQof05Wmu5VeGMv',
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
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Export for Vercel
export default app;

// Start server locally (won't run on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server running locally on port ${PORT}`);
  });
}