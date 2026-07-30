import React, { useState } from 'react';
import './ClientCard.css';
import { abbreviateNumber } from '../utils/formatters';
import Sparkline from './Sparkline';

const StatNumber = ({ value, label, colorClass }) => {
    const [isHovered, setIsHovered] = useState(false);

    const displayValue = isHovered ? new Intl.NumberFormat().format(value) : abbreviateNumber(value);

    return (
        <div className="stat-item">
            <span className="stat-label">{label}</span>
            <span
                className={`stat-value ${colorClass} ${isHovered ? 'full' : 'abbreviated'}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {displayValue}
            </span>
        </div>
    );
};


const ClientCard = ({ client, logStats = { total: 0, major: 0, normal: 0 }, history = [] }) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Function to determine if client has SIEM integration
  const isSIEMClient = () => {
    // Check if client has SIEM-related configuration
    return client.graylog_host || client.log_api_host;
  };

  // Helper to ensure URL has a valid scheme (http:// or https://)
  const getNormalizedUrl = (rawUrl) => {
    if (!rawUrl) return '';
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `http://${trimmed}`;
  };

  // Function to handle SIEM SSO access. Opens the tab synchronously (not
  // after an await) so browsers don't treat it as a blocked popup; the
  // console mints the token and hands it off server-side via a form POST.
  const handleSIEMAccess = (client) => {
    console.log('Launching SIEM SSO for client:', client);
    setIsRedirecting(true);
    try {
      window.open(`/api/auth/siem-launch/${client.id}`, '_blank');
    } catch (error) {
      console.error('Error accessing SIEM:', error);
      alert('Error accessing SIEM dashboard. Please try again.');
    } finally {
      setIsRedirecting(false);
    }
  };

  // Function to handle regular client access (existing functionality)
  const handleRegularAccess = (client) => {
    const targetUrl = getNormalizedUrl(client.url);
    window.open(targetUrl, '_blank');
  };

  // Enhanced click handler for client card
  const handleCardClick = () => {
    if (isSIEMClient()) {
      handleSIEMAccess(client);
    } else {
      handleRegularAccess(client);
    }
  };

  const getStatus = () => {
    if (logStats.major > 100) return 'danger';
    if (logStats.major > 0) return 'warning';
    return 'healthy';
  }

  // Check if this client is still loading
  const isLoading = client.isLoading;

  return (
    <div className={`client-card status-${getStatus()} ${isRedirecting ? 'redirecting' : ''} ${isLoading ? 'loading' : ''}`} onClick={handleCardClick}>
      <div className="status-stripe"></div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px',
          zIndex: 2
        }}>
          <div className="spinner" style={{
            width: '30px',
            height: '30px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}

      {/* SIEM indicator */}
      {isSIEMClient() && (
        <div className="siem-indicator" style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: '#4CAF50',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 1
        }}>
          S
        </div>
      )}

      {/* Section 1: Identity */}
      <div className="card-section identity-section">
        <div className="client-icon">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="client-info">
          <h3 className="client-name">{client.name}</h3>
          <p className="client-url">{client.url}</p>
        </div>
        <p className="client-description">{client.description || "No description provided."}</p>
      </div>

      {/* Section 2: Key Metrics */}
      <div className="card-section metrics-section">
        <StatNumber value={isLoading ? 0 : logStats.total} label="Total Logs" colorClass="total-logs-color" />
        <StatNumber value={isLoading ? 0 : logStats.major} label="Major Alerts" colorClass="major-logs-color" />
        <StatNumber value={isLoading ? 0 : logStats.normal} label="Normal Logs" colorClass="normal-logs-color" />
      </div>

      {/* Section 3: Graph */}
      <div className="card-section graph-section">
          <Sparkline history={isLoading ? Array(12).fill(0) : history} />
          <div className="graph-labels">
            <span>-120s</span>
            <span>Now</span>
          </div>
      </div>
    </div>
  );
};

export default ClientCard;
