import { createContext, useEffect, useState, useCallback } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration"
import {useAuth, useUser} from '@clerk/clerk-react'
import axios from 'axios'
import { toast } from 'react-toastify';

export const AppContext = createContext()

export const AppContextProvider = (props)=>{

   const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const navigate = useNavigate();

    const {getToken} = useAuth();
    const {user, isLoaded} = useUser()

    const [allCourses, setAllCourses] = useState([])
    const [isEducator, setIsEducator] = useState(false)
    const [enrolledCourses, setEnrolledCourses] = useState([])
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [backendOnline, setBackendOnline] = useState(false)

    // Check if backend is online
    const checkBackendStatus = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/test', { timeout: 3000 });
            setBackendOnline(true);
            return true;
        } catch (error) {
            setBackendOnline(false);
            console.log("⚠️ Backend is offline, using demo data");
            return false;
        }
    }

    // fetch all courses with robust fallback
    const fetchAllCourses = async ()=>{
        const isOnline = await checkBackendStatus();
        
        if (!isOnline) {
            // Use enhanced dummy data with better thumbnails
            const enhancedDummyCourses = dummyCourses.map(course => ({
                ...course,
                courseThumbnail: course.courseThumbnail || getFallbackImage(course.courseTitle),
                enrolledStudents: course.enrolledStudents || ['demo_student_1', 'demo_student_2']
            }));
            setAllCourses(enhancedDummyCourses);
            return;
        }

        try {
            const { data } = await axios.get(backendUrl + '/api/course/all', { timeout: 5000 });
            if (data.success) {
                setAllCourses(data.courses);
            } else {
                throw new Error('API returned error');
            }
        } catch (error) {
            console.log("⚠️ Using demo course data");
            const enhancedDummyCourses = dummyCourses.map(course => ({
                ...course,
                courseThumbnail: course.courseThumbnail || getFallbackImage(course.courseTitle),
                enrolledStudents: course.enrolledStudents || ['demo_student_1', 'demo_student_2']
            }));
            setAllCourses(enhancedDummyCourses);
        }
    }

    // Helper function for fallback images
    const getFallbackImage = (courseTitle) => {
        const fallbackImages = {
            'math': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'chemistry': 'https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'default': 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        }

        const title = courseTitle.toLowerCase();
        if (title.includes('math')) return fallbackImages.math;
        if (title.includes('physics')) return fallbackImages.physics;
        if (title.includes('chemistry')) return fallbackImages.chemistry;
        return fallbackImages.default;
    }

    // fetch user data with comprehensive fallback
    const fetchUserData = useCallback(async ()=>{
        const isOnline = await checkBackendStatus();
        
        if (!isOnline) {
            const demoUser = createDemoUser();
            setUserData(demoUser);
            setIsEducator(false);
            setLoading(false);
            return;
        }

        try {
            const token = await getToken();
            if (!token) {
                const demoUser = createDemoUser();
                setUserData(demoUser);
                setIsEducator(false);
                setLoading(false);
                return;
            }

            const {data} = await axios.get(backendUrl + '/api/user/data', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
        
            if(data.success){
                setUserData(data.user);
                setIsEducator(data.user.role === 'educator');
            } else {
                throw new Error('API returned error');
            }

        } catch (error) {
            console.log("⚠️ Using demo user data");
            const demoUser = createDemoUser();
            setUserData(demoUser);
            setIsEducator(false);
        } finally {
            setLoading(false);
        }
    }, [backendUrl, getToken, user]);

    // Helper to create demo user
    const createDemoUser = () => {
        return {
            _id: 'demo_user_' + Date.now(),
            name: user?.fullName || 'Demo Student',
            email: user?.primaryEmailAddress?.emailAddress || 'demo@stema.com',
            role: 'student',
            enrolledCourses: ['course_1', 'course_2', 'course_3'],
            imageUrl: user?.imageUrl || '/default-avatar.png'
        };
    }

    // function to calculate course chapter time
    const calculateChapterTime = (chapter) => {
        if(!chapter.chapterContent) return "0m";
        let time = 0;
        chapter.chapterContent.map((lecture) => time += lecture.lectureDuration)
        return humanizeDuration(time * 60 * 1000, {units: ["h", "m"]})
    }

    // Function to calculate course Duration
    const calculateCourseDuration = (course)=>{
        if(!course.courseContent) return "0m";
        let time = 0 ;
        course.courseContent.map((chapter)=> chapter.chapterContent.map(
            (lecture)=> time += lecture.lectureDuration 
        ))
        return humanizeDuration(time * 60 * 1000, {units: ["h", "m"]}) 
    }

    // Function to calculate to no. of lectures in the course
    const calculateNoOfLectures = (course) => {
        if(!course.courseContent) return 0;
        let totalLectures = 0;
        course.courseContent.forEach(chapter => {
            if(Array.isArray(chapter.chapterContent)){
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    }

    // Fetch user enrolled courses with fallback
    const fetchUserEnrolledCourses = async()=>{
        const isOnline = await checkBackendStatus();
        
        if (!isOnline) {
            setEnrolledCourses(dummyCourses);
            return;
        }

        try {
            const token = await getToken();
            const {data} = await axios.get(backendUrl + '/api/user/enrolled-courses', {
                headers: {Authorization: `Bearer ${token}`},
                timeout: 5000
            });
            
            if(data && data.success){
                setEnrolledCourses(data.enrolledCourses.reverse());
            }else{
                setEnrolledCourses(dummyCourses);
            }
        } catch (error) {
            console.log("⚠️ Using demo enrolled courses");
            setEnrolledCourses(dummyCourses);
        }
    }

    useEffect(()=>{
        fetchAllCourses()
    },[])

    useEffect(()=>{
        if(user && isLoaded){
            fetchUserData();
            fetchUserEnrolledCourses();
        } else if (!user && isLoaded) {
            const demoUser = createDemoUser();
            setUserData(demoUser);
            setIsEducator(false);
            setLoading(false);
        }
    },[user, isLoaded, fetchUserData])

    const value = {
        allCourses, 
        navigate, 
        isEducator, 
        setIsEducator,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        fetchUserEnrolledCourses, 
        setEnrolledCourses,
        enrolledCourses,
        backendUrl, 
        userData, 
        setUserData, 
        fetchUserData,
        getToken, 
        fetchAllCourses,
        loading,
        backendOnline
    }

    return (
        <AppContext.Provider value={value} >
            {props.children}
        </AppContext.Provider>
    )
}