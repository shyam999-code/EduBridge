import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Loader from '../../components/Loaders/Loader';
import Button from '../../components/Buttons/Button';
import { api } from '../../services/api';

const Notifications = () => {
  const { user } = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = () => {
    setLoading(true);
    api.getNotifications().then(res => {
      setNotifications(res);
      setLoading(false);
    });
  };

  const handleMarkAllRead = () => {
    api.markNotificationsAsRead().then(res => {
      setNotifications(res.notifications);
      alert('All notifications marked as read.');
    });
  };

  const getNotifColor = (type) => {
    switch (type) {
      case 'alert': return 'var(--danger)';
      case 'update': return 'var(--primary)';
      default: return 'var(--secondary)'; // event or general notice
    }
  };

  const filteredNotifs = notifications.filter(n => {
    return filter === 'all' || !n.read;
  });

  return (
    <>
      <div className="flex-between">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAMPUS COMMUNICATIONS</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
            Recent Alerts, Circular Updates & System Notifications
          </h2>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="secondary" onClick={handleMarkAllRead}>
            ✔ Mark All Read
          </Button>
        )}
      </div>

      <div className="dashboard-layout-main" style={{ gridTemplateColumns: '1fr' }}>
        <div className="widget-section">
          {/* Header filters */}
          <div className="search-filter-bar" style={{ padding: '0.75rem 1rem' }}>
            <div className="filter-group">
              <button
                onClick={() => setFilter('all')}
                className={`pagination-btn ${filter === 'all' ? 'active' : ''}`}
                style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem 1.1rem', fontSize: '0.8rem', fontWeight: 700 }}
              >
                All Bulletins ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`pagination-btn ${filter === 'unread' ? 'active' : ''}`}
                style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem 1.1rem', fontSize: '0.8rem', fontWeight: 700 }}
              >
                Unread Messages ({notifications.filter(n => !n.read).length})
              </button>
            </div>
          </div>

          {loading ? (
            <Loader size="medium" text="Syncing logs..." />
          ) : filteredNotifs.length === 0 ? (
            <div style={{
              padding: '4rem 2rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔔</span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No notifications matching current filter.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `5px solid ${getNotifColor(n.type)}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: n.read ? 0.75 : 1,
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="flex-row" style={{ gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span className="badge badge-primary" style={{
                        backgroundColor: `${getNotifColor(n.type)}15`,
                        color: getNotifColor(n.type)
                      }}>
                        {n.type}
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{n.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>&bull; {n.time}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{n.text}</p>
                  </div>
                  
                  {!n.read && (
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                        alert('Marked as read.');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;
