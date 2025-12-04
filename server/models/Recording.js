import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema({
  filename: { 
    type: String, 
    required: true,
    unique: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  path: { 
    type: String, 
    required: true 
  },
  size: { 
    type: Number, 
    required: true 
  },
  mimetype: { 
    type: String, 
    required: true 
  },
  roomId: { 
    type: String, 
    required: true,
    index: true 
  },
  courseId: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: Number, 
    required: true,
    default: 0 
  },
  isEducator: { 
    type: Boolean, 
    default: false 
  },
  recordingUrl: { 
    type: String, 
    required: true 
  },
  downloadUrl: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String,
    default: '' 
  },
  tags: [{ 
    type: String 
  }],
  thumbnail: { 
    type: String 
  }
}, { 
  timestamps: true 
});

// Create index for faster queries
recordingSchema.index({ roomId: 1, createdAt: -1 });
recordingSchema.index({ courseId: 1, createdAt: -1 });
recordingSchema.index({ userId: 1, createdAt: -1 });

const Recording = mongoose.model('Recording', recordingSchema);
export default Recording;