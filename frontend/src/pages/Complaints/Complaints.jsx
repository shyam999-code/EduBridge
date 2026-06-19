import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Table from '../../components/Tables/Table';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import Modal from '../../components/Modals/Modal';
import { api } from '../../services/api';

const Complaints = () => {
  const { user } = useOutletContext();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  
  // New complaint form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    anonymous: false,
    studentName: '',
    studentClass: ''
  });

  // Admin response state
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = () => {
    setLoading(true);
    api.getComplaints().then((res) => {
      setComplaints(res);
      setLoading(false);
    });
  };

  const handleCreateComplaint = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    if (user.role === 'parent' && (!formData.studentName || !formData.studentClass)) {
      alert("Please provide your son or daughter's name and class.");
      return;
    }

    api.createComplaint({
      title: formData.title,
      description: formData.description,
      submittedBy: formData.anonymous ? 'Anonymous' : user.name,
      student_name: user.role === 'parent' ? formData.studentName : undefined,
      student_class: user.role === 'parent' ? formData.studentClass : undefined
    }).then((res) => {
      alert('Complaint logged successfully!');
      setShowAddModal(false);
      setFormData({ title: '', description: '', anonymous: false, studentName: '', studentClass: '' });
      fetchComplaints(); // Refresh list
    });
  };

  const handleResolveComplaint = (id) => {
    if (!adminResponse) return;
    
    api.updateComplaintStatus(id, 'Resolved', adminResponse)
      .then((res) => {
        alert('Complaint resolved successfully!');
        setActiveComplaint(null);
        setAdminResponse('');
        fetchComplaints(); // Refresh list from backend
      })
      .catch((err) => {
        alert(err.message || 'Failed to resolve complaint.');
      });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved': return 'badge-success';
      case 'Investigating': return 'badge-warning';
      default: return 'badge-danger';
    }
  };

  const columns = [
    { title: 'Complaint ID', key: 'id', width: '100px' },
    { title: 'Issues / Title', key: 'title', render: (val) => <strong>{val}</strong> },
    { title: 'Reported Date', key: 'date' },
    { title: 'Submitted By', key: 'submitted_by_name', render: (val, row) => val || row.submittedBy || 'System User' },
    {
      title: 'Status',
      key: 'status',
      render: (val) => <span className={`badge ${getStatusBadge(val)}`}>{val}</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Button size="sm" variant="secondary" onClick={() => {
          setActiveComplaint(row);
          setAdminResponse(row.response || '');
        }}>
          View Details
        </Button>
      )
    }
  ];

  const isAdmin = user.role === 'admin';
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPLAINT BOX</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
            {isAdmin ? 'School Complaints & Support Console' : 'Complaint Box & Support'}
          </h2>
        </div>
        {!isAdmin && (
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            ✚ Log Complaint
          </Button>
        )}
      </div>

      <div className="grid-3-cols">
        <Card variant="stats" label="Total Filed Requests" number={complaints.length} icon="⚠️" />
        <Card variant="stats" label="Unresolved Complaints" number={complaints.length - resolvedCount} icon="⌛" trend={{ direction: 'up', value: `${pendingCount} new`, label: 'pending response', color: 'danger' }} />
        <Card variant="stats" label="Resolved Complaints" number={resolvedCount} icon="✔" trend={{ direction: 'up', value: `${resolvedCount}/${complaints.length}`, label: 'resolved', color: 'success' }} />
      </div>

      <Card
        title={isAdmin ? "Received Complaints Ledger" : "My Logged Complaints"}
        subtitle="Manage maintenance, portal login problems, safety observations, or bus route queries."
      >
        <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }} className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search complaints by ID, title, or submitter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control search-control"
            />
          </div>
        </div>

        {loading ? (
          <Loader size="medium" text="Syncing complaints..." />
        ) : (
          <Table
            columns={columns}
            data={complaints.filter(c => 
              c.title.toLowerCase().includes(search.toLowerCase()) || 
              c.submittedBy.toLowerCase().includes(search.toLowerCase()) ||
              c.id.toLowerCase().includes(search.toLowerCase())
            )}
          />
        )}
      </Card>

      {/* Detail Complaint Modal */}
      {activeComplaint && (
        <Modal
          isOpen={!!activeComplaint}
          onClose={() => setActiveComplaint(null)}
          title={`Complaint Details: ${activeComplaint.id}`}
          footerActions={
            <>
              <Button variant="secondary" onClick={() => setActiveComplaint(null)}>Close</Button>
              {isAdmin && activeComplaint.status !== 'Resolved' && (
                <Button variant="success" onClick={() => handleResolveComplaint(activeComplaint.id)}>
                  Resolve Complaint
                </Button>
              )}
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>COMPLAINT ISSUE TITLE:</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.2rem' }}>{activeComplaint.title}</h3>
              <div className="flex-between" style={{ marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Submitted on {activeComplaint.date} by <strong>{activeComplaint.submitted_by_name || activeComplaint.submittedBy}</strong>
                </span>
                <span className={`badge ${getStatusBadge(activeComplaint.status)}`}>{activeComplaint.status}</span>
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <span className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Issue Description
              </span>
              <p style={{ marginTop: '0.4rem', lineHeight: 1.45 }}>{activeComplaint.description}</p>
            </div>

            {/* Response Section */}
            <div>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                {isAdmin ? 'Administrative Resolution Response' : 'Support Desk Resolution Response'}
              </span>
              
              {isAdmin && activeComplaint.status !== 'Resolved' ? (
                <div style={{ marginTop: '0.5rem' }}>
                  <FormInput
                    type="textarea"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Enter resolution notes, technician details, or cleared timings..."
                    required
                  />
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  backgroundColor: activeComplaint.response ? 'var(--success-light)' : 'var(--bg-primary)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '0.5rem'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: activeComplaint.response ? 'var(--success)' : 'var(--text-muted)',
                    fontStyle: activeComplaint.response ? 'normal' : 'italic',
                    lineHeight: 1.4
                  }}>
                    {activeComplaint.response || 'No resolution response logged yet. Support desk is reviewing the item.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Add Complaint Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Log a Complaint / Issue"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateComplaint}>Submit Complaint</Button>
          </>
        }
      >
        <form onSubmit={handleCreateComplaint} className="form-container">
          {user.role === 'parent' && (
            <>
              <FormInput
                label="Son or Daughter's Full Name"
                name="studentName"
                value={formData.studentName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                placeholder="e.g. Leo Sterling"
                required
              />
              <FormInput
                label="Son or Daughter's Class / Grade"
                name="studentClass"
                value={formData.studentClass || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, studentClass: e.target.value }))}
                placeholder="e.g. Class 8"
                required
              />
            </>
          )}

          <FormInput
            label="Issue Summary Title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Bus Route 4 Overcrowded, Block B Leaking Fountain"
            required
          />

          <FormInput
            label="Detailed Descriptive Summary"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Specify location, bus routes, dates, or portal errors noticed in detail."
            required
          />

          <FormInput
            label="Submit Anonymously"
            name="anonymous"
            type="switch"
            value={formData.anonymous}
            onChange={(e) => setFormData(prev => ({ ...prev, anonymous: e.target.checked }))}
            helperText="Check this if you want to keep your name hidden from public lists."
          />
        </form>
      </Modal>
    </>
  );
};

export default Complaints;
