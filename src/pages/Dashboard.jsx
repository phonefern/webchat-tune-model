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

  
  useEffect(() => {
    setIsLoading(true); 

    const timer = setTimeout(() => {
      setIsLoading(false); 
      navigate('/app'); 
    }, 5000); 

    return () => clearTimeout(timer); 
  }, [navigate]);



  return (
    <div className="dashboard">
      
      {isLoading ? ( 
        <div>
          {/* Display the loading GIF */}
          <img src="../img/Opener Loading.gif" alt="Loading..." style={{width: '250px'}}/>
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
