import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const Dashboard = () => {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/'); // Redirect to login if user is not logged in
      } else {
        setIsAnonymous(user.isAnonymous); // Check if the user is anonymous
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [navigate]);

  // Add a useEffect to show loading GIF and navigate to ChatPage after 3 seconds
  useEffect(() => {
    setIsLoading(true); // Set loading to true

    const timer = setTimeout(() => {
      setIsLoading(false); // Stop showing the loading GIF
      navigate('/chat'); // Redirect to ChatPage after 3 seconds
    }, 5000); 

    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [navigate]);

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  return (
    <div className="dashboard">
      
      {isLoading ? ( 
        <div>
          {/* Display the loading GIF */}
          <img src="../img/Opener Loading.gif" alt="Loading..." style={{width: '200px'}}/>
          <h2>{isAnonymous ? 'Welcome, Guest!' : 'Welcome to your Dashboard'}</h2>
          <p>Redirecting to chat, please wait...</p>
        </div>
      ) : (
        isAnonymous && (
          <p>As a guest, your access is limited. Redirecting to chat...</p>
        )
      )}
    </div>
  );
};

export default Dashboard;
