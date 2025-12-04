import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import educatorRouter from './routes/educatorRoutes.js';
import { seedSampleData } from './seedData.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import recordingRouter from './routes/recordingRoutes.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const recordingsDir = path.join(uploadsDir, 'recordings');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }
  
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
    console.log('📁 Created recordings directory');
  }
};

// Call this before routes
ensureUploadsDir();

// Initialize express 
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io WITH PROPER CONFIG
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:5175"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

// Connect to db and cloudinary
await connectDB();
await connectCloudinary();

// Seed sample data after database connection
await seedSampleData();

// CORS configuration for REST API
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server of STEMA is working!' });
});

// Socket.io connection test
app.get('/api/socket-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Socket.io server is running',
    connectedClients: io.engine.clientsCount,
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
      socket_test: 'GET /api/socket-test',
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
app.use('/api/recordings', recordingRouter);

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

// ==================== SOCKET.IO VIDEO CONFERENCING ====================

// Store active rooms and users
const activeRooms = new Map(); // roomId -> {users: Map, educator: socketId}
const userSocketMap = new Map(); // userId -> socketId
app.use('/uploads', express.static('uploads'));

// Add connection state tracking
const connectionState = new Map(); // socketId -> { connectedAt, lastPing }

io.on('connection', (socket) => {
  console.log('🎥 New socket connection:', socket.id);
  
  // Track connection
  connectionState.set(socket.id, {
    connectedAt: new Date(),
    lastPing: Date.now(),
    userId: null
  });

  // Send welcome message
  socket.emit('welcome', { 
    message: 'Connected to STEMA video server',
    socketId: socket.id,
    serverTime: new Date().toISOString()
  });

  // Set up heartbeat
  const heartbeatInterval = setInterval(() => {
    socket.emit('ping', { timestamp: Date.now() });
  }, 15000);

  socket.on('pong', (data) => {
    const state = connectionState.get(socket.id);
    if (state) {
      state.lastPing = Date.now();
    }
    console.log(`❤️ Heartbeat from ${socket.id}`);
  });

  // Join a video room
  socket.on('join-room', (data) => {
    try {
      const { roomId, userId, userName, isEducator } = data;
      
      console.log(`${userName} (${userId}) attempting to join room ${roomId}`);
      
      // Update connection state
      const state = connectionState.get(socket.id);
      if (state) {
        state.userId = userId;
      }
      
      // Initialize room if it doesn't exist
      if (!activeRooms.has(roomId)) {
        console.log(`Creating new room: ${roomId}`);
        activeRooms.set(roomId, {
          users: new Map(),
          educator: isEducator ? socket.id : null,
          createdAt: new Date(),
          roomName: data.roomName || 'Live Class'
        });
      }

      const room = activeRooms.get(roomId);
      
      // Ensure users Map exists
      if (!room.users) {
        room.users = new Map();
      }
      
      // Add user to room
      room.users.set(socket.id, {
        userId,
        userName,
        socketId: socket.id,
        isEducator: !!isEducator,
        joinedAt: new Date(),
        videoEnabled: true,
        audioEnabled: true
      });

      userSocketMap.set(userId, socket.id);
      socket.join(roomId);

      // Notify room about new user
      socket.to(roomId).emit('user-connected', {
        userId,
        userName,
        socketId: socket.id,
        isEducator
      });

      // Send existing users to the new user (excluding self)
      const existingUsers = Array.from(room.users.entries())
        .filter(([socketId, userData]) => socketId !== socket.id)
        .map(([_, userData]) => userData);
      
      socket.emit('existing-users', existingUsers);

      // Update room info for all users
      const allUsers = Array.from(room.users.values());
      io.to(roomId).emit('room-update', {
        totalUsers: room.users.size,
        users: allUsers,
        roomName: room.roomName
      });

      console.log(`✅ ${userName} joined room ${roomId} (${room.users.size} users)`);
      
    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room', error: error.message });
    }
  });

  // WebRTC Signaling
  socket.on('signal', (data) => {
    try {
      const { to, signal, from } = data;
      console.log(`📡 Signal from ${from} to ${to}`);
      io.to(to).emit('signal', { signal, from });
    } catch (error) {
      console.error('Error in signal:', error);
    }
  });

  // Toggle video/audio
  socket.on('toggle-media', (data) => {
    try {
      const { roomId, type, enabled } = data;
      const room = activeRooms.get(roomId);
      
      if (room && room.users && room.users.has(socket.id)) {
        const user = room.users.get(socket.id);
        if (type === 'video') user.videoEnabled = enabled;
        if (type === 'audio') user.audioEnabled = enabled;
        
        socket.to(roomId).emit('user-media-updated', {
          userId: user.userId,
          type,
          enabled
        });
      }
    } catch (error) {
      console.error('Error in toggle-media:', error);
    }
  });

  // Educator controls
  socket.on('educator-control', (data) => {
    try {
      const { roomId, action, targetUserId, value } = data;
      const room = activeRooms.get(roomId);
      
      console.log(`🎓 Educator control: ${action} on ${targetUserId}`);
      
      if (room && room.educator === socket.id) {
        const targetSocketId = userSocketMap.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('educator-action', {
            action,
            value
          });
        }
      }
    } catch (error) {
      console.error('Error in educator-control:', error);
    }
  });

  // Chat messages
  socket.on('send-message', (data) => {
    try {
      const { roomId, message, userName } = data;
      const messageData = {
        id: Date.now().toString(),
        userId: socket.id,
        userName,
        message,
        timestamp: new Date(),
        isEducator: data.isEducator || false
      };
      
      console.log(`💬 Chat from ${userName} in ${roomId}: ${message}`);
      io.to(roomId).emit('new-message', messageData);
    } catch (error) {
      console.error('Error in send-message:', error);
    }
  });

  // Raise hand
  socket.on('raise-hand', (data) => {
    try {
      const { roomId, userName } = data;
      console.log(`✋ ${userName} raised hand in ${roomId}`);
      socket.to(roomId).emit('hand-raised', {
        userId: socket.id,
        userName,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in raise-hand:', error);
    }
  });

  // Screen sharing
  socket.on('start-screen-share', (roomId) => {
    try {
      console.log(`🖥️ ${socket.id} started screen share in ${roomId}`);
      socket.to(roomId).emit('user-started-screen-share', socket.id);
    } catch (error) {
      console.error('Error in start-screen-share:', error);
    }
  });

  socket.on('stop-screen-share', (roomId) => {
    try {
      console.log(`🖥️ ${socket.id} stopped screen share in ${roomId}`);
      socket.to(roomId).emit('user-stopped-screen-share', socket.id);
    } catch (error) {
      console.error('Error in stop-screen-share:', error);
    }
  });

  // Get room info
  socket.on('get-room-info', (roomId) => {
    try {
      const room = activeRooms.get(roomId);
      if (room) {
        socket.emit('room-info', {
          totalUsers: room.users ? room.users.size : 0,
          users: room.users ? Array.from(room.users.values()) : [],
          roomName: room.roomName,
          createdAt: room.createdAt
        });
      }
    } catch (error) {
      console.error('Error in get-room-info:', error);
    }
  });

  // Leave room
  socket.on('leave-room', (roomId) => {
    try {
      const room = activeRooms.get(roomId);
      if (room && room.users && room.users.has(socket.id)) {
        const user = room.users.get(socket.id);
        room.users.delete(socket.id);
        
        // Notify room
        socket.to(roomId).emit('user-disconnected', {
          userId: user.userId,
          userName: user.userName
        });

        // Update room
        io.to(roomId).emit('room-update', {
          totalUsers: room.users.size,
          users: Array.from(room.users.values()),
          roomName: room.roomName
        });

        // Clean up empty rooms
        if (room.users.size === 0) {
          console.log(`🗑️ Deleting empty room: ${roomId}`);
          activeRooms.delete(roomId);
        }
        
        socket.leave(roomId);
        console.log(`🚪 ${user.userName} left room ${roomId}`);
      }
    } catch (error) {
      console.error('Error in leave-room:', error);
    }
  });

  // Disconnect handler - ONLY ONE PLACE!
  socket.on('disconnect', (reason) => {
    try {
      console.log(`❌ User disconnected: ${socket.id}, Reason: ${reason}`);
      
      // Clear heartbeat interval
      clearInterval(heartbeatInterval);
      
      // Find and remove user from all rooms
      for (const [roomId, room] of activeRooms.entries()) {
        if (room.users && room.users.has(socket.id)) {
          const user = room.users.get(socket.id);
          room.users.delete(socket.id);
          
          // Notify room about user disconnect
          socket.to(roomId).emit('user-disconnected', {
            userId: user.userId,
            userName: user.userName,
            reason: reason
          });

          // Update room
          io.to(roomId).emit('room-update', {
            totalUsers: room.users.size,
            users: Array.from(room.users.values()),
            roomName: room.roomName
          });

          // Clean up empty rooms
          if (room.users.size === 0) {
            console.log(`🗑️ Deleting empty room: ${roomId}`);
            activeRooms.delete(roomId);
          }
          
          console.log(`🗑️ Removed ${user.userName} from room ${roomId}`);
        }
      }

      // Remove from userSocketMap
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`🗑️ Removed user mapping for ${userId}`);
          break;
        }
      }
      
      // Remove from connection state
      connectionState.delete(socket.id);
      
      console.log(`📊 Active connections: ${io.engine.clientsCount}`);
      
    } catch (error) {
      console.error('Error in disconnect handler:', error);
    }
  });
});

// ==================== END SOCKET.IO ====================

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
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
console.log('🔧 Starting server on port:', PORT);

httpServer.listen(PORT, () => {
  console.log(`✅ HTTP Server running on port ${PORT}`);
  console.log(`✅ WebSocket Server ready at ws://localhost:${PORT}`);
  console.log('✅ Database connected successfully!');
  console.log('✅ Cloudinary connected successfully!');
});

// Clean up function
process.on('SIGINT', () => {
  console.log('\n🔻 Shutting down server...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Export the app for Vercel
export default app;