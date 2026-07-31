import React from 'react';
import Modal from './Modal';
import './Form.css';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isSubmitting = false,
  error = null,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p>{message}</p>
      {error && <div className="error-message">{error}</div>}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn" disabled={isSubmitting}>
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={isDanger ? 'submit-btn danger' : 'submit-btn'}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Please wait...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
