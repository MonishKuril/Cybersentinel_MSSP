import React from 'react';
import './ClientSearchPopup.css';
import ClientCard from './ClientCard';

const ClientSearchPopup = ({ show, onClose, searchResult, clientsData }) => {
  if (!show) {
    return null;
  }

  // Find the real-time data for the searched client
  const clientWithData = searchResult 
    ? clientsData.find(client => client.id === searchResult.id) 
    : null;

  return (
    <div className="search-popup">
      <div className="popup-content">
        <button onClick={onClose} className="close-popup">
          &times;
        </button>
        <div id="searchResults">
          {clientWithData ? (
            <ClientCard 
                client={clientWithData}
                logStats={clientWithData.logStats}
                history={clientWithData.history}
            />
          ) : (
            <div className="not-found-message">
                {searchResult ? "Loading data..." : "Client not found"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientSearchPopup;
