// Updated recordingRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Recording from '../models/Recording.js';

const recordingRouter = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/recordings';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `recording-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB max
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/') || 
        file.mimetype.startsWith('audio/') ||
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only video/audio files are allowed'), false);
    }
  }
});

// Test recording endpoint
recordingRouter.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Recording API is working!',
    timestamp: new Date().toISOString()
  });
});

// Upload recording
recordingRouter.post('/upload', upload.single('recording'), async (req, res) => {
  try {
    console.log('📤 Recording upload request received');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { roomId, courseId, userId, userName, duration, isEducator } = req.body;
    
    console.log('Upload data:', {
      roomId,
      courseId,
      userId,
      userName,
      duration,
      isEducator,
      file: req.file
    });

    if (!roomId || !courseId || !userId) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: roomId, courseId, userId'
      });
    }

    // Create recording URLs
    const recordingUrl = `/api/recordings/play/${req.file.filename}`;
    const downloadUrl = `/api/recordings/download/${req.file.filename}`;

    // Save recording to database
    const recording = new Recording({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      roomId,
      courseId,
      userId,
      userName: userName || 'Anonymous User',
      duration: parseFloat(duration) || 0,
      isEducator: isEducator === 'true',
      recordingUrl,
      downloadUrl,
      description: req.body.description || ''
    });

    await recording.save();

    console.log(`✅ Recording saved: ${recording._id}`);

    res.json({
      success: true,
      message: 'Recording uploaded successfully',
      recording: {
        id: recording._id,
        filename: recording.filename,
        url: recording.recordingUrl,
        downloadUrl: recording.downloadUrl,
        size: recording.size,
        duration: recording.duration,
        createdAt: recording.createdAt,
        roomId: recording.roomId,
        userName: recording.userName
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up file if there was an error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload recording'
    });
  }
});

// Play recording
recordingRouter.get('/play/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads', 'recordings', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Recording file not found'
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Partial content request
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/webm',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Full file request
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/webm',
      };

      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Playback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stream recording'
    });
  }
});

// Download recording
recordingRouter.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads', 'recordings', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Recording file not found'
      });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to download recording'
        });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download recording'
    });
  }
});

// Get room recordings
recordingRouter.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const recordings = await Recording.find({ roomId })
      .sort({ createdAt: -1 })
      .select('-path -__v');
    
    res.json({
      success: true,
      recordings: recordings || []
    });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete recording
recordingRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recording = await Recording.findById(id);
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }

    // Delete file
    if (fs.existsSync(recording.path)) {
      fs.unlinkSync(recording.path);
    }

    // Delete from database
    await Recording.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Recording deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default recordingRouter;