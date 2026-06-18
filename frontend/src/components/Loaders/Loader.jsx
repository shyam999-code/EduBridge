import React from 'react';

const Loader = ({ fullPage = false, size = 'medium', text = 'Loading details...' }) => {
  const containerStyle = fullPage ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    gap: '1rem'
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '0.75rem',
    width: '100%'
  };

  const getSpinnerDimensions = () => {
    switch (size) {
      case 'small': return { width: '1.5rem', height: '1.5rem', borderWidth: '2px' };
      case 'large': return { width: '4rem', height: '4rem', borderWidth: '4px' };
      default: return { width: '2.5rem', height: '2.5rem', borderWidth: '3px' };
    }
  };

  const spinnerStyle = {
    ...getSpinnerDimensions(),
    borderRadius: '50%',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)',
    borderTopColor: 'var(--primary)',
    animation: 'spin 0.8s linear infinite',
  };

  return (
    <div style={containerStyle}>
      {/* Inline styling keyframes for spin since it's a global need */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinnerStyle}></div>
      {text && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{text}</p>}
    </div>
  );
};

export default Loader;
