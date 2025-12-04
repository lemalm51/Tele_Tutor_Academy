import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { NavLink } from 'react-router-dom';
import { assets } from '../../assets/assets';

const Sidebar = () => {
  const { isEducator, userData, loading } = useContext(AppContext);
  const [showSidebar, setShowSidebar] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("=== SIDEBAR DEBUG ===");
    console.log("isEducator:", isEducator);
    console.log("userData:", userData);
    console.log("loading:", loading);
    console.log("userData role:", userData?.role);
    console.log("=====================");
  }, [isEducator, userData, loading]);

  // Force show sidebar for testing - REMOVE THIS LATER
  useEffect(() => {
    // Temporarily force show sidebar to test layout
    setShowSidebar(true);
    
    // Check after a delay if user is educator
    const timer = setTimeout(() => {
      if (isEducator || userData?.role === 'educator') {
        setShowSidebar(true);
      } else {
        // Still show for testing, but you can set to false later
        setShowSidebar(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isEducator, userData]);

  if (!showSidebar) {
    return (
      <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-500 py-2 flex flex-col'>
        <div className="text-center p-4 text-xs">
          {/* Loading sidebar... */}
        </div>
      </div>
    );
  }

  const menuItems = [
    // {name: 'Dashboard', path: '/educator', icon: assets.home_icon },
    {name: 'Add Course', path: '/educator/add-course', icon: assets.add_icon },
    {name: 'My Courses', path: '/educator/my-courses', icon: assets.my_course_icon },
    {name: 'Student Enrolled', path: '/educator/student-enrolled', icon: assets.person_tick_icon },
  ];
  
  return (
    <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-500 py-2 flex flex-col bg-white'>
      <div className="p-4 border-b">
        {/* <div className="text-xs font-bold text-green-600">EDUCATOR PANEL</div> */}
        {/* <div className="text-xs text-gray-500">Role: {userData?.role || 'unknown'}</div> */}
      </div>
      
      {menuItems.map((item) => (
        <NavLink
          to={item.path}
          key={item.name}
          end={item.path === '/educator'}
          className={({isActive}) => `flex items-center md:flex-row flex-col md:justify-start justify-center py-3.5 md:px-10 gap-3 ${isActive ? 'bg-indigo-50 border-r-[6px] border-indigo-500/90' : 'hover:bg-gray-100/90 border-r-[6px] border-white hover:border-gray-100/90 '} `}
        >
          <img src={item.icon} alt={item.name} className='w-6 h-6' />
          <p className='md:block hidden text-center'>{item.name}</p>
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;