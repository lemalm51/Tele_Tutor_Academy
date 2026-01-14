import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../component/student/Loading'
import axios from 'axios'
import { toast } from 'react-toastify'
import Logger from '../../component/Logger'

const MyCourses = () => {
  const { currency, backendUrl, isEducator, getToken, loading: contextLoading, userData } = useContext(AppContext);
  const [courses, setCourses] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // TEMPORARY: Override to test the component
  const overrideIsEducator = true;
  const tempIsEducator = overrideIsEducator || isEducator;

  console.log("=== MY COURSES DEBUG ===");
  console.log("isEducator:", isEducator);
  console.log("userData:", userData);
  console.log("userRole:", userData?.role);

  const fetchEducatorCourses = async () => {
    setCoursesLoading(true);
    try {
      const token = await getToken();
      console.log("Token available:", !!token);
      
      const { data } = await axios.get(`${backendUrl}/api/educator/courses`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log("Courses API response:", data);
      
      if (data.success) {
        setCourses(data.courses || []);
      } else {
        toast.error(data.message || "Failed to load courses");
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching educator courses:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || error.message);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }

  useEffect(() => {
    console.log("MyCourses useEffect - tempIsEducator:", tempIsEducator, "contextLoading:", contextLoading);
    
    if (tempIsEducator && !contextLoading) {
      console.log("Fetching educator courses...");
      fetchEducatorCourses();
    } else if (!contextLoading) {
      setCoursesLoading(false);
    }
  }, [tempIsEducator, contextLoading]);

  // Show loading while context is loading or while fetching courses
  if (contextLoading || (tempIsEducator && coursesLoading)) {
    return <Loading />;
  }

  // Show educator access required message (using tempIsEducator)
  if (!tempIsEducator) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Educator access required.</p>
          <p className="text-gray-400 text-sm mb-4">
            You need to have an educator account to access this page.
          </p>
        </div>
      </div>
    );
  }

  // No courses
  if (!courses || courses.length === 0) {
    return (
      <div className='h-full mb-10 flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
        <div className='w-full'>
          <div className="block sm:hidden">
            <Logger/>
          </div>
          <h2 className='pb-4 text-lg font-medium'>My Courses</h2>
          <div className='flex items-center justify-center py-12 border border-gray-500/20 rounded-md bg-white'>
            <p className='text-gray-500'>No courses found. Create your first course!</p>
          </div>
        </div>
      </div>
    );
  }

  // Render courses table
  return (
    <div className='h-full mb-10 flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='w-full'>
        <div className="block sm:hidden">
          <Logger/>
        </div>
        <h2 className='pb-4 text-lg font-medium'>My Courses</h2>
        <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20'>
          <table className='md:table-auto table-fixed w-full overflow-hidden'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
              <tr>
                <th className='px-4 py-3 font-semibold truncate'>All Courses</th>
                <th className='px-4 py-3 font-semibold truncate'>Students</th>
                <th className='px-4 py-3 font-semibold truncate'>Course Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-500">
              {courses.map((course) => (
                <tr key={course._id} className="border-b border-gray-500/20">
                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                    <img 
                      src={course.courseThumbnail} 
                      alt="CourseImage"
                      className="w-16 h-12 object-cover rounded"
                    />
                    <span className="truncate hidden md:block">{course.courseTitle}</span>
                  </td>
                  <td className='px-4 py-3'>{course.enrolledStudents?.length || 0}</td>
                  <td className='px-4 py-3'>
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MyCourses;