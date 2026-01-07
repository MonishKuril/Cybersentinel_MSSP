import React from 'react';
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
        <label htmlFor="editClientName">Client Name</label>
        <input
          type="text"
          id="editClientName"
          name="name"
          value={clientData.name}
          onChange={handleChange}
          placeholder="Client Name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="editClientUrl">Dashboard URL</label>
        <input
          type="url"
          id="editClientUrl"
          name="url"
          value={clientData.url}
          onChange={handleChange}
          placeholder="http://ip:port"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="editClientDescription">Description</label>
        <textarea
          id="editClientDescription"
          name="description"
          value={clientData.description}
          onChange={handleChange}
          placeholder="Description"
        ></textarea>
      </div>

      <div className="form-section">
        <h3>Graylog Configuration</h3>
        <div className="form-group">
          <label htmlFor="editGraylogHost">Graylog Host</label>
          <input
            type="text"
            id="editGraylogHost"
            name="host"
            value={clientData.graylog.host}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="http://ip:port"
          />
        </div>
        <div className="form-group">
          <label htmlFor="editGraylogUsername">Username</label>
          <input
            type="text"
            id="editGraylogUsername"
            name="username"
            value={clientData.graylog.username}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="Username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="editGraylogPassword">New Password (leave blank to keep unchanged)</label>
          <input
            type="password"
            id="editGraylogPassword"
            name="password"
            value={clientData.graylog.password}
            onChange={(e) => handleNestedChange(e, 'graylog')}
            placeholder="New Password (leave blank to keep unchanged)"
          />
        </div>
        <div className="form-group">
          <label htmlFor="editGraylogStreamId">Stream ID</label>
          <input
            type="text"
            id="editGraylogStreamId"
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
          <label htmlFor="editLogApiHost">Frontend Host</label>
          <input
            type="text"
            id="editLogApiHost"
            name="host"
            value={clientData.logApi.host}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="http://ip:port"
          />
        </div>
        <div className="form-group">
          <label htmlFor="editLogApiUsername">Username</label>
          <input
            type="text"
            id="editLogApiUsername"
            name="username"
            value={clientData.logApi.username}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="Username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="editLogApiPassword">New Password (leave blank to keep unchanged)</label>
          <input
            type="password"
            id="editLogApiPassword"
            name="password"
            value={clientData.logApi.password}
            onChange={(e) => handleNestedChange(e, 'logApi')}
            placeholder="New Password (leave blank to keep unchanged)"
          />
        </div>
      </div>
    </>
  );
};

export default EditClientForm;