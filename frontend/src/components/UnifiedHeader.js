import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UnifiedHeader.css';
import * as api from '../services/api';
import ThemeToggleButton from './ThemeToggleButton';
import OutlineButton from './OutlineButton';
import Leaderboard from './Leaderboard';





// Simple SVG for Search Icon
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);

const UnifiedHeader = ({ onToggleManagementView, managementView, clientsData, searchTerm, setSearchTerm, handleSearch, user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.logout();
    navigate('/login');
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const welcomeMessage = () => {
    if (user.role === 'main-superadmin') {
      return 'Welcome Back, Main Super Admin!';
    } else if (user.role === 'superadmin') {
      return 'Welcome Back, Super Admin!';
    }
    return `Welcome Back, ${user.username}!`;
  };

  return (
    <header className="unified-header">
      <div className="header-left">
        <img src="/cybersentinel_fevicon.png" alt="CyberSentinel Logo" className="logo" />
        <div className="header-titles">
            <h1>MSSP Client Console</h1>
            <div className="welcome-message">
                <h2>{welcomeMessage()}</h2>
            </div>
        </div>
      </div>
      <div className="header-right">
        <div className="header-top-row">
            <ThemeToggleButton />
            <OutlineButton onClick={refreshPage} text="Refresh" />
            <OutlineButton onClick={onToggleManagementView} text={managementView ? 'Desktop' : 'Manage'} />
            <OutlineButton onClick={handleLogout} text="Logout" />
        </div>
        <div className="header-bottom-row">
            <div className="search-bar-integrated">
                <SearchIcon />
                <input
                    type="text"
                    id="clientSearch"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
            </div>
            <Leaderboard clients={clientsData} />
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;
