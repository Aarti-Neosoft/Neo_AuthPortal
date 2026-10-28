import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export const AlertBanner = ({
  type = 'error',
  message,
  onClose,
  className = ''
}) => {
  if (!message) return null;

  const icons = {
    error: <AlertCircle className="alert-icon" size={18} />,
    success: <CheckCircle2 className="alert-icon" size={18} />,
    info: <Info className="alert-icon" size={18} />
  };

  return (
    <div className={`app-alert alert-${type} ${className}`} role="alert">
      <div className="alert-content">
        {icons[type] || icons.info}
        <span className="alert-text">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="alert-close-btn"
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
