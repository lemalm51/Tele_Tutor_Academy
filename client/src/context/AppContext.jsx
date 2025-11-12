import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import humanizeDuration from "humanize-duration";
// Assuming you have a dummyCourses array imported from somewhere
// import { dummyCourses } from "../assets/assets"; 

export const AppContext = createContext();

// Mock data structure (replace this with your actual dummyCourses import)
const dummyCourses = [
    { 
        _id: "course-1", 
        courseTitle: "The Complete JavaScript Guide", 
        courseThumbnail: "https://via.placeholder.com/150/0000FF/FFFFFF?text=JS", 
        courseRatings: [{ ratingValue: 5 }, { ratingValue: 4 }],
        courseContent: [
            { chapterTitle: "Intro", chapterContent: [{ lectureDuration: 10 }, { lectureDuration: 5 }] },
            { chapterTitle: "Basics", chapterContent: [{ lectureDuration: 20 }, { lectureDuration: 15 }] }
        ]
    },
    { 
        _id: "course-2", 
        courseTitle: "React and Redux Masterclass", 
        courseThumbnail: "https://via.placeholder.com/150/00FF00/FFFFFF?text=React", 
        courseRatings: [{ ratingValue: 5 }, { ratingValue: 5 }, { ratingValue: 5 }],
        courseContent: [
            { chapterTitle: "Setup", chapterContent: [{ lectureDuration: 5 }, { lectureDuration: 5 }] },
            { chapterTitle: "Hooks", chapterContent: [{ lectureDuration: 30 }, { lectureDuration: 10 }] }
        ]
    },
    { 
        _id: "course-3", 
        courseTitle: "Node.js and Express API Development", 
        courseThumbnail: "https://via.placeholder.com/150/FF0000/FFFFFF?text=Node", 
        courseRatings: [{ ratingValue: 4 }, { ratingValue: 3 }],
        courseContent: [
            { chapterTitle: "Servers", chapterContent: [{ lectureDuration: 20 }, { lectureDuration: 20 }] },
            { chapterTitle: "Database", chapterContent: [{ lectureDuration: 40 }] }
        ]
    },
];

export const AppContextProvider = (props) => {

    const navigate = useNavigate();

    // Core State Management
    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(false);
    
    // States required by MyEnrollMents
    const [userData, setUserData] = useState(null); 
    const [enrolledCourses, setEnrolledCourses] = useState([]); 
    const backendUrl = "http://localhost:4000"; 

    // Placeholder Functions for Auth and Fetching
    
    const getToken = async () => {
        // Mock token
        return "dummy-auth-token"; 
    };

    const fetchUserEnrolledCourses = async () => {
        console.log("fetchUserEnrolledCourses: Fetching mock enrollments.");
        
        // ** SET THE NUMBER OF COURSES TO MOCK-ENROLL HERE **
        // Example: .slice(0, 3) will enroll the first 3 courses
        const mockEnrollments = dummyCourses.slice(0, 3).map(course => ({
            ...course,
            // Add a mock progress structure
            progressData: { lectureCompleted: [{ id: 'l1' }] } 
        }));
        
        setEnrolledCourses(mockEnrollments);
    };

    const fetchAllCourses = async () => {
        setAllCourses(dummyCourses);
    };

    // Utility Functions

    const calculateRating = (course) => {
        if (!course || !course.courseRatings || course.courseRatings.length === 0) {
            return 0; 
        }
        const totalRating = course.courseRatings.reduce((sum, rating) => sum + rating.ratingValue, 0);
        const averageRating = totalRating / course.courseRatings.length;
        return parseFloat(averageRating.toFixed(1)); 
    };

    const calculateChapterTime = (chapter) => {
        let time = 0;
        chapter.chapterContent.forEach((lecture) => time += lecture.lectureDuration);
        return humanizeDuration(time * 60 * 1000, {units: ["h", "m"]});
    }

    const calculateCourseDuration = (course)=>{
        let time = 0 ;
        course.courseContent.forEach((chapter)=> chapter.chapterContent.forEach(
            (lecture)=> time += lecture.lectureDuration 
        ))
        return humanizeDuration(time * 60 * 1000, {units: ["h", "m"]}) 
    }

    const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        course.courseContent.forEach(chapter => {
            if(Array.isArray(chapter.chapterContent)){
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    }
    
    // Initial Data Load & Mock Login
    useEffect(() => {
        fetchAllCourses();
        // Mocking user login to trigger enrollment fetch in MyEnrollMents
        setUserData({ name: "Mock User" }); 
    }, []);

    const contextValue = {
        // Courses
        allCourses, setAllCourses,
        // Authentication & User
        userData, setUserData,
        isEducator, setIsEducator,
        getToken, 
        backendUrl, 
        // Navigation
        navigate, 
        // Enrollment
        enrolledCourses, setEnrolledCourses,
        fetchUserEnrolledCourses,
        // Utility Functions
        calculateRating, 
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {props.children}
        </AppContext.Provider>
    );
};


