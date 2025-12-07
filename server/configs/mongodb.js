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
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10
        };
        
        // Connect with retry logic
        const maxRetries = 3;
        let retryCount = 0;
        
        const connectWithRetry = async () => {
            try {
                console.log(`🔄 Attempting MongoDB connection (Attempt ${retryCount + 1}/${maxRetries})...`);
                
                await mongoose.connect(process.env.MONGODB_URI, options);
                return true;
            } catch (error) {
                retryCount++;
                console.error(`❌ MongoDB connection attempt ${retryCount} failed:`, error.message);
                
                if (retryCount < maxRetries) {
                    console.log(`⏳ Retrying in 2 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return connectWithRetry();
                } else {
                    throw error;
                }
            }
        };
        
        await connectWithRetry();
        
    } catch (error) {
        console.error('💥 Failed to connect to MongoDB after all retries:', error.message);
        // Don't throw error to allow server to start
        console.log('⚠️ Server will run with limited functionality (no database)');
    }
}

export default connectDB;