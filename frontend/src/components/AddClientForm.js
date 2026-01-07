import React from 'react';
import './Form.css';

const AddClientForm = ({ clientData, setClientData, error }) => {
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
        <label htmlFor="clientName">Client Name</label>
        <input
          type="text"
          id="clientName"
          name="name"
          value={clientData.name}
          onChange={handleChange}
          placeholder="Client Name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="clientUrl">Dashboard URL</label>
        <input
          type="url"
          id="clientUrl"
          name="url"
          value={clientData.url}
          onChange={handleChange}
          placeholder="http://ip:port[UI's Port]"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="clientDescription">Description</label>
        <textarea
          id="clientDescription"
          name="description"
          value={clientData.description}
          onChange={handleChange}
          placeholder="Description"
        ></textarea>
      </div>

      <div className="form-section">
        <h3>Graylog Configuration</h3>
        <div className="form-group">
          <label htmlFor="graylogHost">Graylog Host</label>
          <input
            type="text"
            id="graylogHost"
            name="host"
            value={clientData.graylog.host}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="http://ip:port[graylog's Port]"
          />
        </div>
        <div className="form-group">
          <label htmlFor="graylogUsername">Username</label>
          <input
            type="text"
            id="graylogUsername"
            name="username"
            value={clientData.graylog.username}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="Username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="graylogPassword">Password</label>
          <input
            type="password"
            id="graylogPassword"
            name="password"
            value={clientData.graylog.password}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="Password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="graylogStreamId">Stream ID</label>
          <input
            type="text"
            id="graylogStreamId"
            name="streamId"
            value={clientData.graylog.streamId}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="Stream ID"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>SIEM UI Configuration</h3>
        <div className="form-group">
          <label htmlFor="logApiHost">Frontend Host</label>
          <input
            type="text"
            id="logApiHost"
            name="host"
            value={clientData.logApi.host}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="http://ip:port[UI's Backend Port]"
          />
        </div>
        <div className="form-group">
          <label htmlFor="logApiUsername">Username</label>
          <input
            type="text"
            id="logApiUsername"
            name="username"
            value={clientData.logApi.username}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="Username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="logApiPassword">Password</label>
          <input
            type="password"
            id="logApiPassword"
            name="password"
            value={clientData.logApi.password}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="Password"
          />
        </div>
      </div>
    </>
  );
};

export default AddClientForm;
