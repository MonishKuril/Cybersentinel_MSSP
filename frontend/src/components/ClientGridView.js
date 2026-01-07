import React, { useState, useEffect } from 'react';
import ClientCard from './ClientCard';
import * as api from '../services/api';
import './ClientGridView.css';

const ClientGridView = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Effect for fetching the initial, basic client list
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const basicClients = await api.getClients();
        // Initialize clients with empty placeholders for detailed data
        setClients(basicClients.map(c => ({ ...c, logCount: '...', logStats: null, history: [] })));
      } catch (error) {
        setError('Failed to fetch clients');
        console.error('Failed to fetch clients', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Effect for fetching detailed data for each client after the initial list is loaded
  useEffect(() => {
    if (clients.length === 0) return;

    clients.forEach(client => {
      // Only fetch if we haven't fetched the stats yet
      if (client.logStats === null) {
        Promise.all([
          api.getClientLogs(client.id),
          api.getClientLogStats(client.id)
        ])
        .then(([logsResponse, statsResponse]) => {
          setClients(currentClients =>
            currentClients.map(c =>
              c.id === client.id
                ? { ...c, logCount: logsResponse.logCount, logStats: statsResponse.stats }
                : c
            )
          );
        })
        .catch(error => {
          console.error(`Failed to fetch details for client ${client.id}:`, error);
          // Optionally update the client state to show an error
          setClients(currentClients =>
            currentClients.map(c =>
              c.id === client.id
                ? { ...c, logCount: 'Error', logStats: { total: 'Error', major: 'Error', normal: 'Error' } }
                : c
            )
          );
        });
      }
    });
  }, [clients.length]); // Rerun when the number of clients changes

  if (isLoading) {
    return <div className="loading">Loading clients...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (clients.length === 0) {
    return <div className="no-clients">No clients found.</div>;
  }

  return (
    <div className="client-grid-view">
      {clients.map(client => (
        <ClientCard
          key={client.id}
          client={client}
          logCount={client.logCount}
          logStats={client.logStats}
          history={client.history}
        />
      ))}
    </div>
  );
};

export default ClientGridView;