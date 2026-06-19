import React, { useState, useEffect } from 'react';
import Card from '../../components/Cards/Card';
import Table from '../../components/Tables/Table';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import { api } from '../../services/api';

const SUBJECT_OPTIONS = [
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'English', label: 'English' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Science', label: 'Science (Biology & Physics)' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'Sports', label: 'Sports' }
];

const TeacherLoginManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [dob, setDob] = useState('');
  const [subject, setSubject] = useState('Telugu');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.listTeachers();
      setTeachers(data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load teachers register: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ Are you sure you want to remove this teacher? This will permanently delete their login credentials.')) {
      try {
        await api.deleteTeacher(id);
        alert('🗑️ Teacher removed successfully.');
        await loadTeachers();
      } catch (err) {
        alert('Failed to remove teacher: ' + err.message);
      }
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !teacherId || !dob || !subject || !phone) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createTeacher({
        name,
        teacher_id: teacherId,
        date_of_birth: dob,
        subject,
        phone,
        email: email || undefined
      });
      alert('✅ Teacher registered successfully! Default login credentials generated.');
      
      // Clear form
      setName('');
      setTeacherId('');
      setDob('');
      setSubject('Telugu');
      setPhone('');
      setEmail('');

      await loadTeachers();
    } catch (err) {
      alert('Failed to register teacher: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader size="medium" text="Syncing teacher roster and active login registry..." />;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>ADMIN MODULE</span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
          Teacher Login Management
        </h2>
      </div>

      <div className="dashboard-layout-main">
        {/* Left Column: Register Form */}
        <div className="widget-section">
          <Card title="Add Teacher Login details" subtitle="Provision login credentials and register a new teacher.">
            <form onSubmit={handleSubmit} className="form-container">
              <FormInput
                label="Teacher Name *"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prof. Marcus Vance"
                required
              />

              <FormInput
                label="Teacher ID *"
                type="text"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="e.g. T001, T002"
                required
              />

              <FormInput
                label="Date of Birth *"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />

              <FormInput
                label="Subject Area *"
                type="select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                options={SUBJECT_OPTIONS}
                required
              />

              <FormInput
                label="Phone Number *"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 014-9821"
                required
              />

              <FormInput
                label="Email (Optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. teacher@edubridge.com"
              />

              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-primary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                lineHeight: 1.4,
                marginBottom: '1.25rem'
              }}>
                🔑 <strong>Credentials Generation Policy:</strong> A linked user account will be generated automatically. The default password is set to the teacher's Date of Birth in <strong>DDMMYYYY</strong> format.
              </div>

              <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? '🔄 Provisioning Teacher...' : '🚀 Register & Generate Credentials'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Registered Teachers List */}
        <div className="widget-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Registered Faculty Registry" subtitle="Roster of all faculty members with custom login details.">
            <div className="table-responsive" style={{
              maxHeight: '500px',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-primary)'
            }}>
              <Table
                columns={[
                  { title: 'Teacher ID', key: 'teacher_id', render: (val) => <strong>{val || 'N/A'}</strong> },
                  { title: 'Name', key: 'name', render: (val) => <strong>{val}</strong> },
                  { title: 'Subject', key: 'subject', render: (val) => val || 'General' },
                  { title: 'Phone', key: 'phone', render: (val) => val || '-' },
                  { title: 'Date of Birth', key: 'date_of_birth', render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
                  {
                    title: 'Action',
                    key: 'id',
                    render: (id) => (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(id)}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        🗑️ Remove
                      </Button>
                    )
                  }
                ]}
                data={teachers}
                emptyMessage="No registered teachers on record."
                className="table-sm"
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default TeacherLoginManagement;
