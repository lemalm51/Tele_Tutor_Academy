import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  BookOpen,
  Users,
  Eye,
  Trash,
  GraduationCap,
  User,
  CheckCircle,
  Plus,
  MagnifyingGlass
} from 'phosphor-react';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/admin/courses');
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await axios.delete(`/api/admin/courses/${courseId}`);
      if (response.data.success) {
        toast.success('Course deleted successfully');
        fetchCourses(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.educator?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <GraduationCap size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Course Management
              </h1>
              <p className="text-gray-300 text-lg">Manage all courses on the platform</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses or educators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              <Plus size={20} />
              Add Course
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <BookOpen size={24} className="text-white" />
              <div>
                <p className="text-blue-100 text-sm">Total Courses</p>
                <p className="text-white text-2xl font-bold">{courses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-white" />
              <div>
                <p className="text-green-100 text-sm">Total Students</p>
                <p className="text-white text-2xl font-bold">
                  {courses.reduce((acc, course) => acc + (course.enrolledStudents?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <User size={24} className="text-white" />
              <div>
                <p className="text-purple-100 text-sm">Active Educators</p>
                <p className="text-white text-2xl font-bold">
                  {new Set(courses.map(course => course.educator?._id).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-700"
            >
              {/* Course Image */}
              <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600">
                <img
                  className="w-full h-full object-cover"
                  src={course.courseThumbnail || '/default-course.jpg'}
                  alt={course.courseTitle}
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle size={12} />
                    Active
                  </span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                  {course.courseTitle}
                </h3>

                <div className="flex items-center gap-2 mb-3">
                  <User size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    {course.educator?.name || 'Unknown Educator'}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-gray-300 text-sm">
                      {course.enrolledStudents?.length || 0} students
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-gray-400" />
                    <span className="text-gray-300 text-sm">
                      {course.courseContent?.length || 0} chapters
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                    <Eye size={16} />
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={64} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-xl mb-2">
              {searchTerm ? 'No courses match your search' : 'No courses found'}
            </p>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first course'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;
