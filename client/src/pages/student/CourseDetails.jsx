import React, { useContext, useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import Loading from "../../component/student/Loading";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import Footer from "../../component/student/Footer";
import YouTube from "react-youtube";
import { toast } from "react-toastify";
import axios from "axios";

const CourseDetails = () => {
    const { id } = useParams();

    const [courseData, setCourseData] = useState(null);
    const [openSections, setOpenSections] = useState({});
    const [playerData, setPlayerData] = useState(null);

    const {
        allCourses,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        backendUrl,
        userData,
        setUserData,
        getToken,
        fetchUserData,
        fetchUserEnrolledCourses,
        enrolledCourses,
    } = useContext(AppContext);
    const [enrolling, setEnrolling] = useState(false);
    const [enrollingFlag, setEnrollingFlag] = useState(false);
    const [hasEnrolled, setHasEnrolled] = useState(false);

    const fetchCourseData = async () => {
        // First try to find in local courses (for demo courses)
        const findCourse = allCourses.find((course) => course._id === id);
        if (findCourse) {
            setCourseData(findCourse);
            return;
        }

        // For educator-created courses, always try to fetch from API first
        try {
            console.log('Fetching course from API:', id);
            const { data } = await axios.get(backendUrl + "/api/course/" + id);
            if (data.success) {
                console.log('Course fetched successfully:', data.courseData);
                setCourseData(data.courseData);
            } else {
                console.error('API returned error:', data.message);
                toast.error(data.message || 'Failed to load course');
            }
        } catch (error) {
            console.error("Error fetching course from API:", error);
            // Only use fallback if we have demo courses and this might be a demo course
            if (allCourses.length > 0 && id.startsWith('course_')) {
                console.log('Using demo course fallback for:', id);
                const fallbackCourse = allCourses.find(c => c._id === id) || allCourses[0];
                setCourseData(fallbackCourse);
            } else {
                toast.error("Failed to load course details. Please check your connection.");
            }
        }
    };

    useEffect(() => {
        // Fetch course data when component mounts or when id/allCourses change
        fetchCourseData();
        // Reset hasEnrolled when course changes
        setHasEnrolled(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, allCourses]);

    const enrollCourse = useCallback(async () => {
        console.log('Enroll button clicked');
        console.log('enrollingFlag:', enrollingFlag);
        console.log('courseData:', courseData);
        console.log('userData:', userData);

        if (enrollingFlag) {
            console.log('Already enrolling, returning');
            return;
        }
        if (!courseData?._id) {
            console.log('Course not ready');
            return toast.error('Course not ready');
        }
        if (!userData) {
            console.log('User not logged in');
            return toast.warn("Login to Enroll!");
        }

        setEnrollingFlag(true);
        setEnrolling(true);

        try {
            const token = await getToken().catch((e) => {
                console.warn('getToken failed:', e && e.message);
                return null;
            });

            console.log('Token retrieved:', token ? 'YES' : 'NO');

            const headers = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            console.log('Enroll: sending request for course', courseData._id);
            console.log('Request headers:', headers);

            const response = await axios.post(
                backendUrl + "/api/user/enroll",
                { courseId: courseData._id },
                { headers, validateStatus: () => true }
            );

            console.log('Enroll: response status', response.status, 'data', response.data);

            const data = response.data;
            if (response.status === 201 && data && data.success) {
                toast.success("Successfully enrolled in the course!");
                setHasEnrolled(true);
                // Optimistically update UI state: userData and courseData
                try {
                    // If server returned an authoritative user object, use it
                    if (data.user && setUserData) {
                        console.log('Updating userData with server response:', data.user);
                        setUserData(data.user);
                    } else if (setUserData) {
                        setUserData((prev) => {
                            try {
                                const prevEnroll = Array.isArray(prev?.enrolledCourses) ? prev.enrolledCourses : [];
                                // avoid duplicates
                                const enrollSet = new Set(prevEnroll.map(String));
                                enrollSet.add(String(courseData._id));
                                const newEnrolledCourses = Array.from(enrollSet);
                                console.log('Updating userData enrolledCourses:', newEnrolledCourses);
                                return { ...prev, enrolledCourses: newEnrolledCourses };
                            } catch (e) {
                                console.error('Error updating userData:', e);
                                return prev;
                            }
                        });
                    }

                    // update courseData enrolledStudents count locally
                    setCourseData((prev) => {
                        if (!prev) return prev;
                        const students = Array.isArray(prev.enrolledStudents) ? [...prev.enrolledStudents] : [];
                        const currentUserId = (data.user && data.user._id) || userData?._id || 'local_user';
                        if (!students.map(String).includes(String(currentUserId))) {
                            students.push(currentUserId);
                            console.log('Updated courseData enrolledStudents count:', students.length);
                        }
                        return { ...prev, enrolledStudents: students };
                    });

                    // If server did not return user, attempt to refresh in background
                    if (!data.user && typeof fetchUserData === 'function') {
                        try {
                            await fetchUserData();
                        } catch (e) {
                            console.warn('fetchUserData failed after enroll:', e?.message || e);
                        }
                    }

                    // Refresh enrolled courses list to update context state
                    if (typeof fetchUserEnrolledCourses === 'function') {
                        try {
                            await fetchUserEnrolledCourses();
                        } catch (e) {
                            console.warn('fetchUserEnrolledCourses failed after enroll:', e?.message || e);
                        }
                    }

                    // Auto-play the first lecture after enrollment
                    if (courseData?.courseContent?.[0]?.chapterContent?.[0]?.lectureUrl) {
                        setPlayerData({
                            videoId: getYouTubeId(courseData.courseContent[0].chapterContent[0].lectureUrl),
                        });
                    }
                } catch (e) {
                    console.warn('Optimistic UI update failed:', e);
                }
            } else if (response.status === 409) {
                toast.info(data?.message || 'Already enrolled');
            } else {
                toast.error(data?.message || 'Failed to enroll');
            }
        } catch (error) {
            console.error('Enroll request failed:', error);
            toast.error('Failed to contact server');
        } finally {
            setEnrollingFlag(false);
            setEnrolling(false);
        }
    }, [courseData, userData, backendUrl, getToken, setUserData, fetchUserData, fetchUserEnrolledCourses]);

    // Helper to extract YouTube ID from common URL formats
    const getYouTubeId = (url) => {
        if (!url || typeof url !== 'string') return null;
        try {
            // youtu.be short links
            if (url.includes('youtu.be/')) return url.split('youtu.be/').pop().split(/[?&]/)[0];
            // standard watch?v=ID
            const vMatch = url.match(/[?&]v=([^&]+)/);
            if (vMatch && vMatch[1]) return vMatch[1];
            // embed urls
            const embedMatch = url.match(/\/embed\/([^?&/]+)/);
            if (embedMatch && embedMatch[1]) return embedMatch[1];
            // fallback to last path segment
            return url.split('/').pop().split(/[?&]/)[0];
        } catch (e) {
            return null;
        }
    }

    const toggleSection = (index) => {
        setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const isAlreadyEnrolled = hasEnrolled ||
                              (userData && Array.isArray(userData.enrolledCourses) && userData.enrolledCourses.some((c) => String(c) === String(courseData._id))) ||
                              (Array.isArray(enrolledCourses) && enrolledCourses.some((c) => String(c._id) === String(courseData._id)));

    return courseData ? (
        <>
            <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-20 pt-10 text-left">
                <div className="absolute top-0 left-0 w-full h-96 -z-1 bg-gradient-to-b from-cyan-100/70"></div>

                {/* left column */}
                <div className="max-w-xl z-10 text-gray-500">
                    <h1 className="md:text-3xl text-2xl font-semibold text-gray-800">
                        {courseData.courseTitle}
                    </h1>
                    <p
                        className="pt-4 md:text-base text-sm"
                        dangerouslySetInnerHTML={{
                            __html: courseData.courseDescription?.slice(0, 200) || "Course description not available.",
                        }}
                    ></p>

                    {/* student count */}
                    <div className="flex items-center space-x-2 pt-3 pb-1 text-sm text-gray-500">
                        <img src={assets.person_tick_icon} alt="students" className='w-4 h-4' />
                        <p>
                            {courseData.enrolledStudents?.length || 0}{" "}
                            {courseData.enrolledStudents?.length > 1 ? "students enrolled" : "student enrolled"}
                        </p>
                    </div>
                    
                    <p className="text-sm">
                        Course by{" "}
                        <span className="text-blue-600 underline">
                            {courseData.educator?.name || "Unknown Educator"}
                        </span>
                    </p>

                    <div className="pt-8 text-gray-800">
                        <h2 className="text-xl font-semibold">Course Structure</h2>
                        <div className="pt-5">
                            {courseData.courseContent?.map((chapter, index) => (
                                <div
                                    className="border border-gray-300 bg-white mb-2 rounded"
                                    key={index}
                                >
                                    <div
                                        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                                        onClick={() => toggleSection(index)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                className={`transform transition-transform ${
                                                    openSections[index] ? "rotate-180" : ""
                                                }`}
                                                src={assets.down_arrow_icon}
                                                alt="down_arrow_icon"
                                            />
                                            <p className="font-medium md:text-base text-sm">
                                                {chapter.chapterTitle}
                                            </p>
                                        </div>
                                        <p className="text-sm md:text-default">
                                            {chapter.chapterContent?.length || 0} lectures -{" "}
                                            {calculateChapterTime(chapter)}{" "}
                                        </p>
                                    </div>

                                    {openSections[index] && chapter.chapterContent && (
                                        <div className="border-t border-gray-300">
                                            <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600">
                                                {chapter.chapterContent.map((lecture, i) => (
                                                    <li key={i} className="flex items-start gap-2 py-1">
                                                        <img
                                                            onClick={() =>
                                                                setPlayerData({
                                                                    videoId: getYouTubeId(lecture.lectureUrl),
                                                                })
                                                            }
                                                            className="w-4 h-4 mt-1 cursor-pointer"
                                                            src={assets.play_icon}
                                                            alt="play_icon"
                                                        />
                                                        <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                                                            <p>{lecture.lectureTitle}</p>
                                                            <div className="flex gap-2">
                                                                {lecture.isPreviewFree && (
                                                                    <p
                                                                        onClick={() =>
                                                                            setPlayerData({
                                                                                videoId: getYouTubeId(lecture.lectureUrl),
                                                                            })
                                                                        }
                                                                        className="text-blue-500 cursor-pointer"
                                                                    >
                                                                        Preview
                                                                    </p>
                                                                )}
                                                                <p>
                                                                    {humanizeDuration(
                                                                        lecture.lectureDuration * 60 * 1000,
                                                                        { units: ["h", "m"] }
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* right column */}
                <div className="max-w-md z-10 shadow-lg rounded overflow-hidden bg-white min-w-[300px] sm:min-w-[420px]">
                    {playerData ? (
                        <YouTube
                            videoId={playerData.videoId}
                            opts={{ playerVars: { autoplay: 0 } }}
                            iframeClassName="w-full aspect-video"
                        />
                    ) : (
                        <div className="relative">
                            <img 
                                src={courseData.courseThumbnail || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"} 
                                alt="courseThumbnail" 
                                className="w-full h-48 object-cover"
                            />
                            <span className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
                                FREE COURSE
                            </span>
                        </div>
                    )}

                    <div className="p-5">
                        <div className="flex gap-3 items-center pt-2">
                            <p className="md:text-3xl text-2xl font-semibold text-green-600">
                                Free
                            </p>
                        </div>

                        <div className="flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500">
                            <div className="flex items-center gap-1">
                                <img src={assets.person_tick_icon} alt="students" className='w-4 h-4' />
                                <p>{courseData.enrolledStudents?.length || 0} students</p>
                            </div>

                            <div className="h-4 w-px bg-gray-500/40"></div>

                            <div className="flex items-center gap-1">
                                <img src={assets.time_clock_icon} alt="time_clock_icon" />
                                <p>{calculateCourseDuration(courseData)}</p>
                            </div>

                            <div className="h-4 w-px bg-gray-500/40"></div>

                            <div className="flex items-center gap-1">
                                <img src={assets.lesson_icon} alt="lesson_icon" />
                                <p>{calculateNoOfLectures(courseData)} lessons</p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {(isAlreadyEnrolled || hasEnrolled) ? (
                                <p className="w-full py-3 rounded text-center bg-green-600 text-white font-medium">
                                    Already Enrolled
                                </p>
                            ) : (
                                <button
                                    onClick={enrollCourse}
                                    disabled={enrolling}
                                    className={`w-full py-3 rounded text-center text-white font-medium transition-colors ${enrolling ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {enrolling ? 'Enrolling...' : 'Enroll for Free'}
                                </button>
                            )}

                            {/* VIDEO CONFERENCE BUTTON - ADDED HERE */}
                            {userData && (
                                <Link 
                                    to={`/video-class/${courseData._id}`}
                                    className="block w-full text-center py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                                >
                                    🎥 Join Live Class Session
                                </Link>
                            )}

                            {!userData && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 text-sm text-center">
                                        <span className="font-semibold">Sign in required:</span> 
                                        Please sign in to enroll or join live classes
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-6">
                            <p className="md:text-xl text-lg font-medium text-gray-800">
                                What's in the course?{" "}
                            </p>
                            <ul className="ml-4 pt-2 text-sm md:text-default list-disc text-gray-500 space-y-1">
                                <li>Lifetime access with free updates</li>
                                <li>Step-by-step, hands-on project guidance</li>
                                <li>Downloadable resources and source code</li>
                                <li>Quizzes to test your knowledge</li>
                                <li>Certificate of completion</li>
                                <li className="text-purple-600 font-medium">🎥 Live interactive classes</li>
                                <li className="text-purple-600 font-medium">💬 Real-time chat with instructor</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    ) : (
        <Loading />
    );
};

export default CourseDetails;
