import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true);

      // Wait for exit animation to complete
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 150); // Half of the transition duration

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div className={`page-transition ${isTransitioning ? 'page-exiting' : 'page-entering'}`}>
      {children}
    </div>
  );
};

export default PageTransition;
