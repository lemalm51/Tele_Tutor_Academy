import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'doick7ayt',
  api_key: process.env.CLOUDINARY_API_KEY || '169536568632566',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'WDZHeQ5AftxUDtE0VVkCOCzr9ww',
})

const connectCloudinary = async () => {
  try {
    // Test the configuration
    await cloudinary.api.ping()
    console.log('✅ Cloudinary connected successfully!')
  } catch (error) {
    console.log('⚠️ Cloudinary configuration issue:', error.message)
  }
}

export { cloudinary }
export default connectCloudinary