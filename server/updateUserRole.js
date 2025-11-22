import mongoose from 'mongoose';
import User from './models/User.js';
import 'dotenv/config';

const updateUserRole = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Update user role to educator
        const result = await User.findByIdAndUpdate(
            'user_35nUwHrNypikUQof05Wmu5VeGMv',
            { role: 'educator' },
            { new: true }
        );
        
        console.log('✅ Updated user role:', result);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateUserRole();