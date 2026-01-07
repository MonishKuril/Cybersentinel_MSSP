import React from 'react';
import './Form.css';

const AddAdminForm = ({ adminData, setAdminData, error }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label htmlFor="adminUsername">Admin Username</label>
        <input
          type="text"
          id="adminUsername"
          name="username"
          value={adminData.username}
          onChange={handleChange}
          placeholder="Admin Username"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="adminPassword">Admin Password</label>
        <input
          type="password"
          id="adminPassword"
          name="password"
          value={adminData.password}
          onChange={handleChange}
          placeholder="Admin Password"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="adminName">Name</label>
        <input
          type="text"
          id="adminName"
          name="name"
          value={adminData.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="adminEmail">Email ID</label>
        <input
          type="email"
          id="adminEmail"
          name="email"
          value={adminData.email}
          onChange={handleChange}
          placeholder="Email ID"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="adminOrganization">Organization Name</label>
        <input
          type="text"
          id="adminOrganization"
          name="organization"
          value={adminData.organization}
          onChange={handleChange}
          placeholder="Organization Name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="adminCity">City</label>
        <input
          type="text"
          id="adminCity"
          name="city"
          value={adminData.city}
          onChange={handleChange}
          placeholder="City"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="adminState">State</label>
        <input
          type="text"
          id="adminState"
          name="state"
          value={adminData.state}
          onChange={handleChange}
          placeholder="State"
          required
        />
      </div>
    </>
  );
};

export default AddAdminForm;
