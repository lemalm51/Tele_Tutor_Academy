import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import Loading from "../../component/student/Loading";
import { toast } from "react-toastify";
import axios from "axios";
import Logger from "../../component/Logger";

const Dashboard = () => {
  const { currency, backendUrl, getToken, isEducator, userData } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("=== DASHBOARD DEBUG ===");
  console.log("isEducator:", isEducator);
  console.log("userData:", userData);
  console.log("backendUrl:", backendUrl);
  console.log("dashboardData:", dashboardData);
  console.log("loading:", loading);
  console.log("error:", error);

  const fetchDashboardData = async () => {
    console.log("🔄 Starting to fetch dashboard data...");
    setLoading(true);
    setError(null);
    
    try {
      // Get token first
      const token = await getToken();
      console.log("🔑 Token available:", !!token);

      if (!token) {
        throw new Error("No authentication token available");
      }

      console.log("🌐 Calling API:", `${backendUrl}/api/educator/dashboard`);

      const response = await axios.get(`${backendUrl}/api/educator/dashboard`, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log("📊 Full API response:", response);
      console.log("✅ Response data:", response.data);

      if (response.data.success) {
        console.log("🎯 Setting dashboard data:", response.data.dashboardData);
        setDashboardData(response.data.dashboardData);
        toast.success("Dashboard loaded successfully!");
      } else {
        const errorMsg = response.data.message || "Failed to load dashboard data";
        console.log("❌ API error:", errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
        
        // Set fallback dummy data for testing
        setDashboardData({
          totalCourses: 0,
          enrolledStudentsData: [],
          totalEarnings: 0
        });
      }
    } catch (error) {
      console.error("💥 Dashboard fetch error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        request: error.request
      });
      
      let errorMessage = "Failed to load dashboard data";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout - server is not responding";
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "Network error - unable to connect to server";
      } else {
        errorMessage = error.message || "An unexpected error occurred";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);

      // Set fallback data for development
      console.log("🔄 Setting fallback data for development");
      setDashboardData({
        totalCourses: 3,
        enrolledStudentsData: [
          {
            student: {
              name: "Test Student 1",
              imageUrl: assets.profile_img
            },
            courseTitle: "Introduction to Mathematics"
          },
          {
            student: {
              name: "Test Student 2", 
              imageUrl: assets.profile_img
            },
            courseTitle: "Physics Fundamentals"
          }
        ],
        totalEarnings: 0
      });
    } finally {
      console.log("🏁 Setting loading to false");
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
      console.log("❌ User is NOT educator, setting error");
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

  // Show loading with debug info
  if (loading) {
    console.log("⏳ Rendering loading state");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-gray-500">Loading dashboard data...</p>
          <p className="text-sm text-gray-400 mt-2">
            Checking educator permissions and fetching data...
          </p>
        </div>
      </div>
    );
  }

  // Show error if not educator
  if (!isEducator) {
    console.log("🚫 Rendering non-educator error");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-gray-500 text-lg mb-4">Educator access required</p>
          <p className="text-gray-400 text-sm mb-6">
            You need an educator account to view the dashboard.
          </p>
          
          {/* Debug information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mt-4">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Information:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Current Role: <strong>{userData?.role || 'Not set'}</strong></p>
              <p>• isEducator: <strong>{isEducator?.toString()}</strong></p>
              <p>• User ID: <strong>{userData?._id || 'No user ID'}</strong></p>
              <p>• User Name: <strong>{userData?.name || 'No name'}</strong></p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show error message
  if (error && !dashboardData) {
    console.log("❌ Rendering error state:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-500 text-lg mb-4">Error loading dashboard</p>
          <p className="text-gray-400 text-sm mb-4 break-words">{error}</p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left mt-4">
            <h3 className="font-bold text-gray-800 mb-2">Troubleshooting:</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Check if backend server is running</li>
              <li>Verify API endpoint: {backendUrl}/api/educator/dashboard</li>
              <li>Check browser console for detailed errors</li>
            </ul>
          </div>
          
          <button 
            onClick={fetchDashboardData}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log("🎨 Rendering dashboard with data:", dashboardData);

  // Main dashboard render
  return dashboardData ? (
    <div className="min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="space-y-5 w-full">
        <div className="block sm:hidden">
          <Logger/>
        </div>
        
        {/* Debug Info Box - Always show in development */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 mb-2">Dashboard Debug Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>Total Courses: <strong>{dashboardData.totalCourses || 0}</strong></div>
            <div>Total Enrollments: <strong>{dashboardData.enrolledStudentsData?.length || 0}</strong></div>
            <div>Total Earnings: <strong>{currency}{dashboardData.totalEarnings || 0}</strong></div>
            <div>Data Type: <strong>{typeof dashboardData}</strong></div>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="mt-2 text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
          >
            Refresh Data
          </button>
        </div>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-center w-full">
          {/* Total Enrollments Card */}
          <div className="flex items-center gap-3 shadow-lg border border-blue-200 p-4 w-full rounded-lg bg-white">
            <img src={assets.patients_icon} alt="enrollments" className="w-12 h-12" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardData.enrolledStudentsData?.length || 0}
              </p>
              <p className="text-base text-gray-600">Total Enrollments</p>
            </div>
          </div>

          {/* Total Courses Card */}
          <div className="flex items-center gap-3 shadow-lg border border-blue-200 p-4 w-full rounded-lg bg-white">
            <img src={assets.appointments_icon} alt="courses" className="w-12 h-12" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardData.totalCourses || 0}
              </p>
              <p className="text-base text-gray-600">Total Courses</p>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="flex items-center gap-3 shadow-lg border border-blue-200 p-4 w-full rounded-lg bg-white">
            <img src={assets.earning_icon} alt="earnings" className="w-12 h-12" />
            <div>
              <p className="text-2xl font-bold text-gray-800 whitespace-nowrap">
                {currency}{dashboardData.totalEarnings || 0}
              </p>
              <p className="text-base text-gray-600">Total Earnings</p>
            </div>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="pt-8 w-full mb-10">
          <h2 className="pb-4 text-xl font-semibold text-gray-800">Latest Enrollments</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-center hidden sm:table-cell">#</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-left">Student Name</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-left">Course Title</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {dashboardData.enrolledStudentsData?.length > 0 ? (
                    dashboardData.enrolledStudentsData.map((item, index) => {
                      const safeImageUrl = getSafeImageUrl(item.student?.imageUrl);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={safeImageUrl} 
                                alt="student"
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = assets.profile_img;
                                }}
                              />
                              <span className="font-medium text-gray-800">
                                {item.student?.name || 'Unknown Student'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {item.courseTitle || 'Unknown Course'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center text-gray-400">
                          <span className="text-5xl mb-4">📭</span>
                          <p className="text-lg font-medium mb-2">No enrollments yet</p>
                          <p className="text-sm max-w-md">
                            When students enroll in your courses, they will appear here.
                            Share your course links to get started!
                          </p>
                        </div>
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
        <p className="text-gray-500 text-lg mb-4">No dashboard data available</p>
        <p className="text-gray-400 text-sm mb-6">
          This is unexpected. The dashboard data should be available.
        </p>
        <button 
          onClick={fetchDashboardData}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Try Loading Again
        </button>
      </div>
    </div>
  );
};

export default Dashboard;