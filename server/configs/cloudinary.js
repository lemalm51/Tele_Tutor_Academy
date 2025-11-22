// server/configs/cloudinary.js
// COMMENT OUT THE ENTIRE FILE OR JUST EXPORT AN EMPTY FUNCTION

// import {v2 as cloudinary} from 'cloudinary'

// const connectCloudinay = async()=>{
//     cloudinary.config({
//         cloud_name:process.env.CLOUDINARY_NAME,
//         api_key: process.env.CLOUDINAY_API_KEY,
//         api_secret: process.env.CLOUDINARY_SECRET_KEY
//     })
// }

// export default connectCloudinay;

// TEMPORARY FIX - Export empty function
const connectCloudinay = async() => {
    console.log("Cloudinary disabled - using placeholder images");
}
export default connectCloudinay;