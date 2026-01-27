import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import './SuperAdminTable.css';
import './AdminTable.css'; // Reusing some styles

const SuperAdminTable = () => {
  const [superAdmins, setSuperAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuperAdmins();
  }, []);

  const fetchSuperAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSuperAdmins();
      setSuperAdmins(data);
    } catch (error) {
      setError('Failed to fetch superadmins');
      console.error('Failed to fetch superadmins', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlockSuperAdmin = async (username, isBlocked) => {
    if (window.confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this superadmin?`)) {
      try {
        await api.toggleSuperAdminBlock(username, isBlocked);
        fetchSuperAdmins();
      } catch (error) {
        setError('Failed to toggle superadmin block status');
        console.error('Failed to toggle superadmin block status', error);
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Loading superadmins...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="table-container">
      <table className="superadmins-table">
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
          {superAdmins.map(admin => (
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
                <button className="table-btn" onClick={() => handleToggleBlockSuperAdmin(admin.username, admin.blocked)}>{admin.blocked ? 'Unblock' : 'Block'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SuperAdminTable;
