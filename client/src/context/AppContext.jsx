import { createContext, useEffect, useState, useCallback } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration"
import {useAuth, useUser} from '@clerk/clerk-react'
import axios from 'axios'
import { toast } from 'react-toastify';

export const AppContext = createContext()

export const AppContextProvider = (props)=>{

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();

    const {getToken} = useAuth();
    const {user, isLoaded} = useUser()

    const [allCourses, setAllCourses] = useState([])
    const [isEducator, setIsEducator] = useState(false)
    const [enrolledCourses, setEnrolledCourses] = useState([])
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)

    // fetch all courses 
    const fetchAllCourses = async ()=>{
        setAllCourses(dummyCourses)
        try {
            const {data} = await axios.get(backendUrl + '/api/course/all');
            if(data.success)
            {
                setAllCourses(data.courses)
            }else{
                toast.error(data.message);
            }
            
        } catch (error) {
            toast.error(error.message)
        }
    }

    // fetch user data - use useCallback to prevent infinite re-renders
    const fetchUserData = useCallback(async ()=>{
        try {
            console.log("Fetching user data...");
            const token = await getToken();
            if (!token) {
                console.log("No token available");
                setLoading(false);
                return;
            }

            const {data} = await axios.get(backendUrl + '/api/user/data' , {
                headers: { Authorization: `Bearer ${token}` }
            });
        
            console.log("Backend user data response:", data);
            
            if(data.success){
                setUserData(data.user);
                
                // Set educator status based on backend data - this is the main fix
                const isUserEducator = data.user.role === 'educator';
                console.log("Setting educator from backend:", isUserEducator);
                setIsEducator(isUserEducator);
                
            } else {
                toast.error(data.message);
                // If backend fails, fall back to Clerk metadata
                const clerkIsEducator = user?.publicMetadata?.role === 'educator';
                console.log("Falling back to Clerk metadata:", clerkIsEducator);
                setIsEducator(clerkIsEducator);
            }

        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error(error.message);
            // Fall back to Clerk metadata on error
            const clerkIsEducator = user?.publicMetadata?.role === 'educator';
            console.log("Error fallback to Clerk metadata:", clerkIsEducator);
            setIsEducator(clerkIsEducator);
        } finally {
            setLoading(false);
            console.log("Loading complete");
        }
    }, [backendUrl, getToken, user]); // Add dependencies

    // Function to calculate average rating of course
    const calculateRating = (course) => {
        if(!course.courseRatings || course.courseRatings.length === 0){
            return 0;
        }
        let totalRating = 0;
        course.courseRatings.forEach(rating =>{
            totalRating += rating.rating;
        })
        return Math.floor(totalRating / course.courseRatings.length)
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

    // Fetch user enrolled courses
    const fetchUserEnrolledCourses = async()=>{
        setEnrolledCourses(dummyCourses)
       try {
        const token = await getToken();
        const {data} = await axios.get(backendUrl + '/api/user/enrolled-courses', {
            headers: {Authorization: `Bearer ${token}`}
        });
        
        if(data && data.success){
            setEnrolledCourses(data.enrolledCourses.reverse());
        }else{
            toast.error(data?.message || "Failed to fetch enrolled courses")
        }
       } catch (error) {
        toast.error(error.message)
       }
    }

    useEffect(()=>{
        fetchAllCourses()
    },[])

    useEffect(()=>{
        console.log("User effect triggered:", { user, isLoaded });
        if(user && isLoaded){
            console.log("User is loaded, fetching data...");
            fetchUserData();
            fetchUserEnrolledCourses();
        } else if (!user && isLoaded) {
            console.log("No user, setting defaults");
            setLoading(false);
            setIsEducator(false);
            setUserData(null);
        }
    },[user, isLoaded, fetchUserData]) // Add fetchUserData to dependencies

    const value = {
        currency,
        allCourses, 
        navigate, 
        isEducator, 
        setIsEducator,
        calculateRating,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        fetchUserEnrolledCourses, 
        setEnrolledCourses,
        enrolledCourses,
        backendUrl, 
        userData, 
        setUserData, 
        getToken, 
        fetchAllCourses,
        loading
    }

    return (
        <AppContext.Provider value={value} >
            {props.children}
        </AppContext.Provider>
    )
}