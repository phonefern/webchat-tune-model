import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; // Assuming your Firebase config is in this file
import { useNavigate } from 'react-router-dom';
import "./Styles.css";
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // console.log("cap")
      if (user) {
        // console.log("cap2")
        setIsAuthenticated(true);
      } else {
        // console.log("cap3")
        setIsAuthenticated(false);
        navigate('/'); // Redirect to login if not authenticated
      }
      setLoading(false);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return  <div className="loading-container">
    {/* Display the loading GIF */}
    <img src="../img/Dots Loader.gif" alt="Loading..." style={{width: '100px'}}/>
  </div>; // Loading spinner while checking auth state
  }

  return isAuthenticated ? children : null;
};

export default ProtectedRoute;
