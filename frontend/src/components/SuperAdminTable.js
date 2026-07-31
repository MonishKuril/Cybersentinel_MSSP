import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import ConfirmModal from './ConfirmModal';
import './SuperAdminTable.css';
import './AdminTable.css'; // Reusing some styles

const SuperAdminTable = () => {
  const [superAdmins, setSuperAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the Delete Superadmin / Reset MFA confirmation modal
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'reset-mfa', admin }
  const [confirmError, setConfirmError] = useState(null);
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

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

  const openConfirm = (type, admin) => {
    setConfirmAction({ type, admin });
    setConfirmError(null);
  };

  const closeConfirm = () => {
    setConfirmAction(null);
    setConfirmError(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsConfirmSubmitting(true);
    setConfirmError(null);
    try {
      if (confirmAction.type === 'delete') {
        await api.deleteSuperAdmin(confirmAction.admin.username);
      } else if (confirmAction.type === 'reset-mfa') {
        await api.resetSuperAdminMfa(confirmAction.admin.username);
      }
      closeConfirm();
      fetchSuperAdmins();
    } catch (err) {
      setConfirmError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsConfirmSubmitting(false);
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
                <button className="table-btn reset-mfa-btn" onClick={() => openConfirm('reset-mfa', admin)}>Reset MFA</button>
                <button className="table-btn delete-admin-btn" onClick={() => openConfirm('delete', admin)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.type === 'delete' ? 'Delete Superadmin' : 'Reset MFA'}
        message={
          confirmAction?.type === 'delete'
            ? `Delete superadmin "${confirmAction?.admin?.name}"? This permanently removes their account and any clients assigned only to them. This cannot be undone.`
            : `Reset MFA for "${confirmAction?.admin?.name}"? They will need to scan a new QR code and set up MFA again on their next login.`
        }
        confirmText={confirmAction?.type === 'delete' ? 'Delete Superadmin' : 'Reset MFA'}
        isDanger={confirmAction?.type === 'delete'}
        isSubmitting={isConfirmSubmitting}
        error={confirmError}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default SuperAdminTable;
