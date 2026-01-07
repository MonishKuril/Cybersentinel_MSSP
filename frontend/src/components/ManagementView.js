import React, { useState, useEffect, useCallback } from 'react';
import './ManagementView.css';
import * as api from '../services/api';
import AddClientForm from './AddClientForm';
import EditClientForm from './EditClientForm';
import AddAdminForm from './AddAdminForm';
import AddSuperAdminForm from './AddSuperAdminForm';
import EditAdminForm from './EditAdminForm';

import FormWrapper from './FormWrapper';

const ManagementView = ({ user }) => {
  const [clients, setClients] = useState([]); 
  const [admins, setAdmins] = useState([]);
  const [activeForm, setActiveForm] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [addingClientForAdmin, setAddingClientForAdmin] = useState(null);
  const [error, setError] = useState(null);

  // State for the new AddAdmin form
  const [newAdminData, setNewAdminData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    organization: '',
    city: '',
    state: '',
  });

  // State for the new AddSuperAdmin form
  const [newSuperAdminData, setNewSuperAdminData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    organization: '',
    city: '',
    state: '',
  });

  // State for the new AddClient form
  const [newClientData, setNewClientData] = useState({
    name: '',
    url: '',
    description: '',
    graylog: { host: '', username: '', password: '', streamId: '' },
    logApi: { host: '', username: '', password: '' },
    adminId: null,
  });

  // State for the EditAdmin form
  const [editingAdminData, setEditingAdminData] = useState(null);

  // State for the EditClient form
  const [editingClientData, setEditingClientData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      if (user.role === 'admin') {
        const clientsData = await api.getClients();
        setClients(clientsData);
      }
      if (user.role === 'superadmin' || user.role === 'main-superadmin') {
        const adminsData = await api.getAdmins();
        setAdmins(adminsData);
      }
    } catch (error) {
      console.error('Error fetching data for management view:', error);
    }
  }, [user.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize editingAdminData when editingAdmin is set
  useEffect(() => {
    if (editingAdmin) {
      setEditingAdminData({
        name: editingAdmin.name || '',
        email: editingAdmin.email || '',
        organization: editingAdmin.organization || '',
        city: editingAdmin.city || '',
        state: editingAdmin.state || '',
      });
    } else {
      setEditingAdminData(null);
    }
  }, [editingAdmin]);

  // Initialize editingClientData when editingClient is set
  useEffect(() => {
    if (editingClient) {
      setEditingClientData({
        name: editingClient.name || '',
        url: editingClient.url || '',
        description: editingClient.description || '',
        graylog: {
          host: editingClient.graylog_host || '',
          username: editingClient.graylog_username || '',
          password: '',
          streamId: editingClient.graylog_stream_id || '',
        },
        logApi: {
          host: editingClient.log_api_host || '',
          username: editingClient.log_api_username || '',
          password: '',
        },
      });
    } else {
      setEditingClientData(null);
    }
  }, [editingClient]);
  
  const handleFormSuccess = () => {
      fetchData();
      setActiveForm(null);
      setError(null);
      setEditingAdmin(null);
      setEditingClient(null);
  }

  const handleCancel = () => {
      setActiveForm(null);
      setError(null);
      setEditingAdmin(null);
      setEditingClient(null);
  }

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.addAdmin(newAdminData);
      setNewAdminData({ username: '', password: '', name: '', email: '', organization: '', city: '', state: '' }); // Reset form
      handleFormSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditAdminSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.updateAdmin(editingAdmin.id, editingAdminData);
      handleFormSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddSuperAdminSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.addSuperAdmin(newSuperAdminData);
      setNewSuperAdminData({ username: '', password: '', name: '', email: '', organization: '', city: '', state: '' }); // Reset form
      handleFormSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddClientSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Ensure adminId is set if a specific admin is adding the client
      const dataToSubmit = { ...newClientData };
      if (addingClientForAdmin) {
        dataToSubmit.adminId = addingClientForAdmin.id;
      }

      await api.addClient(dataToSubmit);
      setNewClientData({ name: '', url: '', description: '', graylog: { host: '', username: '', password: '', streamId: '' }, logApi: { host: '', username: '', password: '' }, adminId: null }); // Reset form
      handleFormSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClientSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Prepare data, removing empty passwords
      const dataToSubmit = { ...editingClientData };
      if (!dataToSubmit.graylog.password) delete dataToSubmit.graylog.password;
      if (!dataToSubmit.logApi.password) delete dataToSubmit.logApi.password;

      await api.updateClient(editingClient.id, dataToSubmit);
      handleFormSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  if (user.role === 'superadmin' || user.role === 'main-superadmin') {
    let content;
    switch (activeForm) {
      case 'addAdmin':
        content = (
          <FormWrapper 
            title="Add New Admin" 
            onCancel={handleCancel}
            onSubmit={handleAddAdminSubmit}
            submitText="Add Admin"
          >
            <AddAdminForm 
              adminData={newAdminData}
              setAdminData={setNewAdminData}
              error={error}
            />
          </FormWrapper>
        );
        break;
      case 'addSuperAdmin':
        content = (
          <FormWrapper
            title="Add New Superadmin"
            onCancel={handleCancel}
            onSubmit={handleAddSuperAdminSubmit}
            submitText="Add Superadmin"
          >
            <AddSuperAdminForm
              adminData={newSuperAdminData}
              setAdminData={setNewSuperAdminData}
              error={error}
            />
          </FormWrapper>
        );
        break;
      case 'editAdmin':
        content = editingAdminData && (
          <FormWrapper
            title="Edit Admin"
            onCancel={handleCancel}
            onSubmit={handleEditAdminSubmit}
            submitText="Update Admin"
          >
            <EditAdminForm
              adminData={editingAdminData}
              setAdminData={setEditingAdminData}
              error={error}
            />
          </FormWrapper>
        );
        break;
      case 'addClient':
        content = (
          <FormWrapper
            title="Add New Client"
            onCancel={handleCancel}
            onSubmit={handleAddClientSubmit}
            submitText="Add Client"
          >
            <AddClientForm
              clientData={newClientData}
              setClientData={setNewClientData}
              error={error}
            />
          </FormWrapper>
        );
        break;
      default:
        content = (
          <>
            <div className="panel-header">
              <h2>Admin Management</h2>
              <div>
                {user.role === 'main-superadmin' && (
                  <button onClick={() => {
                    setNewSuperAdminData({ username: '', password: '', name: '', email: '', organization: '', city: '', state: '' });
                    setActiveForm('addSuperAdmin');
                  }} className="action-btn" style={{ display: 'inline-block' }}>
                    + Add New Superadmin
                  </button>
                )}
                <button onClick={() => {
                  setNewAdminData({ username: '', password: '', name: '', email: '', organization: '', city: '', state: '' });
                  setActiveForm('addAdmin');
                }} className="action-btn">+ Add New Admin</button>
              </div>
            </div>
            <div className="admins-table-container">
              <table className="admins-table">
              <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email ID</th>
                <th>Organization Name</th>
                <th>City</th>
                <th>State</th>
                <th>Deployed Clients</th>
                <th>Active Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="adminsTableBody">
              {admins.map(admin => {
                const adminClients = admin.clients || [];
                return (
                  <tr key={admin.id}>
                    <td>{admin.id}</td>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>{admin.organization}</td>
                    <td>{admin.city}</td>
                    <td>{admin.state}</td>
                    <td>
                      <select className="admin-clients-dropdown" onChange={(e) => {
                        const url = e.target.value;
                        if (url) {
                          window.open(url, '_blank');
                          e.target.value = '';
                        }
                      }}>
                        {adminClients.length === 0 ? (
                          <option value="" disabled>No clients assigned</option>
                        ) : (
                          <>
                            <option value="">Select Client</option>
                            {adminClients.map(client => (
                              <option key={client.id} value={client.url}>
                                {client.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </td>
                    <td className={`admin-status ${admin.blocked ? 'blocked' : 'active'}`}>
                      {admin.blocked ? 'Blocked' : 'Active'}
                    </td>
                    <td className="table-actions">
                      <button className="table-btn add-client-btn" onClick={() => {
                        setNewClientData({ name: '', url: '', description: '', graylog: { host: '', username: '', password: '', streamId: '' }, logApi: { host: '', username: '', password: '' }, adminId: admin.id });
                        setAddingClientForAdmin(admin); 
                        setActiveForm('addClient')
                      }}>New Client</button>
                      <button className="table-btn edit-admin-btn" onClick={() => {setEditingAdmin(admin); setActiveForm('editAdmin');}}>Edit Admin</button>
                      <button className="table-btn block-admin-btn" onClick={() => api.toggleAdminBlock(admin.id, admin.blocked).then(fetchData)}>
                        {admin.blocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
              </table>
            </div>
          </>
        );
    }

    return (
      <div id="superAdminView" className="management-panel">
        {content}
      </div>
    );
  }

  // Admin View
  let adminContent;
  switch (activeForm) {
    case 'addClient':
      adminContent = (
        <FormWrapper
          title="Add New Client"
          onCancel={handleCancel}
          onSubmit={handleAddClientSubmit}
          submitText="Add Client"
        >
          <AddClientForm
            clientData={newClientData}
            setClientData={setNewClientData}
            error={error}
          />
        </FormWrapper>
      );
      break;
    case 'editClient':
      adminContent = editingClientData && (
        <FormWrapper
          title="Edit Client"
          onCancel={handleCancel}
          onSubmit={handleEditClientSubmit}
          submitText="Update Client"
        >
          <EditClientForm
            clientData={editingClientData}
            setClientData={setEditingClientData}
            error={error}
          />
        </FormWrapper>
      );
      break;
    default:
        adminContent = (
            <>
                <div className="panel-header">
                    <h2 id="managementTitle">Client Management</h2>
                    <button id="addClientBtn" className="action-btn" onClick={() => {
                      setNewClientData({ name: '', url: '', description: '', graylog: { host: '', username: '', password: '', streamId: '' }, logApi: { host: '', username: '', password: '' }, adminId: null });
                      setActiveForm('addClient');
                    }}>+ Add New Client</button>
                </div>
                <div className="clients-table-container">
                    <table className="clients-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>URL</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody id="clientsTableBody">
                        {clients.map(client => (
                            <tr key={client.id}>
                            <td>{client.name}</td>
                            <td>{client.url}</td>
                            <td>{client.description}</td>
                            <td className="table-actions">
                                <button className="table-btn view-client-btn" onClick={() => window.open(client.url, '_blank')}>View</button>
                                <button className="table-btn edit-client-btn" onClick={() => {setEditingClient(client); setActiveForm('editClient');}}>Edit</button>
                                <button className="table-btn delete-client-btn" onClick={() => api.deleteClient(client.id).then(fetchData)}>Delete</button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </>
        )
  }

  return (
    <div id="managementView" className="management-panel">
      {adminContent}
    </div>
  );
};

export default ManagementView;