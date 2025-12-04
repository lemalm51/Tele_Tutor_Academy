// client/src/service/recordingService.js
const API_URL = 'http://localhost:3000/api';

class RecordingService {
  // Upload recording to server with improved error handling
  static async uploadRecording(formData) {
    try {
      console.log('📤 Starting recording upload...');
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Upload timeout reached, aborting...');
        controller.abort();
      }, 60000); // 60 second timeout

      // Show upload progress
      const progressHandler = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${progress}%`);
          // You can dispatch this to a state if needed
        }
      };

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', progressHandler);
        xhr.upload.addEventListener('error', (error) => {
          clearTimeout(timeoutId);
          reject(new Error('Network error during upload'));
        });
        
        xhr.onload = async () => {
          clearTimeout(timeoutId);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              
              if (data.success) {
                console.log('✅ Upload successful:', data);
                resolve(data);
              } else {
                reject(new Error(data.message || 'Upload failed'));
              }
            } catch (parseError) {
              reject(new Error('Invalid server response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error('Network error - check your connection'));
        };
        
        xhr.ontimeout = () => {
          clearTimeout(timeoutId);
          reject(new Error('Upload timed out'));
        };
        
        xhr.open('POST', `${API_URL}/recordings/upload`);
        
        // Don't set Content-Type for FormData - browser will set it automatically
        xhr.send(formData);
      });

    } catch (error) {
      console.error('❌ Error uploading recording:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out after 60 seconds');
      }
      
      if (error.message.includes('NetworkError')) {
        throw new Error('Network error - unable to connect to server');
      }
      
      throw error;
    }
  }

  // Get recordings for a room
  static async getRoomRecordings(roomId) {
    try {
      console.log(`📂 Fetching recordings for room: ${roomId}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_URL}/recordings/room/${roomId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recordings: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch recordings');
      }
      
      console.log(`✅ Found ${data.recordings?.length || 0} recordings`);
      return data.recordings || [];
      
    } catch (error) {
      console.error('❌ Error fetching recordings:', error);
      
      if (error.name === 'AbortError') {
        console.warn('Request timed out');
      }
      
      // Return empty array for offline/error cases
      return [];
    }
  }

  // Get recordings for a course
  static async getCourseRecordings(courseId) {
    try {
      console.log(`📂 Fetching recordings for course: ${courseId}`);
      
      const response = await fetch(`${API_URL}/recordings/course/${courseId}`, {
        timeout: 10000
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch recordings');
      }
      
      return data.recordings || [];
      
    } catch (error) {
      console.error('Error fetching course recordings:', error);
      return [];
    }
  }

  // Delete recording
  static async deleteRecording(recordingId) {
    try {
      console.log(`🗑️ Deleting recording: ${recordingId}`);
      
      const response = await fetch(`${API_URL}/recordings/${recordingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Delete failed');
      }
      
      console.log('✅ Recording deleted successfully');
      return data;
      
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  // Get recording statistics
  static async getRecordingStats(roomId) {
    try {
      const response = await fetch(`${API_URL}/recordings/stats/${roomId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch stats');
      }
      
      return data.stats || {
        totalRecordings: 0,
        totalDuration: 0,
        totalSize: 0,
        averageDuration: 0,
        averageSize: 0
      };
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  }

  // Format file size for display
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes) return 'Unknown size';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // Format to 2 decimal places, but remove .00 if whole number
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    
    return formattedSize + ' ' + sizes[i];
  }

  // Format duration for display
  static formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Create thumbnail from video (simplified)
  static async createThumbnail(videoBlob) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.src = URL.createObjectURL(videoBlob);
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadeddata = () => {
        // Seek to 10% of video for thumbnail, but max 5 seconds
        video.currentTime = Math.min(video.duration * 0.1, 5);
      };
      
      video.onseeked = () => {
        try {
          // Limit canvas size for performance
          const maxWidth = 320;
          const maxHeight = 180;
          let width = video.videoWidth;
          let height = video.videoHeight;
          
          // Maintain aspect ratio
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.8);
          
          URL.revokeObjectURL(video.src);
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = (error) => {
        URL.revokeObjectURL(video.src);
        reject(error);
      };
      
      // Set timeout in case video doesn't load
      const timeout = setTimeout(() => {
        video.pause();
        URL.revokeObjectURL(video.src);
        reject(new Error('Thumbnail generation timeout'));
      }, 10000);
      
      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        video.load();
      };
      
      video.load();
    });
  }

  // Check if recording API is available
  static async checkRecordingAPI() {
    try {
      const response = await fetch(`${API_URL}/recordings/health`, {
        method: 'HEAD',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Recording API not available:', error.message);
      return false;
    }
  }

  // Generate unique filename
  static generateFilename(prefix = 'recording') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(7);
    return `${prefix}-${timestamp}-${random}.webm`;
  }

  // Validate recording before upload
  static validateRecording(blob) {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const minSize = 1024; // 1KB
    
    if (!blob || !(blob instanceof Blob)) {
      return { valid: false, error: 'Invalid recording data' };
    }
    
    if (blob.size < minSize) {
      return { valid: false, error: 'Recording file is too small' };
    }
    
    if (blob.size > maxSize) {
      return { valid: false, error: 'Recording file exceeds 500MB limit' };
    }
    
    if (!blob.type.includes('video') && !blob.type.includes('audio')) {
      return { valid: false, error: 'Invalid file type' };
    }
    
    return { valid: true, size: blob.size, type: blob.type };
  }

  // Get estimated upload time
  static estimateUploadTime(fileSize, connectionSpeed = 5) {
    // connectionSpeed in Mbps (default 5 Mbps)
    const sizeInBits = fileSize * 8;
    const speedInBits = connectionSpeed * 1024 * 1024;
    const seconds = sizeInBits / speedInBits;
    
    if (seconds < 60) {
      return `${Math.ceil(seconds)} seconds`;
    } else if (seconds < 3600) {
      return `${Math.ceil(seconds / 60)} minutes`;
    } else {
      return `${Math.ceil(seconds / 3600)} hours`;
    }
  }
}

export default RecordingService;