import React, { useId } from 'react';
import './FormWrapper.css';

const FormWrapper = ({ title, onCancel, children, onSubmit, submitText, isSubmitting }) => {
  // The submit button lives in the header, visually separate from the
  // <form> in form-wrapper-body. Associating it via the `form` attribute
  // (instead of a onClick-only button) lets it act as the form's real
  // submit button, so pressing Enter in any field submits too - not just
  // clicking the button.
  const formId = useId();

  return (
    <div className="form-wrapper">
      <div className="form-wrapper-header">
        <h2>{title}</h2>
        <div className="header-actions">
          <button
            type="submit"
            form={formId}
            className="form-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : (submitText || 'Submit')}
          </button>
          <button type="button" onClick={onCancel} className="form-cancel-btn">Cancel</button>
        </div>
      </div>
      <div className="form-wrapper-body">
        <form id={formId} onSubmit={onSubmit} className="form-container">
          {children}
        </form>
      </div>
    </div>
  );
};

export default FormWrapper;
