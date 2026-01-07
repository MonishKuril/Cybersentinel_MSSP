import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import ClientCard from './ClientCard';
import * as api from '../services/api';
import UnifiedHeader from './UnifiedHeader';
import NewsTicker from './NewsTicker';
import ManagementView from './ManagementView';
import ClientSearchPopup from './ClientSearchPopup';

const Dashboard = () => {
  const [clients, setClients] = useState([]);
  const [clientsData, setClientsData] = useState([]);
  const [user, setUser] = useState({ username: 'User', role: 'admin' }); // Default user
  const [managementView, setManagementView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showSearchPopup, setShowSearchPopup] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await api.checkAuth();
        if (userData.authenticated) {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.getClients();
        setClients(response);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    if (!managementView) {
      fetchClients();
    }
  }, [managementView]);

  useEffect(() => {
    setClientsData(clients.map(client => ({
      ...client,
      logCount: 0,
      logStats: { total: 0, major: 0, normal: 0 },
      history: Array(12).fill(0),
    })));
  }, [clients]);

  useEffect(() => {
    const fetchData = () => {
      clients.forEach(client => {
        // Fetch Graylog
        if (client.graylog_host) {
          api.getClientLogs(client.id)
            .then(logs => {
              setClientsData(prevData => {
                const newData = [...prevData];
                const clientIndex = newData.findIndex(c => c.id === client.id);
                if (clientIndex > -1) {
                  const newHistory = [...newData[clientIndex].history, logs.logCount || 0];
                  if (newHistory.length > 12) newHistory.shift();
                  newData[clientIndex] = {
                    ...newData[clientIndex],
                    logCount: logs.logCount || 0,
                    logStats: logs.logStats || newData[clientIndex].logStats, // Use enhanced stats if available
                    history: newHistory,
                  };
                }
                return newData;
              });
            })
            .catch(error => console.error(`Error fetching Graylog logs for client ${client.id}:`, error));
        }

        // Fetch LogAPI
        if (client.log_api_host) {
          api.getClientLogStats(client.id)
            .then(stats => {
              if (stats.success) {
                setClientsData(prevData => {
                  const newData = [...prevData];
                  const clientIndex = newData.findIndex(c => c.id === client.id);
                  if (clientIndex > -1) {
                    newData[clientIndex] = {
                      ...newData[clientIndex],
                      logStats: stats.stats,
                    };
                  }
                  return newData;
                });
              }
            })
            .catch(error => console.error(`Error fetching log stats for client ${client.id}:`, error));
        }
      });
    };

    if (clients.length > 0) {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }
  }, [clients]);

  const toggleManagementView = () => {
    setManagementView(!managementView);
  };

  const handleSearch = () => {
    const result = clients.find(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResult(result);
    setShowSearchPopup(true);
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container">
        <UnifiedHeader 
            onToggleManagementView={toggleManagementView}
            managementView={managementView}
            clientsData={clientsData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            user={user}
        />

        <div id="mainContent" style={{ paddingBottom: '40px' }}>
          {managementView ? (
            <ManagementView user={user} />
          ) : (
            <div id="dashboardView" className="dashboard-grid">
              {clientsData.map(client => (
                <ClientCard 
                  key={client.id} 
                  client={client}
                  logStats={client.logStats}
                  history={client.history}
                />
              ))}
            </div>
          )}
        </div>

        <NewsTicker inManagementView={managementView} />
        <ClientSearchPopup
          show={showSearchPopup}
          onClose={() => setShowSearchPopup(false)}
          searchResult={searchResult}
          clientsData={clientsData}
        />
      </div>
    </div>
  );
};

export default Dashboard;