import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const Navbar = ({ activeUser, onSidebarToggle }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (activeUser && activeUser.role === 'teacher') {
      api.getTeacherProfileSelf().then(prof => {
        setProfile(prof);
      }).catch(err => console.error(err));
    }
  }, [activeUser]);

  useEffect(() => {
    // Read and apply theme
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Fetch notifications
    api.getNotifications().then(data => setNotifications(data));
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    api.markNotificationsAsRead().then(res => {
      setNotifications(res.notifications);
    });
  };

  const handleLogout = () => {
    api.logout().then(() => {
      navigate('/login');
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="glass" style={{
      height: '70px',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 99,
    }}>
      {/* Left side: Hamburger Toggle & Title */}
      <div className="flex-row" style={{ gap: '1.25rem' }}>
        <button
          className="mobile-menu-toggle"
          onClick={onSidebarToggle}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            fontSize: '1.35rem',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          ☰
        </button>
        
        {/* Search bar mockup */}
        <div style={{ position: 'relative', width: '280px' }} className="search-input-wrapper">
          <span style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search records, grades, news..."
            style={{
              width: '100%',
              padding: '0.5rem 1rem 0.5rem 2.25rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color var(--transition-fast)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>
      </div>

      {/* Right side: Options, Notifications, Profile */}
      <div className="flex-row" style={{ gap: '1.25rem' }}>
        {/* Science Subject Switcher */}
        {profile && profile.rawSubject === 'Science' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '2px 4px',
            gap: '2px',
            marginRight: '0.25rem'
          }}>
            <button
              onClick={() => {
                if (profile.subject !== 'Biology') {
                  localStorage.setItem('active_science_subject', 'Biology');
                  window.location.reload();
                }
              }}
              style={{
                border: 'none',
                background: profile.subject === 'Biology' ? 'var(--primary)' : 'transparent',
                color: profile.subject === 'Biology' ? 'white' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              🧬 Biology
            </button>
            <button
              onClick={() => {
                if (profile.subject !== 'Physics') {
                  localStorage.setItem('active_science_subject', 'Physics');
                  window.location.reload();
                }
              }}
              style={{
                border: 'none',
                background: profile.subject === 'Physics' ? 'var(--success)' : 'transparent',
                color: profile.subject === 'Physics' ? 'white' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              ⚛️ Physics
            </button>
          </div>
        )}

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color var(--transition-fast)',
            color: 'var(--text-primary)'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'var(--border-color)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Notifications Bell */}
        {activeUser && activeUser.role !== 'admin' && activeUser.role !== 'student' && (
          <>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowNotifDropdown(prev => !prev);
                  setShowProfileDropdown(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'background-color var(--transition-fast)',
                  color: 'var(--text-primary)'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--border-color)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--danger)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulseNotification 2s infinite'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Card */}
              {showNotifDropdown && (
                <div className="glass" style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  width: '320px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden',
                  animation: 'fadeIn var(--transition-fast)'
                }}>
                  <div className="flex-between" style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlignment: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No notifications.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            setShowNotifDropdown(false);
                            navigate('/notifications');
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: n.read ? 'transparent' : 'rgba(37,99,235,0.04)',
                            cursor: 'pointer',
                            transition: 'background var(--transition-fast)'
                          }}
                        >
                          <div className="flex-between" style={{ marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{n.title}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.time}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{n.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    <button
                      onClick={() => {
                        setShowNotifDropdown(false);
                        navigate('/notifications');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      See All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Vertical divider */}
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
          </>
        )}

        {/* Profile Card Trigger */}
        {activeUser && (
          <div style={{ position: 'relative' }}>
            <div
              className="flex-row"
              onClick={() => {
                setShowProfileDropdown(prev => !prev);
                setShowNotifDropdown(false);
              }}
              style={{ cursor: 'pointer', gap: '0.75rem' }}
            >
              <img
                src={activeUser.avatar}
                alt={activeUser.name}
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border-color)'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }} className="mobile-menu-toggle">
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {activeUser.name}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>
                  {activeUser.role}
                </span>
              </div>
            </div>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="glass" style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '200px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                animation: 'fadeIn var(--transition-fast)'
              }}>
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  textAlign: 'center'
                }}>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{activeUser.name}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{activeUser.email}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/profile');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0.75rem 1rem',
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-primary)'
                    }}
                  >
                    👤 My Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/settings');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0.75rem 1rem',
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-primary)'
                    }}
                  >
                    ⚙️ Settings
                  </button>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0.75rem 1rem',
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--danger)',
                      fontWeight: 600
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
