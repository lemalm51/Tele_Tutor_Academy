import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import Loading from "../../component/student/Loading";
import { toast } from "react-toastify";
import axios from "axios";
import Logger from "../../component/Logger";

const Dashboard = () => {
  const { backendUrl, getToken, isEducator, userData } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    console.log("🔄 Starting to fetch dashboard data...");
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + '/api/educator/dashboard', { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      console.log("📊 Dashboard API response:", data);

      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        setError(data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("💥 Dashboard fetch error:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchDashboardData();
    } else {
      setLoading(false);
      setError("Educator access required");
    }
  }, [isEducator]);

  // Safe image URL function
  const getSafeImageUrl = (imageUrl) => {
    return !imageUrl || imageUrl.trim() === '' || imageUrl === '""' 
      ? assets.profile_img 
      : imageUrl;
  };

  // Show loading
  if (loading) {
    return <Loading />;
  }

  // Show error if not educator
  if (!isEducator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Educator access required.</p>
          <p className="text-gray-400 text-sm">
            You need an educator account to view the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Show error message
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Error loading dashboard</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return dashboardData ? (
    <div className="min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="space-y-5 w-full">
        <div className="block sm:hidden">
          <Logger/>
        </div>
        
        {/* Responsive Grid for Cards - REMOVED EARNINGS CARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 items-center w-full">
          {/* Total Enrollments Card */}
          <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-full rounded-md">
            <img src={assets.patients_icon} alt="enrollments" className="w-12 h-12" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.enrolledStudentsData?.length || 0}
              </p>
              <p className="text-base text-gray-500">Total Enrollments</p>
            </div>
          </div>

          {/* Total Courses Card */}
          <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-full rounded-md">
            <img src={assets.appointments_icon} alt="courses" className="w-12 h-12" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.totalCourses || 0}
              </p>
              <p className="text-base text-gray-500">Total Courses</p>
            </div>
          </div>

          {/* REMOVED: Earnings Card */}
        </div>

        <div className="pt-8 w-full mb-10">
          <h2 className="pb-4 text-lg font-medium">Latest Enrollments</h2>
          <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20 mb-10">
            <div className="w-full overflow-x-auto">
              <table className="table-fixed md:table-auto w-full overflow-hidden">
                <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
                    <th className="px-4 py-3 font-semibold">Student Name</th>
                    <th className="px-4 py-3 font-semibold">Course Title</th>
                  </tr>
                </thead>

                <tbody className="text-sm text-gray-500">
                  {dashboardData.enrolledStudentsData?.length > 0 ? (
                    dashboardData.enrolledStudentsData.map((item, index) => {
                      const safeImageUrl = getSafeImageUrl(item.student?.imageUrl);
                      
                      return (
                        <tr key={index} className="border-b border-gray-500/20">
                          <td className="px-4 py-3 text-center hidden sm:table-cell">
                            {index + 1}
                          </td>
                          <td className="md:px-4 px-2 py-3 flex items-center space-x-3">
                            <img 
                              src={safeImageUrl} 
                              alt="student"
                              className="w-9 h-9 rounded-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = assets.profile_img;
                              }}
                            />
                            <span className="truncate">{item.student?.name || 'Unknown Student'}</span>
                          </td>
                          <td className="px-4 py-3 truncate">{item.courseTitle || 'Unknown Course'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                        📭 No enrollments found. Students need to enroll in your courses to see data here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 text-lg mb-4">No dashboard data available.</p>
        <button 
          onClick={fetchDashboardData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Try Loading Again
        </button>
      </div>
    </div>
  );
};

export default Dashboard;