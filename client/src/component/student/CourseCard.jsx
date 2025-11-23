import React from 'react'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom'

const CourseCard = ({course}) => {
  return (
    <Link to={'/course/' + course._id} onClick={()=>scrollTo(0,0)} 
    className='border border-gray-500/30 pb-6 overflow-hidden rounded-lg'>
      <div className="relative">
        <img className='w-full h-48 object-cover' src={course.courseThumbnail} alt="courseThumbnail" />
        <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">
          FREE
        </span>
      </div>
      <div className='p-3 text-left'>
        <h3 className='text-base font-semibold'>{course.courseTitle}</h3>
        
        <div className='flex items-center space-x-2 text-gray-500 text-sm'>
          <img src={assets.person_tick_icon} alt="students" className='w-4 h-4' />
          <p>{course.enrolledStudents?.length || 0} students</p>
        </div>
        
        <p className='text-base font-semibold text-green-600 mt-2'>Free</p>
      </div>
    </Link>
  )
}

export default CourseCard