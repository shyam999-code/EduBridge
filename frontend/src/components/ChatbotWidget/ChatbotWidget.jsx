import React, { useState, useEffect } from 'react';

const ChatbotWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleChat = () => setIsOpen(prev => !prev);

  return (
    <>
      {/* Floating Chat Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: isMobile ? 'calc(100vw - 48px)' : '380px',
            height: isMobile ? 'calc(100vh - 120px)' : '550px',
            backgroundColor: '#212121',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #1f1f1f 0%, #171717 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <span style={{ fontWeight: 600, color: 'white', fontSize: '14px', fontFamily: 'var(--font-heading)' }}>
                EduBridge AI Companion
              </span>
            </div>
            <button
              onClick={toggleChat}
              style={{
                background: 'none',
                border: 'none',
                color: '#b4b4b4',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = 'white'}
              onMouseOut={(e) => e.target.style.color = '#b4b4b4'}
              aria-label="Close Chat"
            >
              ✕
            </button>
          </div>

          {/* Chat IFrame */}
          <div style={{ flex: 1, backgroundColor: '#212121' }}>
            <iframe
              src={`http://localhost:5005/?userId=${user ? user.id : 'default'}`}
              title="EduBridge AI Assistant Widget"
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #a78bfa 0%, #3b82f6 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: isOpen ? 'none' : '0 6px 20px rgba(139, 92, 246, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          zIndex: 9999,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = isOpen ? 'none' : '0 6px 20px rgba(139, 92, 246, 0.4)';
        }}
        aria-label="Toggle AI Study Companion"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Animation Styles */}
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(24px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </>
  );
};

export default ChatbotWidget;
