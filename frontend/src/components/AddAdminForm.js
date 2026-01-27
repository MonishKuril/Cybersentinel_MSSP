import React from 'react';
import { TextField } from '@mui/material';
import PasswordInput from './PasswordInput';
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
        <TextField
          id="adminUsername"
          name="username"
          label="Admin Username"
          value={adminData.username}
          onChange={handleChange}
          placeholder="Admin Username"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <PasswordInput
          id="adminPassword"
          name="password"
          label="Admin Password"
          value={adminData.password}
          onChange={handleChange}
          placeholder="Admin Password"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <TextField
          id="adminName"
          name="name"
          label="Name"
          value={adminData.name}
          onChange={handleChange}
          placeholder="Name"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <TextField
          id="adminEmail"
          name="email"
          label="Email ID"
          type="email"
          value={adminData.email}
          onChange={handleChange}
          placeholder="Email ID"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <TextField
          id="adminOrganization"
          name="organization"
          label="Organization Name"
          value={adminData.organization}
          onChange={handleChange}
          placeholder="Organization Name"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <TextField
          id="adminCity"
          name="city"
          label="City"
          value={adminData.city}
          onChange={handleChange}
          placeholder="City"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <TextField
          id="adminState"
          name="state"
          label="State"
          value={adminData.state}
          onChange={handleChange}
          placeholder="State"
          required
          fullWidth
        />
      </div>
    </>
  );
};

export default AddAdminForm;
