// server/seedData.js
import Course from './models/Course.js';
import User from './models/User.js';

// Make sure this function is exported
export const seedSampleData = async () => {
    try {
        console.log('🌱 Checking for sample data...');
        
        // Skip if no database connection string configured
        if (process.env.MONGODB_URI === undefined) {
            console.log('⚠️ Skipping seed data - No MongoDB URI');
            return;
        }

        // Check connection state (handle ESM import shape)
        const mongooseModule = await import('mongoose');
        const mongoose = mongooseModule && (mongooseModule.default || mongooseModule);
        if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1) {
            console.log('⚠️ Skipping seed data - Database not connected');
            return;
        }
        
        // Create sample educator if not exists
        let educator = await User.findOne({ _id: 'mock_educator_id' });
        if (!educator) {
            educator = await User.create({
                _id: 'mock_educator_id',
                name: 'Sample Educator',
                email: 'educator@example.com',
                imageUrl: 'https://via.placeholder.com/150',
                role: 'educator'
            });
            console.log('✅ Created sample educator');
        }
        
        // Create sample student if not exists
        let student = await User.findOne({ _id: 'mock_user_id' });
        if (!student) {
            student = await User.create({
                _id: 'mock_user_id',
                name: 'Test Student',
                email: 'student@example.com',
                imageUrl: 'https://via.placeholder.com/150',
                role: 'student',
                enrolledCourses: []
            });
            console.log('✅ Created sample student');
        }

        // Ensure default mock auth user exists so mockAuth works in dev
        const defaultMockId = process.env.USER_ID || 'user_35nUwHrNypikUQof05Wmu5VeGMv';
        let defaultUser = await User.findOne({ _id: defaultMockId });
        if (!defaultUser) {
            defaultUser = await User.create({
                _id: defaultMockId,
                name: 'Dev Mock User',
                email: 'devmock@example.com',
                imageUrl: 'https://via.placeholder.com/150',
                role: 'student',
                enrolledCourses: []
            });
            console.log('✅ Created default mock auth user:', defaultMockId);
        }
        
        // Check if courses already exist
        const existingCourses = await Course.find({}).limit(1);
        if (existingCourses.length === 0) {
            console.log('📚 Creating sample courses...');
            
            // Create sample courses - ALL FREE
            const sampleCourses = [
                {
                    _id: 'course_1',
                    courseTitle: 'Introduction to Mathematics',
                    courseDescription: 'Learn basic mathematics concepts and problem-solving techniques. Perfect for beginners who want to build a strong foundation in math.',
                    courseThumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                    coursePrice: 0,
                    discount: 0,
                    educator: 'mock_educator_id',
                    enrolledStudents: ['mock_user_id'],
                    courseContent: [
                        {
                            chapterId: 'chap_1',
                            chapterOrder: 1,
                            chapterTitle: 'Basic Arithmetic',
                            chapterContent: [
                                {
                                    lectureId: 'lec_1',
                                    lectureTitle: 'Introduction to Numbers',
                                    lectureDuration: 30,
                                    lectureUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                                    isPreviewFree: true,
                                    lectureOrder: 1
                                }
                            ]
                        }
                    ],
                    isPublished: true
                }
            ];
            
            for (const courseData of sampleCourses) {
                await Course.create(courseData);
                console.log(`✅ Created course: ${courseData.courseTitle}`);
            }
            
            // Update student's enrolled courses
            student.enrolledCourses = sampleCourses.map(course => course._id);
            await student.save();
            console.log('✅ Auto-enrolled test student');
            
        } else {
            console.log(`✅ Already have ${await Course.countDocuments()} courses in database`);
        }
        
        console.log('✅ Sample data check completed!');
    } catch (error) {
        console.error('⚠️ Error in seed data (non-critical):', error.message);
        // Don't throw error - this shouldn't prevent server startup
    }
};

export default seedSampleData;