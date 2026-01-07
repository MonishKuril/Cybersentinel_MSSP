import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AddAdminForm from './AddAdminForm';
import AddClientForm from './AddClientForm';

function SuperAdminPanel() {
    const [admins, setAdmins] = useState([]);
    const [clients, setClients] = useState([]);
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [showAddClient, setShowAddClient] = useState(false);

    const fetchData = async () => {
        try {
            const [adminsResponse, clientsResponse] = await Promise.all([
                fetch('/api/admin/admins'),
                fetch('/api/clients')
            ]);
            const adminsData = await adminsResponse.json();
            const clientsData = await clientsResponse.json();
            setAdmins(adminsData);
            setClients(clientsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddAdmin = async (adminData) => {
        try {
            await fetch('/api/admin/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminData),
            });
            setShowAddAdmin(false);
            fetchData();
        } catch (error) {
            console.error('Error adding admin:', error);
        }
    };

    const handleAddClient = async (clientData) => {
        try {
            await fetch('/api/admin/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData),
            });
            setShowAddClient(false);
            fetchData();
        } catch (error) {
            console.error('Error adding client:', error);
        }
    };

    return (
        <div className="management-panel">
            <Modal show={showAddAdmin} onClose={() => setShowAddAdmin(false)}>
                <AddAdminForm onAdd={handleAddAdmin} />
            </Modal>
            <Modal show={showAddClient} onClose={() => setShowAddClient(false)}>
                <AddClientForm onAdd={handleAddClient} admins={admins} />
            </Modal>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>Admin Management</h2>
                <button onClick={() => setShowAddAdmin(true)}>+ Add Admin</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Organization</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map(admin => (
                        <tr key={admin.id}>
                            <td>{admin.name}</td>
                            <td>{admin.email}</td>
                            <td>{admin.organization}</td>
                            <td>
                                <button>Edit</button>
                                <button>{admin.blocked ? 'Unblock' : 'Block'}</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                <h2>Client Management</h2>
                <button onClick={() => setShowAddClient(true)}>+ Add Client</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>URL</th>
                        <th>Admin</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map(client => (
                        <tr key={client.id}>
                            <td>{client.name}</td>
                            <td>{client.url}</td>
                            <td>{client.adminId}</td>
                            <td>
                                <button>Edit</button>
                                <button>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SuperAdminPanel;
