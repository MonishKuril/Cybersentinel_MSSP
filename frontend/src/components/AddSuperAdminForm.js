import React from 'react';
import { TextField } from '@mui/material';
import PasswordInput from './PasswordInput';
import './Form.css';

const AddSuperAdminForm = ({ adminData, setAdminData, error }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <TextField
          id="superAdminUsername"
          name="username"
          label="Superadmin Username"
          value={adminData.username}
          onChange={handleChange}
          placeholder="Superadmin Username"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <PasswordInput
          id="superAdminPassword"
          name="password"
          label="Superadmin Password"
          value={adminData.password}
          onChange={handleChange}
          placeholder="Superadmin Password"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <TextField
          id="superAdminName"
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
          id="superAdminEmail"
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
          id="superAdminOrganization"
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
          id="superAdminCity"
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
          id="superAdminState"
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

export default AddSuperAdminForm;
