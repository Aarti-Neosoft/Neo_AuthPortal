import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  className = '',
  loadingText,
  onClick,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`app-btn btn-${variant} ${fullWidth ? 'btn-block' : ''} ${isLoading ? 'btn-loading' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="btn-spinner-content">
          <Loader2 className="spinner-icon" size={18} />
          <span>{loadingText || 'Please wait...'}</span>
        </span>
      ) : (
        <span className="btn-inner-content">
          {Icon && <Icon size={18} className="btn-icon" />}
          <span>{children}</span>
        </span>
      )}
    </button>
  );
};

export default Button;
