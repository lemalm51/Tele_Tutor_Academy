// server/server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import educatorRouter from './routes/educatorRoutes.js';
import { seedSampleData } from './seedData.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express 
const app = express();

// Configure CORS for Vercel
const allowedOrigins = [
  'https://stema.vercel.app',
  'https://stema-lms.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory (for local development)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: '🚀 Server of STEMA is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ROOT ROUTE
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: '🚀 STEMA LMS Backend API is running!',
    status: 'active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      test: 'GET /api/test',
      health: 'GET /api/health',
      courses: 'GET /api/course/all',
      course_by_id: 'GET /api/course/:id',
      user_data: 'GET /api/user/data (protected)',
      educator_courses: 'GET /api/educator/courses (protected)'
    }
  });
});

// Database and service connection with error handling
const startServices = async () => {
  try {
    // Connect to db and cloudinary
    await connectDB();
    await connectCloudinary();
    
    // Seed sample data after database connection
    await seedSampleData();
    
    console.log('✅ Database and services connected successfully!');
  } catch (error) {
    console.error('⚠️ Failed to connect to some services:', error.message);
    // Don't crash - allow server to start with limited functionality
  }
};

// Initialize services
startServices();

// Mock auth middleware (for Vercel deployment)
const mockAuth = (req, res, next) => {
  // For Vercel deployment, we'll use a simplified mock auth
  // In production, you should use Clerk's actual middleware
  req.auth = {
    userId: process.env.USER_ID || 'user_35nUwHrNypikUQof05Wmu5VeGMv',
    fullName: 'Test User',
    primaryEmailAddress: { emailAddress: 'test@example.com' },
    imageUrl: '/default-avatar.png',
    publicMetadata: { role: 'educator' }
  };
  next();
};

// Public routes (no auth required)
app.use('/api/course', courseRouter);

// Protected routes (use mock auth for now)
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
  console.error('❌ Server Error:', err.message);
  
  // CORS error
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      success: false, 
      message: 'CORS Error: Request blocked by CORS policy' 
    });
  }
  
  // General error
  res.status(err.status || 500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Export the app for Vercel
export default app;

// Only listen locally when not on Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running locally on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}