import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const InputField = ({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  autoComplete,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const inputId = id || `field-${name}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="text-danger" aria-hidden="true"> *</span>}
        </label>
      )}

      <div className={`input-wrapper ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        {Icon && (
          <span className="input-icon-left" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          className={`form-input ${Icon ? 'with-left-icon' : ''} ${isPassword ? 'with-right-icon' : ''}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="input-icon-right password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="form-error-msg" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="form-helper-text">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default InputField;
