import React, { useState } from 'react';
import Modal from './Modal';
import AddSuperAdminForm from './AddSuperAdminForm';
import SuperAdminTable from './SuperAdminTable';
import * as api from '../services/api';
import './AdminTable.css'; // Reusing styles

const SuperAdminPanel = () => {
  const [isAddSuperAdminModalOpen, setIsAddSuperAdminModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSuperAdminData, setNewSuperAdminData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    organization: '',
    city: '',
    state: '',
  });
  
  // This state and function are needed to refresh the table after adding a new superadmin
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddSuperAdmin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.addSuperAdmin(newSuperAdminData);
      setIsAddSuperAdminModalOpen(false);
      setRefreshKey(oldKey => oldKey + 1); // Trigger a refresh of the table
      // Reset form
      setNewSuperAdminData({
        username: '',
        password: '',
        name: '',
        email: '',
        organization: '',
        city: '',
        state: '',
      });
    } catch (error) {
      setError('Failed to add superadmin');
      console.error('Failed to add superadmin', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="table-container">
      <div className="panel-header">
        <h2>Superadmins</h2>
        <div>
          <button className="action-btn" onClick={() => setIsAddSuperAdminModalOpen(true)}>+ Add New Superadmin</button>
        </div>
      </div>
      <SuperAdminTable key={refreshKey} />
      <Modal isOpen={isAddSuperAdminModalOpen} onClose={() => setIsAddSuperAdminModalOpen(false)} title="Add New Superadmin">
        <form onSubmit={handleAddSuperAdmin}>
          <AddSuperAdminForm adminData={newSuperAdminData} setAdminData={setNewSuperAdminData} error={error} />
          <div className="form-actions">
            <button type="button" onClick={() => setIsAddSuperAdminModalOpen(false)} className="cancel-btn">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Adding...' : 'Add Superadmin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuperAdminPanel;