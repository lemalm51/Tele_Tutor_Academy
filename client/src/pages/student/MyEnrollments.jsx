import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext"; // Adjust path as necessary
import { Line } from "rc-progress";
import Footer from "../../component/student/Footer"; // Adjust path as necessary
import { toast } from "react-toastify";
import axios from "axios";


const MyEnrollMents = () => {
    
    // Destructure necessary context values
    const {
        navigate,
        enrolledCourses,
        calculateCourseDuration,
        userData,
        fetchUserEnrolledCourses,
        backendUrl,
        getToken,
        calculateNoOfLectures,
    } = useContext(AppContext);

    const [progressArray, setProgressArray] = useState([]);

    const getCourseProgress = async () => {
        try {
            const token = await getToken();

            // Fetch progress for all enrolled courses concurrently
            const tempProgressArray = await Promise.all(
                enrolledCourses.map(async (course) => {
                    // --- This is the mock API call for progress ---
                    // In a real app, this calls your backend
                    const { data } = await axios.post(
                        `${backendUrl}/api/user/get-course-progress`,
                        { courseId: course._id },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    // console.log("dta", data.progressData);
                    
                    let totalLectures = calculateNoOfLectures(course);

                    // Determine completed lectures from the fetched data
                    const lectureCompleted = data.progressData
                        ? data.progressData.lectureCompleted.length
                        : 0;
                        
                    return { totalLectures, lectureCompleted };
                })
            );

            setProgressArray(tempProgressArray);
        } catch (error) {
            // Check if toast is available before calling it
            if (typeof toast !== 'undefined' && toast.error) {
                toast.error(error.message);
            } else {
                console.error("Error fetching course progress:", error.message);
            }
        }
    };

    // 1. Fetch enrolled courses when user data is ready
    useEffect(()=>{
        if(userData){
            fetchUserEnrolledCourses();
        }
    },[userData]) // eslint-disable-line react-hooks/exhaustive-deps

    // 2. Fetch progress once enrolled courses are loaded
    useEffect(()=>{
        if(enrolledCourses.length > 0){
            getCourseProgress();
        }
    },[enrolledCourses]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
        
            <div className="md:px-36 px-8 pt-10">
                <h1 className="text-2xl font-semibold">My EnrollMents</h1>
                
                {/* Table structure */}
                <table className="md:table-auto table-fixed w-full overflow-hidden border mt-10">
                    <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden">
                        <tr>
                            <th className="px-4 py-3 font-semibold truncate">Course</th>
                            <th className="px-4 py-3 font-semibold truncate">Duration</th>
                            <th className="px-4 py-3 font-semibold truncate">Completed</th>
                            <th className="px-4 py-3 font-semibold truncate">Status</th>
                        </tr>
                    </thead>

                    <tbody className="text-gray-700">
                        {enrolledCourses.map((course, index) => {
                            const progress = progressArray[index];
                            
                            // Calculate percentage only if progress data is available
                            const percentCompleted = progress 
                                ? (progress.lectureCompleted * 100) / progress.totalLectures
                                : 0;
                            
                            const isCompleted = progress && progress.lectureCompleted / progress.totalLectures === 1;

                            return (
                                <tr className="border-b border-gray-500/20" key={index}>
                                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 ">
                                        <img
                                            className="w-14 sm:w-24 md:w-28 cursor-pointer"
                                            onClick={() => navigate("/player/" + course._id)}
                                            src={course.courseThumbnail}
                                            alt="courseThumbnail"
                                        />
                                        <div className="flex-1 cursor-pointer" onClick={() => navigate("/player/" + course._id)}>
                                            <p className="mb-1 max-sm:text-sm">{course.courseTitle}</p>
                                            <Line
                                                strokeWidth={2}
                                                percent={percentCompleted}
                                                className="bg-gray-300 rounded-full"
                                            />
                                        </div>
                                    </td>
                                    
                                    {/* Duration */}
                                    <td className="px-4 py-3 max-sm:hidden">
                                        {calculateCourseDuration(course)}
                                    </td>
                                    
                                    {/* Completed Count */}
                                    <td className="px-4 py-3 max-sm:hidden">
                                        {progress &&
                                            `${progress.lectureCompleted} / ${progress.totalLectures} `}{" "}
                                        <span>Lectures</span>
                                    </td>
                                    
                                    {/* Status Button */}
                                    <td className="px-3 py-3 max-sm:text-right">
                                        <button
                                            className="px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 max-sm:text-xs text-white rounded-md"
                                            onClick={() => navigate("/player/" + course._id)}
                                        >
                                            {isCompleted ? "Completed" : "On Going"}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {/* Assuming Footer is a component you have defined */}
            <Footer />
        </>
    );
};

export default MyEnrollMents;