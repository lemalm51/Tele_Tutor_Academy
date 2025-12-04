import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for recordings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/recordings');
    // Create directory if it doesn't exist
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, 'recording-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  }
});

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const recordingsDir = path.join(uploadsDir, 'recordings');
  
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(recordingsDir, { recursive: true });
    console.log('✅ Recording storage directories created');
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
};

// Get recording file URL
const getRecordingUrl = (filename) => {
  return `/uploads/recordings/${filename}`;
};

// List all recordings
const listRecordings = async (roomId = null) => {
  try {
    const recordingsDir = path.join(__dirname, '../uploads/recordings');
    const files = await fs.readdir(recordingsDir);
    
    const recordings = [];
    for (const file of files) {
      const filePath = path.join(recordingsDir, file);
      const stat = await fs.stat(filePath);
      
      // Parse metadata from filename
      const metadata = {
        filename: file,
        url: getRecordingUrl(file),
        size: stat.size,
        created: stat.birthtime,
        modified: stat.mtime,
        roomId: extractRoomIdFromFilename(file)
      };
      
      if (!roomId || metadata.roomId === roomId) {
        recordings.push(metadata);
      }
    }
    
    return recordings.sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error('Error listing recordings:', error);
    return [];
  }
};

// Extract roomId from filename
const extractRoomIdFromFilename = (filename) => {
  const match = filename.match(/room-([a-zA-Z0-9-]+)/);
  return match ? match[1] : 'unknown';
};

// Delete recording
const deleteRecording = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../uploads/recordings', filename);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting recording:', error);
    return false;
  }
};

// Get recording info
const getRecordingInfo = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../uploads/recordings', filename);
    const stat = await fs.stat(filePath);
    
    return {
      filename,
      url: getRecordingUrl(filename),
      size: stat.size,
      created: stat.birthtime,
      modified: stat.mtime,
      roomId: extractRoomIdFromFilename(filename)
    };
  } catch (error) {
    console.error('Error getting recording info:', error);
    return null;
  }
};

export { 
  upload, 
  ensureUploadsDir, 
  listRecordings, 
  deleteRecording, 
  getRecordingInfo,
  getRecordingUrl
};