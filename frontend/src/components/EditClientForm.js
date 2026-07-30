import React from 'react';
import { TextField } from '@mui/material';
import PasswordInput from './PasswordInput';
import './Form.css';

const EditClientForm = ({ clientData, setClientData, error }) => {
  if (!clientData) return null; // Render nothing if no data

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (e, category) => {
    const { name, value } = e.target;
    setClientData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [name]: value
      }
    }));
  };

  return (
    <>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <TextField
          id="editClientName"
          name="name"
          label="Client Name"
          value={clientData.name}
          onChange={handleChange}
          placeholder="Client Name"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <TextField
          id="editClientUrl"
          name="url"
          label="Dashboard URL"
          type="url"
          value={clientData.url}
          onChange={handleChange}
          placeholder="http://ip:port"
          required
          fullWidth
        />
      </div>
      <div className="form-group">
        <TextField
          id="editClientDescription"
          name="description"
          label="Description"
          value={clientData.description}
          onChange={handleChange}
          placeholder="Description"
          multiline
          rows={4}
          fullWidth
        />
      </div>

      <div className="form-section">
        <h3>Graylog Configuration</h3>
        <div className="form-group">
          <TextField
            id="editGraylogHost"
            name="host"
            label="Graylog Host"
            value={clientData.graylog.host}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="http://ip:port"
            fullWidth
          />
        </div>
        <div className="form-group">
          <TextField
            id="editGraylogUsername"
            name="username"
            label="Username"
            value={clientData.graylog.username}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="Username"
            fullWidth
          />
        </div>
        <div className="form-group">
          <PasswordInput
            id="editGraylogPassword"
            name="password"
            label="New Password (leave blank to keep unchanged)"
            value={clientData.graylog.password}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="New Password (leave blank to keep unchanged)"
            fullWidth
          />
        </div>
        <div className="form-group">
          <TextField
            id="editGraylogStreamId"
            name="streamId"
            label="Stream ID"
            value={clientData.graylog.streamId}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="Stream ID"
            fullWidth
          />
        </div>
      </div>

      <div className="form-section">
        <h3>SIEM UI Configuration</h3>
        <div className="form-group">
          <TextField
            id="editLogApiHost"
            name="host"
            label="Frontend Host"
            value={clientData.logApi.host}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="http://ip:port"
            fullWidth
          />
        </div>
        <div className="form-group">
          <TextField
            id="editLogApiUsername"
            name="username"
            label="Log API Username (Service Account)"
            value={clientData.logApi.username}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="Log API Username (e.g. mssp_service)"
            fullWidth
          />
        </div>
        <div className="form-group">
          <PasswordInput
            id="editLogApiPassword"
            name="password"
            label="New Password (leave blank to keep unchanged)"
            value={clientData.logApi.password}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="New Password (leave blank to keep unchanged)"
            fullWidth
          />
        </div>
        <div className="form-group">
          <TextField
            id="editLogApiSsoUsername"
            name="ssoUsername"
            label="SSO Username (Launch User)"
            value={clientData.logApi.ssoUsername || ''}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="SSO Username (e.g. csadmin)"
            fullWidth
          />
        </div>
        <div className="form-group">
          <TextField
            id="editLogApiSsoClientId"
            name="ssoClientId"
            label="SIEM SSO Client ID (aud)"
            value={clientData.logApi.ssoClientId || ''}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="Client ID (e.g. client-acme-01)"
            fullWidth
          />
        </div>
      </div>
    </>
  );
};

export default EditClientForm;