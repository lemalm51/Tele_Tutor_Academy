import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import educatorRouter from './routes/educatorRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import { seedSampleData } from './seedData.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express 
const app = express();
const httpServer = createServer(app);

// Configure CORS for Vercel
const allowedOrigins = [
  'https://stema.vercel.app',
  'https://stema-lms.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Configure Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store room users
const roomUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ WebSocket client connected:', socket.id);

  socket.on('join-room', (userData) => {
    const { roomId, userId, userName, isEducator, roomName } = userData;

    // Join the room
    socket.join(roomId);

    // Add user to room tracking
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }

    const userInfo = {
      userId,
      userName,
      isEducator,
      joinedAt: new Date().toISOString(),
      socketId: socket.id,
      videoEnabled: true,
      audioEnabled: true
    };

    roomUsers.get(roomId).set(userId, userInfo);

    // Emit to others in the room
    socket.to(roomId).emit('user-connected', userInfo);

    // Send room update to all clients in the room
    const usersInRoom = Array.from(roomUsers.get(roomId).values());
    io.to(roomId).emit('room-update', { users: usersInRoom });

    console.log(`User ${userName} (${userId}) joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    if (roomUsers.has(roomId)) {
      const roomMap = roomUsers.get(roomId);
      let userIdToRemove = null;

      // Find user by socket ID
      for (const [userId, userInfo] of roomMap.entries()) {
        if (userInfo.socketId === socket.id) {
          userIdToRemove = userId;
          break;
        }
      }

      if (userIdToRemove) {
        const userInfo = roomMap.get(userIdToRemove);
        roomMap.delete(userIdToRemove);

        // Emit user disconnected
        socket.to(roomId).emit('user-disconnected', userInfo);

        // Send room update
        const usersInRoom = Array.from(roomMap.values());
        io.to(roomId).emit('room-update', { users: usersInRoom });

        console.log(`User ${userInfo.userName} left room ${roomId}`);
      }
    }

    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket client disconnected:', socket.id);

    // Remove user from all rooms
    for (const [roomId, roomMap] of roomUsers.entries()) {
      let userIdToRemove = null;
      let userInfo = null;

      for (const [userId, info] of roomMap.entries()) {
        if (info.socketId === socket.id) {
          userIdToRemove = userId;
          userInfo = info;
          break;
        }
      }

      if (userIdToRemove) {
        roomMap.delete(userIdToRemove);

        // Emit user disconnected
        socket.to(roomId).emit('user-disconnected', userInfo);

        // Send room update
        const usersInRoom = Array.from(roomMap.values());
        io.to(roomId).emit('room-update', { users: usersInRoom });

        console.log(`User ${userInfo.userName} disconnected from room ${roomId}`);
      }
    }
  });

  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    const { targetUserId, offer, roomId } = data;
    // Find the sender's userId from the room
    let fromUserId = null;
    if (roomUsers.has(roomId)) {
      const roomMap = roomUsers.get(roomId);
      for (const [userId, userInfo] of roomMap.entries()) {
        if (userInfo.socketId === socket.id) {
          fromUserId = userId;
          break;
        }
      }
    }
    socket.to(roomId).emit('offer', { offer, fromUserId });
  });

  socket.on('answer', (data) => {
    const { targetUserId, answer, roomId } = data;
    // Find the sender's userId from the room
    let fromUserId = null;
    if (roomUsers.has(roomId)) {
      const roomMap = roomUsers.get(roomId);
      for (const [userId, userInfo] of roomMap.entries()) {
        if (userInfo.socketId === socket.id) {
          fromUserId = userId;
          break;
        }
      }
    }
    socket.to(roomId).emit('answer', { answer, fromUserId });
  });

  socket.on('ice-candidate', (data) => {
    const { targetUserId, candidate, roomId } = data;
    // Find the sender's userId from the room
    let fromUserId = null;
    if (roomUsers.has(roomId)) {
      const roomMap = roomUsers.get(roomId);
      for (const [userId, userInfo] of roomMap.entries()) {
        if (userInfo.socketId === socket.id) {
          fromUserId = userId;
          break;
        }
      }
    }
    socket.to(roomId).emit('ice-candidate', { candidate, fromUserId });
  });

  // Handle media toggle
  socket.on('toggle-media', (data) => {
    const { roomId, type, enabled } = data;

    if (roomUsers.has(roomId)) {
      const roomMap = roomUsers.get(roomId);

      // Find user by socket ID
      for (const [userId, userInfo] of roomMap.entries()) {
        if (userInfo.socketId === socket.id) {
          userInfo[`${type}Enabled`] = enabled;
          break;
        }
      }

      // Send room update
      const usersInRoom = Array.from(roomMap.values());
      io.to(roomId).emit('room-update', { users: usersInRoom });

      // Emit media update
      socket.to(roomId).emit('user-media-updated', { userId: null, type, enabled });
    }
  });

  // Handle messages
  socket.on('send-message', (messageData) => {
    const { roomId, message, userName, isEducator } = messageData;

    const messageObj = {
      message,
      userName,
      isEducator,
      timestamp: new Date().toISOString()
    };

    io.to(roomId).emit('new-message', messageObj);
  });

  // Handle raise hand
  socket.on('raise-hand', (handData) => {
    const { roomId, userName } = handData;

    socket.to(roomId).emit('hand-raised', {
      userName,
      timestamp: new Date().toISOString()
    });
  });

  // Handle educator controls
  socket.on('educator-control', (controlData) => {
    const { roomId, action, targetUserId, value } = controlData;

    socket.to(roomId).emit('educator-action', { action, value });
  });

  // Handle screen sharing
  socket.on('start-screen-share', (roomId) => {
    socket.to(roomId).emit('screen-share-started', { userId: null });
  });

  socket.on('stop-screen-share', (roomId) => {
    socket.to(roomId).emit('screen-share-stopped', { userId: null });
  });
});

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
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
const mockAuth = async (req, res, next) => {
  // For Vercel deployment, we'll use a simplified mock auth
  // In production, you should use Clerk's actual middleware

  // Try to get userId from Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  let originalUserId = process.env.USER_ID || 'user_35nUwHrNypikUQof05Wmu5VeGMv';
  let userId = originalUserId;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Decode the JWT token to get user info (simplified for demo)
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      originalUserId = token; // Store the original token as originalUserId

      // Check if token is one of the admin user IDs
      const adminUserIds = ['user_35nUwHrNypikUQof05Wmu5VeGMv', 'user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V', 'user_2qjlgkAqIMpiR2flWIRzvWKtE0w'];
      if (adminUserIds.includes(token)) {
        userId = token; // Use the token directly if it's an admin user ID
      } else if (token && token.length > 10) {
        // Use token as userId for uniqueness - ensure it's consistent
        userId = 'user_' + Buffer.from(token.substring(0, 20)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
      }
    } catch (error) {
      console.log('Token parsing error:', error.message);
    }
  }

  // Ensure userId is always a valid MongoDB ObjectId format
  if (!userId.match(/^[a-f\d]{24}$/i)) {
    // If not a valid ObjectId, create one from the string
    const crypto = await import('crypto');
    userId = crypto.default.createHash('md5').update(userId).digest('hex').substring(0, 24);
  }

  // Simulate different users with realistic names based on userId
  const mockUsers = {
    'user_35nUwHrNypikUQof05Wmu5VeGMv': {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      imageUrl: 'https://images.clerk.dev/og-image.png'
    },
    'user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V': {
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      imageUrl: 'https://images.clerk.dev/og-image.png'
    },
    'user_2qjlgkAqIMpiR2flWIRzvWKtE0w': {
      fullName: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      imageUrl: 'https://images.clerk.dev/og-image.png'
    }
  };

  const userData = mockUsers[userId] || {
    fullName: 'Demo User',
    email: 'demo@example.com',
    imageUrl: 'https://images.clerk.dev/og-image.png'
  };

  req.auth = {
    userId: userId,
    originalUserId: originalUserId,
    fullName: userData.fullName,
    primaryEmailAddress: { emailAddress: userData.email },
    imageUrl: userData.imageUrl,
    publicMetadata: { role: 'student' }
  };
  next();
};

// Public routes (no auth required)
app.use('/api/course', courseRouter);

// Protected routes (use mock auth for now)
app.use('/api/user', mockAuth, userRouter);
app.use('/api/educator', mockAuth, educatorRouter);
app.use('/api/admin', mockAuth, adminRouter);

// ==================== MOCK ENDPOINTS FOR VIDEO/WEBSOCKET ====================

// FIXED Recordings endpoints - handle both URL patterns
app.get('/api/recordings/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  handleRecordingsRequest(roomId, res);
});

// Handle the pattern with /room/ in the URL
app.get('/api/recordings/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  handleRecordingsRequest(roomId, res);
});

// Helper function for recordings
function handleRecordingsRequest(roomId, res) {
  const mockRecordings = [
    {
      id: 'rec_001',
      roomId: roomId,
      url: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      duration: '01:15:30',
      createdAt: new Date().toISOString(),
      title: `Recording for Room ${roomId}`,
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    },
    {
      id: 'rec_002',
      roomId: roomId,
      url: 'https://res.cloudinary.com/demo/video/upload/sample2.mp4',
      duration: '00:45:20',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      title: 'Previous Session Recording',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg'
    }
  ];
  
  console.log(`📹 Recordings requested for room: ${roomId}`);
  
  res.json({
    success: true,
    recordings: mockRecordings
  });
}

// Mock video rooms endpoint
app.get('/api/video/rooms/:roomId', (req, res) => {
  res.json({
    success: true,
    room: {
      id: req.params.roomId,
      name: `Class Room ${req.params.roomId}`,
      status: 'active',
      participants: Math.floor(Math.random() * 10) + 1,
      isRecording: false,
      startTime: new Date().toISOString(),
      educator: {
        id: 'user_35nUwHrNypikUQof05Wmu5VeGMv',
        name: 'Test Educator',
        avatar: '/default-avatar.png'
      }
    }
  });
});

// Mock create recording endpoint
app.post('/api/recordings/start', (req, res) => {
  res.json({
    success: true,
    message: 'Recording started (mock)',
    recordingId: 'rec_' + Date.now(),
    roomId: req.body.roomId || 'default-room'
  });
});

// Mock stop recording endpoint
app.post('/api/recordings/stop/:recordingId', (req, res) => {
  res.json({
    success: true,
    message: 'Recording stopped (mock)',
    recordingId: req.params.recordingId,
    url: 'https://res.cloudinary.com/demo/video/upload/recording_' + Date.now() + '.mp4'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: {
      root: 'GET /',
      health: 'GET /api/health',
      test: 'GET /api/test',
      allCourses: 'GET /api/course/all',
      courseById: 'GET /api/course/:id',
      userData: 'GET /api/user/data',
      educatorCourses: 'GET /api/educator/courses',
      recordings: 'GET /api/recordings/:roomId',
      videoRooms: 'GET /api/video/rooms/:roomId'
    }
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
  
  // Use httpServer instead of app.listen
  httpServer.listen(PORT, () => {
    console.log(`✅ Server running locally on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server available on ws://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🎯 Endpoints available:`);
    console.log(`   • GET /api/test`);
    console.log(`   • GET /api/health`);
    console.log(`   • GET /api/recordings/:roomId`);
    console.log(`   • GET /api/recordings/room/:roomId`);
    console.log(`   • WebSocket: ws://localhost:${PORT}/socket.io/`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}