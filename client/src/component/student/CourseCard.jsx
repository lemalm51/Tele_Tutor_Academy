import React from 'react'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const CourseCard = ({course}) => {
  const navigate = useNavigate();

  const handleCourseClick = () => {
    scrollTo(0,0);
    // Navigate smoothly without forcing page refresh
    navigate('/course/' + course._id);
  };

  return (
    <div onClick={handleCourseClick} className='border border-gray-500/30 pb-6 overflow-hidden rounded-lg cursor-pointer'>
      <div className="relative">
        <img className='w-full h-48 object-cover' src={course.courseThumbnail} alt="courseThumbnail" />
        <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">

        </span>
      </div>
      <div className='p-3 text-left'>
        <h3 className='text-base font-semibold'>{course.courseTitle}</h3>

        <div className='flex items-center space-x-2 text-gray-500 text-sm'>
          <img src={assets.person_tick_icon} alt="students" className='w-4 h-4' />
          <p>{course.enrolledStudents?.length || 0} students</p>
        </div>

        <p className='text-base font-semibold text-green-600 mt-2'>STEMA</p>
      </div>
    </div>
  )
}

export default CourseCard