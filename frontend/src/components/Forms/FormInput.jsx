import React, { useState } from 'react';

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  helperText = '',
  options = [], // Used for select type
  className = '',
  disabled = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isSelect = type === 'select';
  const isTextarea = type === 'textarea';
  const isSwitch = type === 'switch';

  if (isSwitch) {
    return (
      <div className={`form-group ${className}`}>
        <label className="switch-container">
          <input
            type="checkbox"
            name={name}
            checked={!!value}
            onChange={onChange}
            disabled={disabled}
            className="switch-input"
            {...props}
          />
          <div className="switch-track">
            <div className="switch-thumb"></div>
          </div>
          {label && <span className="form-label cursor-pointer" style={{ margin: 0 }}>{label}</span>}
        </label>
        {helperText && <span className="form-helper">{helperText}</span>}
      </div>
    );
  }

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {isSelect ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={`form-control ${error ? 'border-danger' : ''}`}
          disabled={disabled}
          required={required}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : isTextarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-control ${error ? 'border-danger' : ''}`}
          disabled={disabled}
          required={required}
          {...props}
        />
      ) : (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <input
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`form-control ${error ? 'border-danger' : ''}`}
            disabled={disabled}
            required={required}
            {...props}
            type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
            style={{
              paddingRight: type === 'password' ? '2.5rem' : undefined,
              ...props.style
            }}
          />
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                padding: '0.25rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                transition: 'color var(--transition-fast)'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}

      {error && <span className="form-error">{error}</span>}
      {!error && helperText && <span className="form-helper">{helperText}</span>}
    </div>
  );
};

export default FormInput;
