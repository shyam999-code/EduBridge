import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import Modal from '../../components/Modals/Modal';
import { api } from '../../services/api';

const Announcements = () => {
  const { user } = useOutletContext();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeNotice, setActiveNotice] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // New Notice Form State
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    type: 'general' // urgent, event, general
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = () => {
    setLoading(true);
    api.getAnnouncements().then(res => {
      setNotices(res);
      setLoading(false);
    });
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setNewNotice({ title: '', content: '', type: 'general' });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setIsEditMode(false);
    setEditingId(null);
    setNewNotice({ title: '', content: '', type: 'general' });
  };

  const handleCreateNotice = async (e) => {
    if (e) e.preventDefault();
    if (!newNotice.title || !newNotice.content) return;

    try {
      if (isEditMode) {
        await api.updateAnnouncement(editingId, {
          title: newNotice.title,
          content: newNotice.content,
          type: newNotice.type
        });
        alert(`Successfully updated notice: "${newNotice.title}"!`);
      } else {
        await api.createAnnouncement({
          title: newNotice.title,
          content: newNotice.content,
          type: newNotice.type
        });
        alert(`Successfully posted announcement: "${newNotice.title}"!`);
      }
      fetchNotices();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to save announcement.');
    }
  };

  const handleEditClick = (e, notice) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingId(notice.id);
    setNewNotice({
      title: notice.title,
      content: notice.content,
      type: notice.type
    });
    setShowAddModal(true);
  };

  const handleDeleteClick = async (e, notice) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to cancel and delete the bulletin: "${notice.title}"?`);
    if (!confirmed) return;

    try {
      await api.deleteAnnouncement(notice.id);
      alert('Notice deleted successfully.');
      fetchNotices();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete notice.');
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'urgent': return 'badge-danger';
      case 'event': return 'badge-secondary';
      default: return 'badge-primary';
    }
  };

  const isStaff = user.role === 'admin';

  // Filters logic
  const filteredNotices = notices.filter(n => {
    return typeFilter === 'All' || n.type === typeFilter;
  });

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAMPUS NOTICEBOARD</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
            School Circulars, Updates & Scheduled Events
          </h2>
        </div>
        {isStaff && (
          <Button variant="primary" onClick={handleOpenCreateModal}>
            ✚ Post New Notice
          </Button>
        )}
      </div>

      <div className="dashboard-layout-main">
        {/* Main Section: Announcements Lists */}
        <div className="widget-section">
          {/* Filters Bar */}
          <div className="search-filter-bar" style={{ padding: '0.75rem 1rem' }}>
            <div className="filter-group">
              {['All', 'urgent', 'event', 'general'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`pagination-btn ${typeFilter === type ? 'active' : ''}`}
                  style={{
                    borderRadius: 'var(--radius-full)',
                    padding: '0.45rem 1.1rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'capitalize'
                  }}
                >
                  {type === 'All' ? 'All Bulletins' : `${type} bulletins`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Loader size="medium" text="Syncing circular updates..." />
          ) : filteredNotices.length === 0 ? (
            <div style={{
              padding: '4rem 2rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📢</span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No circulars matching current filter.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredNotices.map((n) => (
                <div
                  key={n.id}
                  className={`notice-card ${n.type}`}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderLeftWidth: '5px',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveNotice(n)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div className="notice-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${getBadgeClass(n.type)}`}>{n.type}</span>
                      <span className="notice-date">Posted: {n.date}</span>
                    </div>
                    {isStaff && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={(e) => handleEditClick(e, n)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                            transition: 'background-color 0.2s, color 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--secondary-light)';
                            e.currentTarget.style.color = 'var(--secondary)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                          title="Edit Notice"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, n)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                            transition: 'background-color 0.2s, color 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--danger-light)';
                            e.currentTarget.style.color = 'var(--danger)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                          title="Delete Notice"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="notice-title" style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.25rem' }}>{n.title}</h3>
                  <p className="notice-excerpt" style={{
                    marginTop: '0.5rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.5,
                    fontSize: '0.9rem'
                  }}>
                    {n.content}
                  </p>
                  
                  <span style={{
                    display: 'block',
                    textAlign: 'right',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    marginTop: '0.75rem'
                  }}>
                    Issued by: {n.author || n.author_name || 'Principal Office'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Section: Upcoming Calendar Events */}
        <div className="widget-section">
          <Card title="Upcoming Campus Events" subtitle="Term activities & dates.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  <span>JUN</span>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>08</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Science Exhibition Reg</h5>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mathematics & Physics block clearances.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  <span>JUN</span>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>10</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Gym Renovation Completion</h5>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pool deck and weight training room opens.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  <span>JUN</span>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>18</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Final Term Exam Start</h5>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detailed schedules release in Settings.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Detail View Modal */}
      {activeNotice && (
        <Modal
          isOpen={!!activeNotice}
          onClose={() => setActiveNotice(null)}
          title="Noticeboard Bulletin details"
          footerActions={<Button variant="primary" onClick={() => setActiveNotice(null)}>Close Bulletin</Button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className={`badge ${getBadgeClass(activeNotice.type)}`}>{activeNotice.type}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Posted on: {activeNotice.date}</span>
            </div>
            
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {activeNotice.title}
            </h3>

            <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
              {activeNotice.content}
            </p>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Authorized Signatory: <strong style={{ color: 'var(--text-primary)' }}>{activeNotice.author || activeNotice.author_name || 'Principal Office'}</strong>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Notice Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={isEditMode ? "Edit School Bulletin/Notice" : "Post School Bulletin/Notice"}
        footerActions={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateNotice}>
              {isEditMode ? "Save Changes" : "Post Circular"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateNotice} className="form-container">
          <FormInput
            label="Circular Title"
            name="title"
            value={newNotice.title}
            onChange={(e) => setNewNotice(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Science Fair Registration, Bus route splits"
            required
          />

          <FormInput
            label="Notice Category"
            name="type"
            type="select"
            value={newNotice.type}
            onChange={(e) => setNewNotice(prev => ({ ...prev, type: e.target.value }))}
            options={[
              { value: 'general', label: 'General Announcement' },
              { value: 'urgent', label: 'Urgent Circular Alert' },
              { value: 'event', label: 'Scheduled Campus Event' }
            ]}
            required
          />

          <FormInput
            label="Notice Content & Body"
            name="content"
            type="textarea"
            value={newNotice.content}
            onChange={(e) => setNewNotice(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Enter the comprehensive notice body. Provide instructions, clearances, dates, or contact emails..."
            required
          />
        </form>
      </Modal>
    </>
  );
};

export default Announcements;
