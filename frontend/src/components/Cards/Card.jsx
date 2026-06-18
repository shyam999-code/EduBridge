import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  interactive = false,
  glass = false,
  variant = '', // 'success', 'warning', 'danger', 'secondary', 'stats'
  label = '', // For stats card
  number = '', // For stats card
  icon = null, // For stats card
  trend = null, // For stats card: { direction: 'up'|'down', value: '4%' }
  onClick,
  ...props
}) => {
  if (variant === 'stats') {
    const cardColorClass = trend && trend.color ? trend.color : ''; // success, warning, danger, secondary
    return (
      <div
        className={`stats-card ${cardColorClass} ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        {...props}
      >
        <div className="stats-info">
          <span className="stats-label">{label}</span>
          <span className="stats-number">{number}</span>
          {trend && (
            <span className={`stats-trend ${trend.direction}`}>
              {trend.direction === 'up' ? '▲' : '▼'} {trend.value} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{trend.label || 'vs last month'}</span>
            </span>
          )}
        </div>
        {icon && <div className="stats-icon-wrapper">{icon}</div>}
      </div>
    );
  }

  const getCardClasses = () => {
    let classes = 'card ';
    if (interactive) classes += 'card-interactive ';
    if (glass) classes += 'glass ';
    if (variant) classes += `card-${variant} `;
    return classes + className;
  };

  return (
    <div className={getCardClasses().trim()} onClick={onClick} {...props}>
      {(title || headerAction) && (
        <div className="card-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <span className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>{subtitle}</span>}
          </div>
          {headerAction && <div className="card-header-actions">{headerAction}</div>}
        </div>
      )}

      <div className="card-body">{children}</div>

      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
