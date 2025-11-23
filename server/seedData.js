import Course from './models/Course.js';
import User from './models/User.js';

// Make sure this function is exported
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
                role: 'student',
                enrolledCourses: [] // Start with empty enrolled courses
            });
            console.log('✅ Created sample student');
        }

        // Check if courses already exist
        const existingCourses = await Course.find({});
        if (existingCourses.length === 0) {
            // Create sample courses - ALL FREE
            const sampleCourses = [
                {
                    _id: 'course_1',
                    courseTitle: 'Introduction to Mathematics',
                    courseDescription: 'Learn basic mathematics concepts and problem-solving techniques. Perfect for beginners who want to build a strong foundation in math.',
                    courseThumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzRGNDZFNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIj5NYXRoIENvdXJzZTwvdGV4dD48L3N2Zz4=',
                    coursePrice: 0, // FREE
                    discount: 0,
                    educator: 'mock_educator_id',
                    enrolledStudents: ['mock_user_id'], // AUTO-ENROLL THE TEST STUDENT
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
                    courseThumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzEwQjk4MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIj5QaHlzaWNzIENvdXJzZTwvdGV4dD48L3N2Zz4=',
                    coursePrice: 0, // FREE
                    discount: 0,
                    educator: 'mock_educator_id',
                    enrolledStudents: ['mock_user_id'], // AUTO-ENROLL THE TEST STUDENT
                    courseContent: [],
                    isPublished: true
                },
                {
                    _id: 'course_3',
                    courseTitle: 'Chemistry Basics',
                    courseDescription: 'Understand the fundamental concepts of chemistry and chemical reactions.',
                    courseThumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0Y1OUUwQiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIj5DaGVtaXN0cnkgQ291cnNlPC90ZXh0Pjwvc3ZnPg==',
                    coursePrice: 0, // FREE
                    discount: 0,
                    educator: 'mock_educator_id',
                    enrolledStudents: ['mock_user_id'], // AUTO-ENROLL THE TEST STUDENT
                    courseContent: [],
                    isPublished: true
                }
            ];

            for (const courseData of sampleCourses) {
                await Course.create(courseData);
                console.log(`✅ Created FREE course: ${courseData.courseTitle}`);
            }

            // Also update the student's enrolled courses
            if (student) {
                student.enrolledCourses = sampleCourses.map(course => course._id);
                await student.save();
                console.log('✅ Auto-enrolled test student in all courses');
            }
        } else {
            console.log(`✅ Already have ${existingCourses.length} courses in database`);
            
            // Auto-enroll existing test student in existing courses
            const courses = await Course.find({});
            const courseIds = courses.map(course => course._id);
            
            if (student) {
                student.enrolledCourses = courseIds;
                await student.save();
                console.log(`✅ Auto-enrolled test student in ${courseIds.length} courses`);
            }

            // Also add student to each course's enrolledStudents
            for (const course of courses) {
                if (!course.enrolledStudents.includes('mock_user_id')) {
                    course.enrolledStudents.push('mock_user_id');
                    await course.save();
                    console.log(`✅ Added student to course: ${course.courseTitle}`);
                }
            }
        }

        console.log('✅ Sample data seeding completed! All courses are FREE.');
    } catch (error) {
        console.error('❌ Error seeding sample data:', error);
    }
};

// You can also add a default export if needed
export default seedSampleData;