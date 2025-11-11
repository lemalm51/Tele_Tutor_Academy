import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom"; 

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const navigate = useNavigate();

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(false)

    const fetchAllCourses = async () => {
        setAllCourses(dummyCourses);
    };

    const calculateRating = (course) => {
        // Defensive check for the course object and ratings array
        if (!course || !course.courseRatings || course.courseRatings.length === 0) {
            return 0; 
        }

        // 1. Sum up all the rating values (MUST come first)
        const totalRating = course.courseRatings.reduce((sum, rating) => sum + rating.ratingValue, 0);

        // 2. Calculate the average (Now totalRating is defined)
        const averageRating = totalRating / course.courseRatings.length;

        return averageRating;
    };

    
    useEffect(() => {
        fetchAllCourses();
    }, []);

    const contextValue = {
        allCourses,
        setAllCourses,
        calculateRating, 
        isEducator,
        navigate, // ensure navigate is included
        setIsEducator,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {props.children}
        </AppContext.Provider>
    );
};