import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = ({ clients }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    if (clients) {
      const sortedData = [...clients]
        .sort((a, b) => (b.logCount || 0) - (a.logCount || 0))
        .slice(0, 5);
      setLeaderboardData(sortedData);
    }
  }, [clients]);

  const toggleLeaderboard = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="leaderboard-wrapper">
      <button className="leaderboard-toggle" onClick={toggleLeaderboard}>
        <span className="icon">📊</span> Top Servers
        <span className="arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="leaderboard-dropdown">
          <div className="leaderboard-list">
            {leaderboardData.map((client, index) => (
              <div className="leaderboard-item" key={client.id}>
                <div className="leaderboard-rank">{index + 1}</div>
                <div className="leaderboard-name" title={client.name}>{client.name}</div>
                <div className="leaderboard-count">{client.logCount || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;