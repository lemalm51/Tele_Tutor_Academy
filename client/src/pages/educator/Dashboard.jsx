import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { assets, dummyDashboardData } from "../../assets/assets";
import Loading from "../../component/student/Loading";
import { toast } from "react-toastify";
import axios from "axios";
import Logger from "../../component/Logger";

const Dashboard = () => {
  const { currency, backendUrl, getToken, isEducator, userData } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enhanced debug logging
  console.log("=== DASHBOARD DEBUG ===");
  console.log("isEducator:", isEducator);
  console.log("userData:", userData);
  console.log("userRole:", userData?.role);
  console.log("backendUrl:", backendUrl);
  console.log("current dashboardData:", dashboardData);

  const fetchDashboardData = async () => {
    console.log("🔄 Starting to fetch dashboard data...");
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      console.log("🔑 Token available:", !!token);
      console.log("🌐 Calling API:", backendUrl + '/api/educator/dashboard');

      const { data } = await axios.get(backendUrl + '/api/educator/dashboard', { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      console.log("📊 Dashboard API response:", data);
      console.log("✅ Response success:", data.success);
      console.log("📈 Dashboard data received:", data.dashboardData);

      if (data.success) {
        console.log("🎯 Setting dashboard data");
        setDashboardData(data.dashboardData);
      } else {
        console.log("❌ API returned error:", data.message);
        setError(data.message);
        toast.error(data.message);
        // Fallback to dummy data for testing
        console.log("🔄 Falling back to dummy data");
        setDashboardData(dummyDashboardData);
      }
    } catch (error) {
      console.error("💥 Dashboard fetch error:", error);
      console.error("📡 Error response:", error.response);
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      toast.error(errorMessage);
      // Fallback to dummy data for testing
      console.log("🔄 Falling back to dummy data due to error");
      setDashboardData(dummyDashboardData);
    } finally {
      console.log("🏁 Fetch completed, setting loading to false");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🎬 Dashboard useEffect triggered");
    console.log("👨‍🏫 isEducator value:", isEducator);
    
    if (isEducator) {
      console.log("✅ User is educator, fetching data...");
      fetchDashboardData();
    } else {
      console.log("❌ User is NOT educator, skipping fetch");
      setLoading(false);
      setError("Educator access required");
    }
  }, [isEducator]);

  // Safe image URL function
  const getSafeImageUrl = (imageUrl) => {
    const safeUrl = !imageUrl || imageUrl.trim() === '' || imageUrl === '""' 
      ? assets.profile_img 
      : imageUrl;
    console.log("🖼️ Image URL conversion:", { original: imageUrl, safe: safeUrl });
    return safeUrl;
  };

  // Show loading
  if (loading) {
    console.log("⏳ Rendering loading state");
    return <Loading />;
  }

  // Show error if not educator
  if (!isEducator) {
    console.log("🚫 Rendering non-educator error");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Educator access required.</p>
          <p className="text-gray-400 text-sm">
            You need an educator account to view the dashboard.
          </p>
          <div className="mt-4 p-4 bg-yellow-100 rounded-lg max-w-md mx-auto">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <p className="text-sm">Current Role: {userData?.role || 'Not set'}</p>
            <p className="text-sm">isEducator: {isEducator?.toString()}</p>
            <p className="text-sm">User ID: {userData?._id || 'No user ID'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error message
  if (error && !dashboardData) {
    console.log("❌ Rendering error state:", error);
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

  console.log("🎨 Rendering dashboard with data:", dashboardData);

  // Show dashboard with data
  return dashboardData ? (
    <div className="min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="space-y-5 w-full">
        <div className="block sm:hidden">
          <Logger/>
        </div>
        
        {/* Debug Info Box */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Dashboard Debug Info</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Total Courses: <strong>{dashboardData.totalCourses || 0}</strong></div>
            <div>Total Enrollments: <strong>{dashboardData.enrolledStudentsData?.length || 0}</strong></div>
            <div>Total Earnings: <strong>{currency}{dashboardData.totalEarnings || 0}</strong></div>
            <div>Data Type: <strong>{typeof dashboardData}</strong></div>
          </div>
        </div>
        
        {/* Responsive Grid for Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-center w-full">
          <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-full rounded-md">
            <img src={assets.patients_icon} alt="enrollments" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.enrolledStudentsData?.length || 0}
              </p>
              <p className="text-base text-gray-500">Total Enrollments</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-full rounded-md">
            <img src={assets.appointments_icon} alt="courses" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.totalCourses || 0}
              </p>
              <p className="text-base text-gray-500">Total Courses</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-full rounded-md">
            <img src={assets.earning_icon} alt="earnings" />
            <div className="whitespace-nowrap">
              <p className="text-2xl font-medium text-gray-600 text-nowrap">
                {currency}{dashboardData.totalEarnings || 0}
              </p>
              <p className="text-base text-gray-500">Total Earnings</p>
            </div>
          </div>
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
        <p className="text-gray-400 text-sm mb-4">This means the API returned no data.</p>
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