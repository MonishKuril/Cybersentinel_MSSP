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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // First, check user authentication
        const userData = await api.checkAuth();
        if (userData.authenticated) {
          setUser(userData);
        }

        // Then fetch clients
        if (!managementView) {
          const response = await api.getClients();
          setClients(response);

          // Initialize clients data with loading state
          const initialClientsData = response.map(client => ({
            ...client,
            logCount: 0,
            logStats: { total: 0, major: 0, normal: 0 },
            history: Array(12).fill(0),
            isLoading: true, // Add loading state for individual client
          }));
          setClientsData(initialClientsData);
        } else {
          setClients([]);
          setClientsData([]);
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [managementView]);

  // Separate effect for fetching log data with staggered timing
  useEffect(() => {
    if (!isLoading && clients.length > 0 && !managementView) {
      // Process clients with staggered intervals to avoid overwhelming the server
      const fetchClientDataWithDelay = async (client, delay) => {
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
          // Fetch Graylog data
          if (client.graylog_host) {
            const logs = await api.getClientLogs(client.id);
            setClientsData(prevData => {
              const newData = [...prevData];
              const clientIndex = newData.findIndex(c => c.id === client.id);
              if (clientIndex > -1) {
                const newHistory = [...newData[clientIndex].history, logs.logCount || 0];
                if (newHistory.length > 12) newHistory.shift();
                newData[clientIndex] = {
                  ...newData[clientIndex],
                  logCount: logs.logCount || 0,
                  logStats: logs.logStats || newData[clientIndex].logStats,
                  history: newHistory,
                  isLoading: false,
                };
              }
              return newData;
            });
          }

          // Fetch LogAPI data
          if (client.log_api_host) {
            const stats = await api.getClientLogStats(client.id);
            if (stats.success) {
              setClientsData(prevData => {
                const newData = [...prevData];
                const clientIndex = newData.findIndex(c => c.id === client.id);
                if (clientIndex > -1) {
                  newData[clientIndex] = {
                    ...newData[clientIndex],
                    logStats: stats.stats,
                    isLoading: false,
                  };
                }
                return newData;
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching data for client ${client.id}:`, error);
          setClientsData(prevData => {
            return prevData.map(c =>
              c.id === client.id ? {...c, isLoading: false} : c
            );
          });
        }
      };

      // Stagger the initial data fetch for each client
      clients.forEach((client, index) => {
        fetchClientDataWithDelay(client, index * 500); // 500ms delay between each client
      });

      // Set up polling with staggered intervals
      const pollInterval = setInterval(() => {
        clients.forEach((client, index) => {
          setTimeout(() => {
            fetchClientDataWithDelay(client, 0); // No initial delay for polling
          }, index * 1000); // Stagger polling requests by 1 second each
        });
      }, 10000);

      return () => clearInterval(pollInterval);
    }
  }, [clients, isLoading, managementView]);

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