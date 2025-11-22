import Course from './models/Course.js';
import User from './models/User.js';

export const seedSampleData = async () => {
    try {
        console.log('🌱 Seeding sample data...');

        // Create sample educator
        const educator = await User.findOne({ _id: 'mock_educator_id' });
        if (!educator) {
            await User.create({
                _id: 'mock_educator_id',
                name: 'Sample Educator',
                email: 'educator@example.com',
                imageUrl: '/default-avatar.png',
                role: 'educator'
            });
            console.log('✅ Created sample educator');
        }

        // Create sample student
        const student = await User.findOne({ _id: 'mock_user_id' });
        if (!student) {
            await User.create({
                _id: 'mock_user_id',
                name: 'Test Student',
                email: 'student@example.com',
                imageUrl: '/default-avatar.png',
                role: 'student'
            });
            console.log('✅ Created sample student');
        }

        // Check if courses already exist
        const existingCourses = await Course.find({});
        if (existingCourses.length === 0) {
            // Create sample courses
            const sampleCourses = [
                {
                    _id: 'course_1',
                    courseTitle: 'Introduction to Mathematics',
                    courseDescription: 'Learn basic mathematics concepts and problem-solving techniques. Perfect for beginners who want to build a strong foundation in math.',
                    courseThumbnail: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Math+Course',
                    coursePrice: 0,
                    discount: 0,
                    educator: 'mock_educator_id',
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
                },
                {
                    _id: 'course_2',
                    courseTitle: 'Physics Fundamentals',
                    courseDescription: 'Explore the basic principles of physics and their applications in everyday life.',
                    courseThumbnail: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Physics+Course',
                    coursePrice: 0,
                    discount: 0,
                    educator: 'mock_educator_id',
                    courseContent: [],
                    isPublished: true
                },
                {
                    _id: 'course_3',
                    courseTitle: 'Chemistry Basics',
                    courseDescription: 'Understand the fundamental concepts of chemistry and chemical reactions.',
                    courseThumbnail: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Chemistry+Course',
                    coursePrice: 0,
                    discount: 0,
                    educator: 'mock_educator_id',
                    courseContent: [],
                    isPublished: true
                }
            ];

            for (const courseData of sampleCourses) {
                await Course.create(courseData);
                console.log(`✅ Created course: ${courseData.courseTitle}`);
            }
        } else {
            console.log(`✅ Already have ${existingCourses.length} courses in database`);
        }

        console.log('✅ Sample data seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding sample data:', error);
    }
};