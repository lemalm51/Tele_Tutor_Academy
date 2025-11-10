import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
    // Only fetch calculateRating, as currency and price are not needed
    const { calculateRating } = useContext(AppContext); 
    
    const rating = parseFloat(calculateRating(course));
    
    return (
        <Link 
            to={'/course/' + course._id} 
            onClick={() => window.scrollTo(0, 0)} 
            className='border border-gray-500/30 pb-6 overflow-hidden rounded-lg'
        >
            <img className='w-full' src={course.courseThumbnail} alt="courseThumbnail" />
            
            <div className='p-3 text-left'>
                <h3 className='text-base font-semibold'>{course.courseTitle}</h3>
                
                {/* 🛑 Price/Cost Information Removed 🛑 */}
                
                <div className='flex items-center space-x-2'>
                    {/* Display the calculated rating */}
                    <p>{rating.toFixed(1)}</p> 
                    
                    <div className='flex'>
                        {/* Star rating visualization */}
                        {[...Array(5)].map((_, i) => (
                            <img 
                                className='w-3.5 h-3.5' 
                                key={i} 
                                src={i < Math.floor(rating) ? assets.star : assets.star_blank} 
                                alt='star' 
                            />
                        ))}
                    </div>
                    
                    <p className='text-gray-500'>({course.courseRatings ? course.courseRatings.length : 0})</p>
                </div>
                
                {/* 🛑 The entire price display paragraph has been removed 🛑 */}
            </div>
        </Link>
    );
};

export default CourseCard;