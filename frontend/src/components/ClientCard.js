import React, { useState } from 'react';
import './ClientCard.css';
import { abbreviateNumber } from '../utils/formatters';
import Sparkline from './Sparkline';
import * as api from '../services/api';

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

  // Function to handle SIEM SSO access
  const handleSIEMAccess = async (client) => {
    console.log('Redirecting to SIEM for client:', client); // Add this log
    setIsRedirecting(true);
    try {
      // Request MSSP to generate SIEM access token
      const response = await api.getSIEMToken();

      if (response.success) {
        // Redirect to client's SIEM endpoint with the SSO token
        // Use the client's URL as the base and append the SSO login path
        const siemBaseUrl = new URL(client.url).origin;
        const redirectUrl = `${siemBaseUrl}/mssp-login?token=${encodeURIComponent(response.siemToken)}`;
        window.location.href = redirectUrl;
      } else {
        console.error('Failed to get SIEM access token:', response.message);
        alert('Failed to access SIEM dashboard. Please try again.');
      }
    } catch (error) {
      console.error('Error accessing SIEM:', error);
      alert('Error accessing SIEM dashboard. Please try again.');
    } finally {
      setIsRedirecting(false);
    }
  };

  // Function to handle regular client access (existing functionality)
  const handleRegularAccess = (client) => {
    window.open(client.url, '_blank');
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

  return (
    <div className={`client-card status-${getStatus()} ${isRedirecting ? 'redirecting' : ''}`} onClick={handleCardClick}>
      <div className="status-stripe"></div>

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
        <StatNumber value={logStats.total} label="Total Logs" colorClass="total-logs-color" />
        <StatNumber value={logStats.major} label="Major Alerts" colorClass="major-logs-color" />
        <StatNumber value={logStats.normal} label="Normal Logs" colorClass="normal-logs-color" />
      </div>

      {/* Section 3: Graph */}
      <div className="card-section graph-section">
          <Sparkline history={history} />
          <div className="graph-labels">
            <span>-120s</span>
            <span>Now</span>
          </div>
      </div>
    </div>
  );
};

export default ClientCard;
