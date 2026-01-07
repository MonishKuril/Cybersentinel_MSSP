import React from 'react';
import './FormWrapper.css';

const FormWrapper = ({ title, onCancel, children, onSubmit, submitText }) => {
  return (
    <div className="form-wrapper">
      <div className="form-wrapper-header">
        <h2>{title}</h2>
        <div className="header-actions">
          <button type="button" onClick={onSubmit} className="form-submit-btn">{submitText || 'Submit'}</button>
          <button type="button" onClick={onCancel} className="form-cancel-btn">Cancel</button>
        </div>
      </div>
      <div className="form-wrapper-body">
        <form onSubmit={onSubmit} className="form-container">
          {children}
        </form>
      </div>
    </div>
  );
};

export default FormWrapper;
