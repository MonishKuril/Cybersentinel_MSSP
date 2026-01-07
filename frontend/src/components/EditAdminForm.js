import React from 'react';
import './Form.css';

const EditAdminForm = ({ adminData, setAdminData, error }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label htmlFor="editAdminName">Name</label>
        <input
          type="text"
          id="editAdminName"
          name="name"
          value={adminData.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="editAdminEmail">Email ID</label>
        <input
          type="email"
          id="editAdminEmail"
          name="email"
          value={adminData.email}
          onChange={handleChange}
          placeholder="Email ID"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="editAdminOrganization">Organization Name</label>
        <input
          type="text"
          id="editAdminOrganization"
          name="organization"
          value={adminData.organization}
          onChange={handleChange}
          placeholder="Organization Name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="editAdminCity">City</label>
        <input
          type="text"
          id="editAdminCity"
          name="city"
          value={adminData.city}
          onChange={handleChange}
          placeholder="City"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="editAdminState">State</label>
        <input
          type="text"
          id="editAdminState"
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

export default EditAdminForm;