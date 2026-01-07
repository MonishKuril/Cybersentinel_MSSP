import React from 'react';
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
        <label htmlFor="superAdminUsername">Superadmin Username</label>
        <input
          type="text"
          id="superAdminUsername"
          name="username"
          value={adminData.username}
          onChange={handleChange}
          placeholder="Superadmin Username"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="superAdminPassword">Superadmin Password</label>
        <input
          type="password"
          id="superAdminPassword"
          name="password"
          value={adminData.password}
          onChange={handleChange}
          placeholder="Superadmin Password"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="superAdminName">Name</label>
        <input
          type="text"
          id="superAdminName"
          name="name"
          value={adminData.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="superAdminEmail">Email ID</label>
        <input
          type="email"
          id="superAdminEmail"
          name="email"
          value={adminData.email}
          onChange={handleChange}
          placeholder="Email ID"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="superAdminOrganization">Organization Name</label>
        <input
          type="text"
          id="superAdminOrganization"
          name="organization"
          value={adminData.organization}
          onChange={handleChange}
          placeholder="Organization Name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="superAdminCity">City</label>
        <input
          type="text"
          id="superAdminCity"
          name="city"
          value={adminData.city}
          onChange={handleChange}
          placeholder="City"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="superAdminState">State</label>
        <input
          type="text"
          id="superAdminState"
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

export default AddSuperAdminForm;
