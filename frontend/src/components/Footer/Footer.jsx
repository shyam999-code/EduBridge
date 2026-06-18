import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      padding: '1.5rem 2rem',
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      fontSize: '0.825rem',
      color: 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      marginTop: 'auto',
      zIndex: 10
    }}>
      <div>
        <strong>EduBridge ERP</strong> &copy; {new Date().getFullYear()} School District Systems. All rights reserved.
      </div>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <a href="#support" onClick={(e) => e.preventDefault()} style={{ color: 'var(--text-muted)' }}>
          📞 IT Helpdesk Support
        </a>
        <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: 'var(--text-muted)' }}>
          🔒 Security & Privacy Policy
        </a>
        <a href="#help" onClick={(e) => e.preventDefault()} style={{ color: 'var(--text-muted)' }}>
          📘 User Guide
        </a>
      </div>
    </footer>
  );
};

export default Footer;
