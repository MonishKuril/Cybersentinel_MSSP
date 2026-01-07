import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AddClientForm from './AddClientForm';
import EditClientForm from './EditClientForm';
import * as api from '../services/api';
import './ClientTable.css';

const ClientTable = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      setError('Failed to fetch clients');
      console.error('Failed to fetch clients', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (clientData) => {
    try {
      await api.addClient(clientData);
      fetchClients();
      setIsAddModalOpen(false);
    } catch (error) {
      setError('Failed to add client');
      console.error('Failed to add client', error);
    }
  };

  const handleUpdateClient = async (clientId, clientData) => {
    try {
      await api.updateClient(clientId, clientData);
      fetchClients();
      setIsEditModalOpen(false);
    } catch (error) {
      setError('Failed to update client');
      console.error('Failed to update client', error);
    }
  };
  
  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await api.deleteClient(clientId);
        fetchClients();
      } catch (error) {
        setError('Failed to delete client');
        console.error('Failed to delete client', error);
      }
    }
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return <div className="loading">Loading clients...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Clients</h2>
        <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>+ Add New Client</button>
      </div>
      <table className="clients-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>URL</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td><a href={client.url} target="_blank" rel="noopener noreferrer">{client.url}</a></td>
              <td>{client.description || '-'}</td>
              <td className="table-actions">
                <button className="action-btn" onClick={() => openEditModal(client)}>Edit</button>
                <button className="action-btn danger" onClick={() => handleDeleteClient(client.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Client">
        <AddClientForm onAddClient={handleAddClient} onClose={() => setIsAddModalOpen(false)} />
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Client">
        <EditClientForm client={selectedClient} onUpdateClient={handleUpdateClient} onClose={() => setIsEditModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default ClientTable;