import React from 'react';
import './OutlineButton.css';

const OutlineButton = ({ onClick, text, svgIcon, className = '' }) => {
  return (
    <button className={`outline-btn ${className}`} onClick={onClick}>
      {svgIcon && <span className="btn-icon">{svgIcon}</span>}
      <span className="btn-text">{text}</span>
    </button>
  );
};

export default OutlineButton;
