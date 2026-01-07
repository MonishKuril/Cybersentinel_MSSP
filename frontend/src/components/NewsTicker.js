import React, { useState, useEffect } from 'react';
import './NewsTicker.css';
import * as api from '../services/api';

const DEFAULT_NEWS = [
  { title: 'SIEM Dashboard: All systems are operational.', link: '#' },
  { title: 'Cybersecurity monitoring is active.', link: '#' }
];

const NewsTicker = ({ inManagementView }) => {
  const [news, setNews] = useState([]);
  const [source, setSource] = useState('Local');
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await api.getNews();
        if (data && data.news && data.news.length > 0) {
            setNews(data.news);
            setSource(data.source || 'Internal');
        } else {
            setNews(DEFAULT_NEWS);
            setSource('Internal');
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews(DEFAULT_NEWS);
        setSource('Internal');
      }
    };

    fetchNews();
    const newsInterval = setInterval(fetchNews, 5 * 60 * 1000); // every 5 minutes
    const timeInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);

    return () => {
      clearInterval(newsInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const footerClassName = `dashboard-footer ${inManagementView ? 'management-view' : ''}`;

  return (
    <footer className={footerClassName}>
      <div className="news-ticker-container">
        <div className={`news-ticker ${isPaused ? 'ticker-paused' : ''}`}>
          <div className="ticker-content">
            {news.map((item, index) => (
              <React.Fragment key={index}>
                <a href={item.link || item.url} target="_blank" rel="noopener noreferrer" className="ticker-item">
                  {item.title}
                </a>
                <span className="ticker-separator"> ••• </span>
              </React.Fragment>
            ))}
            {/* Duplicate for seamless scroll */}
            {news.map((item, index) => (
              <React.Fragment key={`dup-${index}`}>
                <a href={item.link || item.url} target="_blank" rel="noopener noreferrer" className="ticker-item">
                  {item.title}
                </a>
                <span className="ticker-separator"> ••• </span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="ticker-info">
            <span id="newsSource">Source: {source}</span>
            <b><span id="currentTime">{currentTime}</span></b>
            <span>SIEM v1.0</span>
            <button onClick={handlePauseToggle} title={isPaused ? 'Play' : 'Pause'}>
                {isPaused ? '▶' : '⏸'}
            </button>
        </div>
      </div>
    </footer>
  );
};

export default NewsTicker;