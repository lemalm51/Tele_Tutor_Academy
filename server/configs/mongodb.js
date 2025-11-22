import mongoose from "mongoose";

// connect to mongoDb database
const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Database connected successfully!'));
        
        // Add options to handle write concern issues
        await mongoose.connect(`${process.env.MONGODB_URI}`, {
            // Remove write concern to avoid the error
            writeConcern: { w: 1 }, // Use basic write concern
            retryWrites: true,
            w: 'majority'
        });
        
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}

export default connectDB;