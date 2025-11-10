import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
// If you decide to re-enable Clerk:
// import { useAuth, useUser } from '@clerk/clerk-react'; 

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    
    // State for all courses
    const [allCourses, setAllCourses] = useState([]);

    // Function to calculate the average rating for a course
    const calculateRating = (course) => {
        // Check if courseRatings exists and is an array with items
        if (!course.courseRatings || course.courseRatings.length === 0) {
            return 0; // Return 0 if no ratings are available
        }

        // Sum up all the rating values
        const totalRating = course.courseRatings.reduce((sum, rating) => sum + rating.ratingValue, 0);

        // Calculate the average
        const averageRating = totalRating / course.courseRatings.length;
        
        return averageRating;
    };

    // Correct function syntax for fetching courses
    const fetchAllCourses = async () => {
        // Simulates fetching data and populating state
        setAllCourses(dummyCourses);
    };
    
    // Effect hook to run the fetch function once on mount
    useEffect(() => {
        fetchAllCourses();
    }, []);

    const contextValue = {
        allCourses,
        setAllCourses,
        // currency has been removed
        calculateRating, 
    };

    return (
        <AppContext.Provider value={contextValue}>
            {props.children}
        </AppContext.Provider>
    );
};