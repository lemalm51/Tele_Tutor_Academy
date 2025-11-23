import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import Footer from "../../component/student/Footer";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../component/student/Loading";

const Player = () => {
  const {
    enrolledCourses,
    calculateChapterTime,
    backendUrl,
    getToken,
    userData,
    fetchUserEnrolledCourses,
    calculateNoOfLectures,
  } = useContext(AppContext);
  
  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);

  // New states to manage YouTube loading/playing
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const getCourseData = () => {
    enrolledCourses.map((course) => {
      if (course._id === courseId) {
        setCourseData(course);
      }
    });
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData();
    }
  }, [enrolledCourses]);

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/user/update-course-progress",
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        getCourseProgress();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/user/get-course-progress",
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setProgressData(data.progressData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getCourseProgress();
  }, []);

  // Helper: get first lecture object (if exists)
  const getFirstLecture = () => {
    if (!courseData) return null;
    for (let i = 0; i < courseData.courseContent.length; i++) {
      const chapter = courseData.courseContent[i];
      if (chapter.chapterContent && chapter.chapterContent.length > 0) {
        const lecture = chapter.chapterContent[0];
        // attach chapter/lecture numbers in same shape you use elsewhere
        return { ...lecture, chapter: i + 1, lecture: 1 };
      }
    }
    return null;
  };

  // When user clicks thumbnail/play overlay, open first lecture
  const handleThumbnailClick = () => {
    const first = getFirstLecture();
    if (first) {
      setPlayerData(first);
    } else {
      toast.info("No lectures available to play.");
    }
  };

  // Reset loading/playing states when playerData changes
  useEffect(() => {
    if (playerData) {
      setIsLoadingVideo(true);
      setIsPlaying(false);
    } else {
      setIsLoadingVideo(false);
      setIsPlaying(false);
    }
  }, [playerData]);

  // YouTube callbacks
  const onPlayerReady = (event) => {
    // attempt to start playback (autoplay may be blocked by browser)
    try {
      event.target.playVideo();
    } catch (e) {
      // ignore
    }
  };

  const onPlayerStateChange = (event) => {
    // YouTube player states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering
    const state = event.data;
    if (state === 1) {
      // playing
      setIsPlaying(true);
      setIsLoadingVideo(false);
    } else if (state === 3) {
      // buffering
      setIsLoadingVideo(true);
    } else if (state === 0 || state === 2 || state === -1) {
      // ended / paused / unstarted - hide loading but mark playing false
      setIsPlaying(false);
      setIsLoadingVideo(false);
    }
  };

  const youtubeOpts = {
    width: "100%",
    playerVars: {
      autoplay: 1, // ask to autoplay
    },
  };

  return courseData ? (
    <>
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36">
        {/* Left column */}
        <div className="text-gray-800">
          <h2 className="text-xl font-semibold">Course Structure</h2>
          <div className="pt-5">
            {courseData &&
              courseData.courseContent.map((chapter, index) => (
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
                      {chapter.chapterContent.length} lectures -{" "}
                      {calculateChapterTime(chapter)}{" "}
                    </p>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openSections[index] ? "max-h-9g" : "max-h-0"
                    }`}
                  >
                    <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex items-start gap-2 py-1">
                          <img
                            onClick={() =>
                              setPlayerData({
                                ...lecture,
                                chapter: index + 1,
                                lecture: i + 1,
                              })
                            }
                            className="w-4 h-4 mt-1 cursor-pointer"
                            src={
                              progressData &&
                              progressData.lectureCompleted.includes(
                                lecture.lectureId
                              )
                                ? assets.blue_tick_icon
                                : assets.play_icon
                            }
                            alt="play_icon"
                          />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                            <p>{lecture.lectureTitle}</p>
                            <div className="flex gap-2">
                              {lecture.lectureUrl && (
                                <p
                                  onClick={() =>
                                    setPlayerData({
                                      ...lecture,
                                      chapter: index + 1,
                                      lecture: i + 1,
                                    })
                                  }
                                  className="text-blue-500 cursor-pointer"
                                >
                                  Watch
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
                </div>
              ))}
          </div>

          {/* Student Progress Info */}
          <div className="bg-blue-50 p-4 rounded-lg mt-8 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Your Progress</h3>
            {progressData ? (
              <div className="space-y-2">
                <p className="text-sm text-blue-700">
                  Completed: {progressData.lectureCompleted.length} of {calculateNoOfLectures(courseData)} lectures
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(progressData.lectureCompleted.length / calculateNoOfLectures(courseData)) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600">
                  {Math.round((progressData.lectureCompleted.length / calculateNoOfLectures(courseData)) * 100)}% complete
                </p>
              </div>
            ) : (
              <p className="text-sm text-blue-600">Loading your progress...</p>
            )}
          </div>
        </div>

        {/* right column */}
        <div className="md:mt-10">
          {playerData ? (
            <div className="relative">
              {/* show Loading spinner while buffering/not playing */}
              {isLoadingVideo && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
                  <Loading />
                </div>
              )}

              <YouTube
                videoId={playerData.lectureUrl.split("/").pop()}
                iframeClassName="w-full aspect-video"
                opts={youtubeOpts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
              />

              <div className="flex justify-between items-center mt-4 p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">
                    {playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}{" "}
                  </p>
                  <p className="text-sm text-gray-500">
                    Duration: {humanizeDuration(playerData.lectureDuration * 60 * 1000, { units: ["h", "m"] })}
                  </p>
                </div>
                <button
                  onClick={() => markLectureAsCompleted(playerData.lectureId)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    progressData &&
                    progressData.lectureCompleted.includes(playerData.lectureId)
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {progressData &&
                  progressData.lectureCompleted.includes(playerData.lectureId)
                    ? "✓ Completed"
                    : "Mark Complete"}
                </button>
              </div>
            </div>
          ) : (
            // Thumbnail with a centered play icon overlay. Click to open first lecture.
            <div
              className="relative cursor-pointer select-none"
              onClick={handleThumbnailClick}
            >
              <img
                src={courseData ? courseData.courseThumbnail : ""}
                alt="courseThumbnail"
                className="w-full object-cover aspect-video rounded"
              />

              {/* dark overlay to make play icon pop */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 shadow-xl transform transition-transform duration-300 hover:shadow-2xl cursor-pointer">
                  <img
                    src={assets.play_icon}
                    alt="play_overlay"
                    className="w-8 h-8 transform transition-transform duration-300 hover:scale-110"
                  />
                </div>
              </div>

              {/* Course info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white rounded-b">
                <h3 className="text-xl font-bold">{courseData.courseTitle}</h3>
                <p className="text-sm mt-1">
                  Click the play button to start learning
                </p>
              </div>
            </div>
          )}

          {/* Course Overview Card */}
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Course Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <img src={assets.lesson_icon} alt="lessons" className="w-4 h-4" />
                <span>{calculateNoOfLectures(courseData)} lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={assets.time_clock_icon} alt="duration" className="w-4 h-4" />
                <span>{calculateChapterTime({ chapterContent: courseData.courseContent.flatMap(chap => chap.chapterContent) })}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={assets.person_tick_icon} alt="students" className="w-4 h-4" />
                <span>{courseData.enrolledStudents?.length || 0} students</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={assets.chapter_icon} alt="chapters" className="w-4 h-4" />
                <span>{courseData.courseContent?.length || 0} chapters</span>
              </div>
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

export default Player;