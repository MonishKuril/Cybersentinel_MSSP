import React, { useState, useEffect } from 'react';
import './Welcome.css';

const Welcome = () => {
  const [userData, setUserData] = useState({ username: '', role: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        if (data.authenticated) {
          setUserData({ username: data.username, role: data.role });
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };

    fetchUserData();
  }, []);

  const getWelcomeMessage = () => {
    switch (userData.role) {
      case 'main-superadmin':
        return 'Welcome Back, Main Super Admin!';
      case 'superadmin':
        return 'Welcome Back, Super Admin!';
      default:
        return `Welcome Back, ${userData.username}!`;
    }
  };

  return (
    <div className="welcome-section">
      <h2>{getWelcomeMessage()}</h2>
    </div>
  );
};

export default Welcome;
