import React, { useContext, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useUser } from '@clerk/clerk-react';
import SimpleVideoConference from '../../component/video/SimpleVideoConference';
import Footer from '../../component/student/Footer';
import { assets } from '../../assets/assets';

const VideoClass = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { allCourses, isEducator } = useContext(AppContext);
  
  const [roomId, setRoomId] = useState(() => {
    // Use existing room ID from URL or generate new one
    const params = new URLSearchParams(location.search);
    const existingRoomId = params.get('roomId');
    return existingRoomId || `stema-class-${courseId}-${Date.now()}`;
  });
  const [showRoomOptions, setShowRoomOptions] = useState(!user);

  const course = allCourses.find(c => c._id === courseId);
  
  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/video-class/${courseId}?roomId=${roomId}`;
    navigator.clipboard.writeText(roomLink)
      .then(() => alert('Room link copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to join or create live classes.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h2>
          <p className="text-gray-600 mb-6">
            The requested course could not be found.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <SimpleVideoConference 
          roomId={roomId}
          courseName={course.courseTitle}
          isEducatorMode={isEducator}
        />
        
        {/* Room Info Floating Button */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          <button
            onClick={copyRoomLink}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 flex items-center gap-2"
            title="Copy room link"
          >
            <img src={assets.link_icon} alt="copy" className="w-4 h-4" />
            Copy Invite Link
          </button>
          
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 flex items-center gap-2"
          >
            ← Back to Course
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default VideoClass;