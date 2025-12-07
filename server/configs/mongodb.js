// server/configs/mongodb.js
import mongoose from "mongoose";

// Connect to MongoDB database with better error handling
const connectDB = async () => {
    try {
        // Set mongoose options
        mongoose.set('strictQuery', true);
        
        // Connection events
        mongoose.connection.on('connected', () => {
            console.log('✅ Database connected successfully!');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ Database connection error:', err.message);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ Database disconnected');
        });
        
        // Connection options
        const options = {
            serverSelectionTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        };
        
        // Check if MongoDB URI exists
        if (!process.env.MONGODB_URI) {
            console.log('⚠️ MONGODB_URI not found in environment variables');
            console.log('ℹ️ Server will run without database connection');
            return;
        }
        
        console.log('🔄 Connecting to MongoDB...');
        
        await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log('✅ MongoDB connected successfully!');
        
    } catch (error) {
        console.error('💥 MongoDB connection failed:', error.message);
        console.log('⚠️ Server will run with limited functionality (no database)');
        // Don't throw error to allow server to start
    }
}

export default connectDB;