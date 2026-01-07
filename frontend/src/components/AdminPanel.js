import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AddClientForm from './AddClientForm';

function AdminPanel() {
    const [clients, setClients] = useState([]);
    const [showAddClient, setShowAddClient] = useState(false);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            const data = await response.json();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleAddClient = async (clientData) => {
        try {
            await fetch('/api/admin/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData),
            });
            setShowAddClient(false);
            fetchClients();
        } catch (error) {
            console.error('Error adding client:', error);
        }
    };

    return (
        <div className="management-panel">
            <Modal show={showAddClient} onClose={() => setShowAddClient(false)}>
                <AddClientForm onAdd={handleAddClient} />
            </Modal>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>Client Management</h2>
                <button onClick={() => setShowAddClient(true)}>+ Add Client</button>
            </div>
            <table>
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
                            <td>{client.url}</td>
                            <td>{client.description}</td>
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

export default AdminPanel;
