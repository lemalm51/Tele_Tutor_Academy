import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { Line } from "rc-progress";
import Footer from "../../component/student/Footer";
import { toast } from "react-toastify";
import axios from "axios";
// Removed: import { data } from "react-router-dom"; // Unused and potentially conflicting import

const MyEnrollMents = () => {
    const {
        navigate,
        enrolledCourses,
        calculateCourseDuration,
        userData, // Used as a dependency for the first fetch
        fetchUserEnrolledCourses,
        backendUrl,
        getToken,
        calculateNoOfLectures,
    } = useContext(AppContext);

    const [progressArray, setProgressArray] = useState([]);

    // 1. Fetch enrolled courses when userData is available
    useEffect(() => {
        if (userData) {
            // Note: If fetchUserEnrolledCourses is not memoized in AppContext, 
            // you should include it in the dependency array.
            fetchUserEnrolledCourses();
        }
    }, [userData, fetchUserEnrolledCourses]); 

    // 2. Fetch course progress when enrolledCourses are available
    useEffect(() => {
        if (enrolledCourses.length === 0) {
            setProgressArray([]); // Clear progress if courses are empty
            return;
        }

        const getCourseProgress = async () => {
            try {
                const token = await getToken();
                
                // Use Promise.allSettled to ensure that one failing request 
                // does not crash the entire progress calculation.
                const results = await Promise.allSettled(
                    enrolledCourses.map(async (course) => {
                        // Make the API call to get progress
                        const { data } = await axios.post(
                            `${backendUrl}/api/user/get-course-progress`,
                            { courseId: course._id },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        
                        // Check if progressData exists and has the required array
                        const progressData = data.progressData;
                        
                        let totalLectures = calculateNoOfLectures(course);
                        
                        const lectureCompleted = progressData && progressData.lectureCompleted
                            ? progressData.lectureCompleted.length
                            : 0;
                            
                        // Log success for debugging
                        console.log(`Progress for ${course.courseTitle}: ${lectureCompleted}/${totalLectures}`);
                        
                        return { totalLectures, lectureCompleted };
                    })
                );

                // Filter for successful results ('fulfilled') and extract their values
                const tempProgressArray = results
                    .filter(result => result.status === 'fulfilled')
                    .map(result => result.value);

                setProgressArray(tempProgressArray);
                
            } catch (error) {
                // This catch only triggers if the entire Promise.allSettled setup fails, 
                // individual failures are caught inside the map.
                console.error("Critical error fetching all course progress:", error);
                toast.error("Failed to load some course progress.");
            }
        };

        getCourseProgress();
        
    }, [enrolledCourses, getToken, backendUrl, calculateNoOfLectures]); // Dependencies are clean and complete

    // Utility function to get the completion percentage
    const getCompletionPercent = (index) => {
        const progress = progressArray[index];
        if (!progress || progress.totalLectures === 0) return 0;
        return (progress.lectureCompleted * 100) / progress.totalLectures;
    };

    return (
        <>
        
            <div className="md:px-36 px-8 pt-10 min-h-screen">
                <h1 className="text-3xl font-bold mb-4 text-gray-800">My Enrollments</h1>
                
                {enrolledCourses.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg mt-10 shadow-inner">
                        <p className="text-xl text-gray-500">You are not currently enrolled in any courses.</p>
                        <button 
                            onClick={() => navigate("/")}
                            className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition duration-150 shadow-lg"
                        >
                            Browse Courses
                        </button>
                    </div>
                ) : (
                    <table className="table-fixed w-full border border-gray-200 rounded-lg overflow-hidden mt-10 shadow-xl">
                        <thead className="text-white bg-indigo-600/90 text-sm text-left">
                            <tr>
                                <th className="px-4 py-4 font-semibold truncate">Course</th>
                                <th className="px-4 py-4 font-semibold truncate max-sm:hidden">Duration</th>
                                <th className="px-4 py-4 font-semibold truncate max-sm:hidden">Completed</th>
                                <th className="px-4 py-4 font-semibold truncate">Status</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white text-gray-700">
                            {enrolledCourses.map((course, index) => {
                                const completionPercent = getCompletionPercent(index);
                                const isCompleted = completionPercent === 100;

                                return (
                                    <tr className="border-t border-gray-200 hover:bg-gray-50 transition duration-100" key={course._id}>
                                        
                                        {/* Course Title and Progress Bar */}
                                        <td 
                                            className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 cursor-pointer"
                                            onClick={() => navigate("/player/" + course._id)}
                                        >
                                            <img
                                                className="w-16 sm:w-20 md:w-24 rounded-lg shadow-md"
                                                src={course.courseThumbnail}
                                                alt="courseThumbnail"
                                            />
                                            <div className="flex-1">
                                                <p className="mb-1 font-medium text-base truncate max-sm:text-sm">{course.courseTitle}</p>
                                                <Line
                                                    strokeWidth={3}
                                                    percent={completionPercent}
                                                    strokeColor={isCompleted ? "#10B981" : "#4F46E5"} // Green for complete, Indigo for ongoing
                                                    trailColor="#E5E7EB"
                                                    trailWidth={3}
                                                    className="rounded-full mt-1"
                                                />
                                            </div>
                                        </td>
                                        
                                        {/* Duration */}
                                        <td className="px-4 py-3 max-sm:hidden text-sm">
                                            {calculateCourseDuration(course)}
                                        </td>
                                        
                                        {/* Lectures Completed */}
                                        <td className="px-4 py-3 max-sm:hidden text-sm">
                                            {progressArray[index] &&
                                                `${progressArray[index].lectureCompleted} / ${progressArray[index].totalLectures} `}{" "}
                                            Lectures
                                        </td>
                                        
                                        {/* Status Button */}
                                        <td className="px-3 py-3 max-sm:text-right">
                                            <button
                                                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full max-sm:text-xs text-white font-semibold transition duration-150 shadow-md 
                                                    ${isCompleted 
                                                        ? 'bg-emerald-500 hover:bg-emerald-600' 
                                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                                    }`}
                                                onClick={() => navigate("/player/" + course._id)}
                                            >
                                                {isCompleted ? "Completed" : "Continue"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <Footer />
        </>
    );
};

export default MyEnrollMents;