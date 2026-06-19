import React, { useState, useEffect } from 'react';
import Card from '../../components/Cards/Card';
import Table from '../../components/Tables/Table';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import { api } from '../../services/api';

const StudentLoginManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [gradeClass, setGradeClass] = useState('8');
  const [section, setSection] = useState('D');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await api.listStudents();
      setStudents(data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load students register: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ Are you sure you want to remove this student? This will permanently delete their and their parent\'s login credentials.')) {
      try {
        await api.deleteStudent(id);
        alert('🗑️ Student removed successfully.');
        await loadStudents();
      } catch (err) {
        alert('Failed to remove student: ' + err.message);
      }
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !gradeClass || !section || !rollNumber || !dob || !parentName || !parentPhone) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createStudent({
        name,
        class: gradeClass,
        section,
        roll_number: rollNumber,
        date_of_birth: dob,
        parent_name: parentName,
        parent_phone: parentPhone
      });
      alert('✅ Student registered successfully! Student login and linked Parent credentials generated.');
      
      // Clear form
      setName('');
      setGradeClass('8');
      setSection('D');
      setRollNumber('');
      setDob('');
      setParentName('');
      setParentPhone('');

      await loadStudents();
    } catch (err) {
      alert('Failed to register student: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader size="medium" text="Syncing pupil register and active credential database..." />;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>FACULTY MODULE</span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
          Student Login Management
        </h2>
      </div>

      <div className="dashboard-layout-main">
        {/* Left Column: Form */}
        <div className="widget-section">
          <Card title="Add Student details" subtitle="Provision pupil and linked parent credentials.">
            <form onSubmit={handleSubmit} className="form-container">
              <FormInput
                label="Student Name *"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />

              <div className="class-section-roll-grid">
                <FormInput
                  label="Class/Grade *"
                  type="text"
                  value={gradeClass}
                  onChange={(e) => setGradeClass(e.target.value)}
                  placeholder="e.g. 8, 10"
                  required
                />
                <FormInput
                  label="Section *"
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. D, A"
                  required
                />
                <FormInput
                  label="Roll Number *"
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 46, 12"
                  required
                />
              </div>

              <FormInput
                label="Date of Birth *"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />

              <FormInput
                label="Parent / Guardian Name *"
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Robert Sterling"
                required
              />

              <FormInput
                label="Parent Mobile Number *"
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="e.g. 9988776655"
                required
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
                🔒 <strong>Credentials Rules:</strong><br />
                - Student ID Format: <strong>Class + Section + Roll Number</strong> (e.g. 8D46)<br />
                - Student Default Password: DOB in <strong>DDMMYYYY</strong> format<br />
                - Parent Default User ID & Password: <strong>Parent Mobile Number</strong>
              </div>

              <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? '🔄 Provisioning pupil...' : '🚀 Register Student & Link Parent'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Registered Students List */}
        <div className="widget-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Pupil Login Registry" subtitle="Roster of all enrolled students with login identifiers.">
            <div style={{
              maxHeight: '520px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-primary)'
            }}>
              <Table
                columns={[
                  { title: 'Student ID', key: 'student_id', render: (val) => <strong>{val || 'N/A'}</strong> },
                  { title: 'Name', key: 'name', render: (val) => <strong>{val}</strong> },
                  { title: 'Class', key: 'class_name', render: (val, row) => val || 'Grade 10-A' },
                  { title: 'Roll Number', key: 'roll_number', render: (val) => val },
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
                data={students}
                emptyMessage="No registered students on record."
                className="table-sm"
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default StudentLoginManagement;
