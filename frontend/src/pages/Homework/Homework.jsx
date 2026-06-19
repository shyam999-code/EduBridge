import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Table from '../../components/Tables/Table';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import Modal from '../../components/Modals/Modal';
import { api } from '../../services/api';

const Homework = () => {
  const { user } = useOutletContext();
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSubmittingId, setActiveSubmittingId] = useState(null);

  // Faculty Specific States
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectLockInput, setSubjectLockInput] = useState('Telugu');

  // Homework Form State
  const [newHomework, setNewHomework] = useState({
    chapter: '',
    completionDay: ''
  });

  const fetchHomework = async () => {
    try {
      if (user.role === 'teacher') {
        // 1. Fetch teacher details to enforce privacy subject
        const profile = await api.getTeacherProfileSelf();
        setTeacherProfile(profile);
        if (!profile.subject) {
          setShowSubjectModal(true);
        } else {
          setSelectedSubject(profile.subject);
          setSubjectFilter(profile.subject);
        }
      }

      // 2. Fetch homework assignments
      const res = await api.getHomework();
      const mapped = res.map(hw => ({
        id: hw.id,
        subject: hw.subject,
        chapter: hw.chapter_name || hw.title,
        completionDay: hw.due_date || hw.dueDate,
        status: hw.status,
        assignedBy: hw.assignedBy || 'Faculty Teacher'
      }));
      setHomeworkList(mapped);
    } catch (err) {
      console.error('Failed to load homework records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchHomework();
  }, [user.role]);

  const handleMarkCompleted = (id) => {
    setActiveSubmittingId(id);
    api.submitHomework(id).then(() => {
      alert('Homework assignment marked as completed!');
      setActiveSubmittingId(null);
      fetchHomework(); // Refresh list
    }).catch(err => {
      alert('Failed to update homework status.');
      setActiveSubmittingId(null);
    });
  };

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    if (!newHomework.chapter || !newHomework.completionDay || !selectedSubject) return;

    try {
      await api.postHomework({
        class_id: 'c1111111-1111-1111-1111-111111111111', // default class Grade 10-A
        subject: selectedSubject,
        chapter_name: newHomework.chapter,
        due_date: newHomework.completionDay,
        completion_day: new Date(newHomework.completionDay).toLocaleDateString('en-US', { weekday: 'long' }),
        details: `Complete homework assignments and exercise worksheets for ${newHomework.chapter}.`
      });

      setShowAddModal(false);
      setNewHomework({
        chapter: '',
        completionDay: ''
      });

      // Reload list dynamically
      setLoading(true);
      await fetchHomework();
    } catch (err) {
      alert(err.message || 'Failed to assign homework.');
    }
  };

  const handleLockSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = await api.updateTeacherProfileSelf({ subject: subjectLockInput });
      setTeacherProfile(updatedProfile);
      setSelectedSubject(subjectLockInput);
      setSubjectFilter(subjectLockInput);
      setShowSubjectModal(false);
      
      // Reload lists
      setLoading(true);
      await fetchHomework();
    } catch (err) {
      alert(err.message || 'Failed to update subject privacy profile.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Submitted':
      case 'Completed': return 'badge-success';
      case 'Graded': return 'badge-primary';
      case 'Urgent': return 'badge-danger';
      default: return 'badge-warning'; // Pending
    }
  };

  const isTeacher = user.role === 'teacher' || user.role === 'admin';

  // Columns definition (Clean, Simple, Professional)
  const columns = [
    { 
      title: 'Subject', 
      key: 'subject', 
      width: '180px',
      render: (val) => <span className="text-primary-color" style={{ fontWeight: 700 }}>{val}</span> 
    },
    { 
      title: 'Chapter Name', 
      key: 'chapter', 
      render: (val) => <strong style={{ fontSize: '0.9rem' }}>{val}</strong> 
    },
    { 
      title: 'Completion Day', 
      key: 'completionDay', 
      width: '150px',
      render: (val, row) => {
        const isUrgent = row.status === 'Urgent';
        return (
          <span style={{ 
            fontWeight: 600, 
            color: isUrgent ? 'var(--danger)' : 'var(--text-secondary)' 
          }}>
            📅 {val}
          </span>
        );
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: '120px',
      render: (val) => {
        const displayVal = val === 'Submitted' ? 'Completed' : val;
        return <span className={`badge ${getStatusBadgeClass(val)}`}>{displayVal}</span>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '180px',
      align: 'right',
      render: (_, row) => {
        const isCompleted = row.status === 'Submitted' || row.status === 'Graded';
        
        if (isTeacher) {
          return <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Assigned by you</span>;
        }

        return (
          <Button
            size="sm"
            variant={isCompleted ? "secondary" : "primary"}
            disabled={isCompleted || activeSubmittingId === row.id}
            onClick={() => handleMarkCompleted(row.id)}
            style={{ width: '120px' }}
          >
            {isCompleted ? '✓ Completed' : 'Mark Complete'}
          </Button>
        );
      }
    }
  ];

  // Filters homework logic by subject
  const getFilteredHomework = () => {
    let list = homeworkList;
    if (user.role === 'teacher' && selectedSubject) {
      list = list.filter(hw => hw.subject === selectedSubject);
    } else if (subjectFilter !== 'All') {
      list = list.filter(hw => hw.subject.toLowerCase().includes(subjectFilter.toLowerCase()));
    }
    return list;
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLASS ASSIGNMENTS</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
            {isTeacher ? 'Manage Classroom Homework Ledger' : 'My Homework & Chapters Log'}
          </h2>
        </div>
        {isTeacher && (
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            ✚ Assign Homework
          </Button>
        )}
      </div>

      <div className="dashboard-layout-main" style={{ gridTemplateColumns: '1fr' }}>
        <div className="widget-section">
          
          {/* Reusable Statistics Cards Header */}
          <div className="grid-3-cols">
            <Card variant="stats" label="Total Assigned" number={homeworkList.length} icon="📝" />
            <Card variant="stats" label="Pending Tasks" number={homeworkList.filter(h => h.status === 'Pending' || h.status === 'Urgent').length} icon="⌛" />
            <Card variant="stats" label="Completed Tasks" number={homeworkList.filter(h => h.status === 'Submitted' || h.status === 'Graded').length} icon="✔" trend={{ direction: 'up', value: 'Completed', label: 'status', color: 'success' }} />
          </div>

          {/* Table Card Ledger */}
          <Card 
            title="Class Homework Ledger" 
            subtitle="Search chapters and target completion days."
            headerAction={
              <div style={{ width: '180px' }}>
                <FormInput
                  type="select"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  disabled={user.role === 'teacher'} // Locked for teachers
                  options={[
                    { value: 'All', label: 'All Subjects' },
                    { value: 'Telugu', label: 'Telugu' },
                    { value: 'Hindi', label: 'Hindi' },
                    { value: 'English', label: 'English' },
                    { value: 'Mathematics', label: 'Mathematics' },
                    { value: 'Biology', label: 'Biology' },
                    { value: 'Physics', label: 'Physics' },
                    { value: 'Social Studies', label: 'Social Studies' },
                    { value: 'Sports', label: 'Sports' }
                  ]}
                />
              </div>
            }
          >
            {user.role === 'teacher' && selectedSubject && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                borderLeft: '4px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                🔒 Gated Mode: Restricted to your primary subject area (<strong>{selectedSubject}</strong>) for privacy compliance.
              </div>
            )}

            {loading ? (
              <Loader size="medium" text="Loading homework records..." />
            ) : (
              <Table 
                columns={columns} 
                data={getFilteredHomework()} 
                emptyMessage="No homework logged for the selected subject."
              />
            )}
          </Card>

        </div>
      </div>

      {/* Simplified Post Homework Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Assign New Homework Task"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateHomework}>Post Assignment</Button>
          </>
        }
      >
        <form onSubmit={handleCreateHomework} className="form-container">
          <FormInput
            label="Subject Area (Locked)"
            name="subject"
            type="text"
            value={selectedSubject}
            disabled
            required
          />

          <FormInput
            label="Chapter Name"
            name="chapter"
            type="text"
            value={newHomework.chapter}
            onChange={(e) => setNewHomework(prev => ({ ...prev, chapter: e.target.value }))}
            placeholder="e.g. Chapter 4: Quadratic Equations"
            required
          />

          <FormInput
            label="Completion Day"
            name="completionDay"
            type="date"
            value={newHomework.completionDay}
            onChange={(e) => setNewHomework(prev => ({ ...prev, completionDay: e.target.value }))}
            required
          />
        </form>
      </Modal>

      {/* Lock Subject Modal for teachers */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => {}} // Non-closable until a subject is selected
        title="Privacy Configuration - Core Subject Lock-In"
        footerActions={
          <Button variant="primary" onClick={handleLockSubjectSubmit}>Lock In Subject & Proceed</Button>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            To enforce student confidentiality and strict privacy gating regulations, please select your primary instructional subject area. This locks your classroom schedules, attendance sheets, grading book, and assigned homework logs to only show records under this division.
          </p>
          <FormInput
            label="Designated Subject Area"
            type="select"
            value={subjectLockInput}
            onChange={(e) => setSubjectLockInput(e.target.value)}
            options={[
              { value: 'Telugu', label: '1. Telugu' },
              { value: 'Hindi', label: '2. Hindi' },
              { value: 'English', label: '3. English' },
              { value: 'Mathematics', label: '4. Mathematics' },
              { value: 'Science', label: '5. Science (Biology & Physics)' },
              { value: 'Social Studies', label: '6. Social Studies' },
              { value: 'Sports', label: '7. Sports' }
            ]}
          />
        </div>
      </Modal>
    </>
  );
};

export default Homework;
