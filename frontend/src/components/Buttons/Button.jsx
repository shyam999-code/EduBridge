import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  icon = null,
  iconRight = false,
  ...props
}) => {
  const getButtonClass = () => {
    let classes = `btn btn-${variant} `;
    if (size === 'sm') classes += 'btn-sm ';
    if (size === 'lg') classes += 'btn-lg ';
    return classes + className;
  };

  return (
    <button
      type={type}
      className={getButtonClass().trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {!iconRight && icon && <span className="btn-icon">{icon}</span>}
      {children}
      {iconRight && icon && <span className="btn-icon">{icon}</span>}
    </button>
  );
};

export default Button;
