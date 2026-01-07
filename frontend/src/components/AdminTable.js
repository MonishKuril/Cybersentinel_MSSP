import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AddAdminForm from './AddAdminForm';
import EditAdminForm from './EditAdminForm';
import * as api from '../services/api';
import './AdminTable.css';

const AdminTable = () => {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isAddSuperAdminModalOpen, setIsAddSuperAdminModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdmins();
      setAdmins(data);
    } catch (error) {
      setError('Failed to fetch admins');
      console.error('Failed to fetch admins', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async (adminData) => {
    try {
      await api.addAdmin(adminData);
      fetchAdmins();
      setIsAddAdminModalOpen(false);
    } catch (error) {
      setError('Failed to add admin');
      console.error('Failed to add admin', error);
    }
  };
  
  const handleAddSuperAdmin = async (adminData) => {
    try {
      await api.addSuperAdmin(adminData);
      fetchAdmins();
      setIsAddSuperAdminModalOpen(false);
    } catch (error) {
      setError('Failed to add superadmin');
      console.error('Failed to add superadmin', error);
    }
  };

  const handleUpdateAdmin = async (adminId, adminData) => {
    try {
      await api.updateAdmin(adminId, adminData);
      fetchAdmins();
      setIsEditModalOpen(false);
    } catch (error) {
      setError('Failed to update admin');
      console.error('Failed to update admin', error);
    }
  };

  const handleToggleBlockAdmin = async (adminId, isBlocked) => {
    if (window.confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this admin?`)) {
      try {
        await api.toggleAdminBlock(adminId, isBlocked);
        fetchAdmins();
      } catch (error) {
        setError('Failed to toggle admin block status');
        console.error('Failed to toggle admin block status', error);
      }
    }
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return <div className="loading">Loading admins...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Admins</h2>
        <div>
          <button className="add-btn" onClick={() => setIsAddAdminModalOpen(true)}>+ Add New Admin</button>
          <button className="add-btn" style={{marginLeft: '1rem'}} onClick={() => setIsAddSuperAdminModalOpen(true)}>+ Add New Superadmin</button>
        </div>
      </div>
      <table className="admins-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Organization</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map(admin => (
            <tr key={admin.id}>
              <td>{admin.id}</td>
              <td>{admin.name}</td>
              <td>{admin.email}</td>
              <td>{admin.organization}</td>
              <td>{admin.role}</td>
              <td>
                <span className={`status ${admin.blocked ? 'blocked' : 'active'}`}>
                  {admin.blocked ? 'Blocked' : 'Active'}
                </span>
              </td>
              <td className="table-actions">
                <button className="action-btn" onClick={() => openEditModal(admin)}>Edit</button>
                <button className="action-btn" onClick={() => handleToggleBlockAdmin(admin.id, admin.blocked)}>{admin.blocked ? 'Unblock' : 'Block'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal isOpen={isAddAdminModalOpen} onClose={() => setIsAddAdminModalOpen(false)} title="Add New Admin">
        <AddAdminForm onAddAdmin={handleAddAdmin} onClose={() => setIsAddAdminModalOpen(false)} />
      </Modal>
      <Modal isOpen={isAddSuperAdminModalOpen} onClose={() => setIsAddSuperAdminModalOpen(false)} title="Add New Superadmin">
        <AddAdminForm onAddAdmin={handleAddSuperAdmin} onClose={() => setIsAddSuperAdminModalOpen(false)} />
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Admin">
        <EditAdminForm admin={selectedAdmin} onUpdateAdmin={handleUpdateAdmin} onClose={() => setIsEditModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default AdminTable;