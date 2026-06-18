import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Loader from '../../components/Loaders/Loader';
import Button from '../../components/Buttons/Button';
import { DonutProgress, BarChart, LineChart } from '../../components/Charts/CustomChart';
import FormInput from '../../components/Forms/FormInput';
import Modal from '../../components/Modals/Modal';
import { api } from '../../services/api';

const Dashboard = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);

  // Gated subject checking state for teachers
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectLockInput, setSubjectLockInput] = useState('Telugu');
  const [timetable, setTimetable] = useState(null);

  const mapDashboardClassIdToDbId = (dashboardId) => {
    switch (dashboardId) {
      case '6A': return 'class-6a';
      case '7A': return 'class-7a';
      case '8A': return 'class-8a';
      case '9B': return 'class-9b';
      case '9A': return 'class-9a';
      case '10A': return 'c1111111-1111-1111-1111-111111111111';
      default: return dashboardId;
    }
  };

  const handleApproveAdmin = async (id) => {
    if (window.confirm('Are you sure you want to APPROVE this School Admin registration request?')) {
      try {
        await api.approveAdminRegistration(id);
        alert('✅ School Admin request approved successfully!');
        const regs = await api.listAdminRegistrations();
        setRegistrations(regs || []);
      } catch (err) {
        alert('Failed to approve request: ' + err.message);
      }
    }
  };

  const handleRejectAdmin = async (id) => {
    if (window.confirm('⚠️ Are you sure you want to REJECT this School Admin registration request?')) {
      try {
        await api.rejectAdminRegistration(id);
        alert('❌ School Admin request rejected.');
        const regs = await api.listAdminRegistrations();
        setRegistrations(regs || []);
      } catch (err) {
        alert('Failed to reject request: ' + err.message);
      }
    }
  };

  const handleRemoveAdmin = async (id) => {
    if (window.confirm('🗑️ Are you sure you want to REMOVE this School Admin? They will be deleted from our registration roster and users list, blocking their access immediately.')) {
      try {
        await api.removeAdminRegistration(id);
        alert('🗑️ School Admin removed successfully.');
        const regs = await api.listAdminRegistrations();
        setRegistrations(regs || []);
      } catch (err) {
        alert('Failed to remove admin: ' + err.message);
      }
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (user.role === 'teacher') {
          const profile = await api.getTeacherProfileSelf();
          setTeacherProfile(profile);
          if (!profile.subject) {
            setShowSubjectModal(true);
          }
          try {
            const tt = await api.getTimetableData();
            setTimetable(tt);
          } catch (ttErr) {
            console.error('Failed to load timetable config:', ttErr);
          }
        }
        const res = await api.getDashboardData(user.role);
        setData(res);

        if (user.role === 'admin' && user.email.toLowerCase() === 'edubridgeadmin1@gmail.com') {
          try {
            setRegLoading(true);
            const regs = await api.listAdminRegistrations();
            setRegistrations(regs || []);
          } catch (regErr) {
            console.error('Failed to load admin registrations:', regErr);
          } finally {
            setRegLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'An unexpected error occurred while loading your workspace.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user.role, user.email]);

  if (loading) {
    return <Loader size="large" text={`Loading your ${user.role} workspace...`} />;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem 0', maxWidth: '600px', margin: '0 auto' }}>
        <Card title="Workspace Connection Timeout" subtitle="There was an issue retrieving your dashboard details.">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', gap: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem' }}>⚠️</span>
            <p style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '1rem' }}>{error}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Please verify your API endpoints are active on ports 5000 and 5001, your internet connection is stable, or click the button below to retry.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button onClick={() => window.location.reload()}>Retry Connection</Button>
              <Button variant="secondary" onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}>Sign Out & Logout</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 1. ADMIN DASHBOARD VIEW
  const renderAdminDashboard = () => {
    const { stats, attendanceToday, activities } = data;
    return (
      <>
        {user.email.toLowerCase() === 'edubridgeadmin1@gmail.com' && registrations && registrations.length > 0 && (
          <Card title="School Admin Registrations & Access Control" subtitle="Manage school administrator registrations: approve pending requests or remove active admins.">
            <div style={{
              overflowX: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-primary)',
              marginBottom: '1.5rem'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Full Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>School Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Email Address</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Mobile Number</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{reg.full_name}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{reg.school_name}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{reg.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{reg.mobile_number}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: reg.status === 'Pending' ? 'rgba(234, 179, 8, 0.1)' : reg.status === 'Approved' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                          color: reg.status === 'Pending' ? '#ca8a04' : reg.status === 'Approved' ? '#16a34a' : '#dc2626'
                        }}>
                          {reg.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {reg.status === 'Pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveAdmin(reg.id)}
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRejectAdmin(reg.id)}
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {reg.status === 'Approved' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveAdmin(reg.id)}
                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            Remove Admin
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Statistics Panels Grid */}
        <div className="dashboard-grid">
          <Card
            variant="stats"
            label="Total Students"
            number={stats.totalStudents.value}
            icon="🎓"
            trend={{ direction: 'up', value: stats.totalStudents.change, label: 'enrollments' }}
            onClick={() => navigate('/admin/attendance')}
          />
          <Card
            variant="stats"
            label="Total Faculty"
            number={stats.totalTeachers.value}
            icon="👨‍🏫"
            trend={{ direction: 'up', value: stats.totalTeachers.change, label: 'hired' }}
          />
          <Card
            variant="stats"
            label="Total Parents"
            number={stats.totalParents.value}
            icon="🏡"
            trend={{ direction: 'up', value: stats.totalParents.change, label: 'registered' }}
          />
          <Card
            variant="stats"
            label="Active Complaints"
            number={stats.activeComplaints.value}
            icon="⚠️"
            trend={{ direction: 'down', value: stats.activeComplaints.change, label: 'resolved', color: 'success' }}
            onClick={() => navigate('/admin/complaints')}
          />
        </div>

        {/* Layout Split: School Analytics & Quick Actions / Activities */}
        <div className="dashboard-layout-main">
          {/* Main Area */}
          <div className="widget-section">
            <Card title="School Attendance & Grade Analytics">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '2rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Today's Attendance Rate
                  </h4>
                  <DonutProgress value={96.2} size={140} strokeWidth={12} color="var(--success)" label="Present" />
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span className="text-success">✔ 1152 Present</span>
                    <span className="text-danger">✖ 36 Absent</span>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Average Attendance Rate by Grade Levels
                  </h4>
                  <BarChart
                    data={[
                      { label: 'Grade 6', value: 95.8, color: 'var(--primary)' },
                      { label: 'Grade 7', value: 94.6, color: 'var(--secondary)' },
                      { label: 'Grade 8', value: 97.1, color: 'var(--success)' },
                      { label: 'Grade 9', value: 96.5, color: 'var(--warning)' },
                      { label: 'Grade 10', value: 95.2, color: 'var(--info)' }
                    ]}
                  />
                </div>
              </div>
            </Card>

            <Card title="Quick Administration Tasks">
              <div className="quick-actions-grid">
                <button className="quick-action-btn" onClick={() => navigate('/admin/attendance')}>
                  <span className="quick-action-icon">📅</span>
                  <span className="quick-action-label">Log Attendance</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/admin/marks')}>
                  <span className="quick-action-icon">🏆</span>
                  <span className="quick-action-label">Academic Grades</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/admin/complaints')}>
                  <span className="quick-action-icon">⚠️</span>
                  <span className="quick-action-label">Review Complaints</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/admin/announcements')}>
                  <span className="quick-action-icon">📢</span>
                  <span className="quick-action-label">Post Announcement</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/admin/reports')}>
                  <span className="quick-action-icon">📑</span>
                  <span className="quick-action-label">School Reports</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="widget-section">
            <Card title="Recent Activities Feed">
              <div className="activity-feed">
                {activities.map((act) => (
                  <div className={`activity-item ${act.category}`} key={act.id}>
                    <div className="activity-icon-wrapper">
                      {act.category === 'success' ? '✔' : act.category === 'warning' ? '⚠' : 'ℹ'}
                    </div>
                    <div className="activity-details">
                      <div className="activity-header">
                        <span className="activity-title">{act.title}</span>
                        <span className="activity-time">{act.time}</span>
                      </div>
                      <p className="activity-desc">{act.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  };

  // 2. TEACHER DASHBOARD VIEW
  const renderTeacherDashboard = () => {
    const { stats, classes, recentActivities } = data;
    return (
      <>
        <div className="dashboard-grid cols-3">
          <Card variant="stats" label="Assigned Classes" number={stats.assignedClasses.value} icon="👨‍🏫" />
          <Card variant="stats" label="Today Attendance" number={stats.todayAttendance.value} icon="📅" trend={{ direction: 'up', value: '98%', label: 'class average' }} />
          <Card variant="stats" label="Behavior referrals" number={stats.behaviorAlerts.value} icon="⭐" />
        </div>

        <div className="dashboard-layout-main">
          {/* Main Area */}
          <div className="widget-section">
            <Card title="My Active Class Schedules">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {classes.map((cls) => {
                  const dbClassId = mapDashboardClassIdToDbId(cls.id);
                  const isAssignedClassTeacher = (timetable?.classTeachers || []).some(
                    ct => ct.classId === dbClassId && ct.teacherId === teacherProfile?.id
                  );
                  return (
                    <div key={cls.id} className="notice-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderLeftColor: 'var(--primary)' }}>
                      <div>
                        <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>{cls.id}</span>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{cls.name} &bull; {cls.subject}</h4>
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>Registered Strength: {cls.strength} Pupils</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>Class Attendance</span>
                          <strong style={{ color: 'var(--success)' }}>{cls.lastAttendance}</strong>
                        </div>
                        {isAssignedClassTeacher && (
                          <Button size="sm" variant="secondary" onClick={() => navigate('/teacher/attendance')}>Attendance</Button>
                        )}
                        <Button size="sm" variant="primary" onClick={() => navigate('/teacher/marks')}>Markbook</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Quick Classroom Links">
              <div className="quick-actions-grid">
                <button className="quick-action-btn" onClick={() => navigate('/teacher/attendance')}>
                  <span className="quick-action-icon">📅</span>
                  <span className="quick-action-label">Class Attendance</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/teacher/marks')}>
                  <span className="quick-action-icon">🏆</span>
                  <span className="quick-action-label">Grading Sheet</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/teacher/behaviour')}>
                  <span className="quick-action-icon">⭐</span>
                  <span className="quick-action-label">Behaviour Logs</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="widget-section">
            <Card title="Recent Activities Logs">
              <div className="activity-feed">
                {recentActivities.map((act) => (
                  <div className={`activity-item ${act.category}`} key={act.id}>
                    <div className="activity-icon-wrapper">
                      {act.category === 'success' ? '🏆' : act.category === 'warning' ? '⚠️' : '📝'}
                    </div>
                    <div className="activity-details">
                      <div className="activity-header">
                        <span className="activity-title">{act.title}</span>
                        <span className="activity-time">{act.time}</span>
                      </div>
                      <p className="activity-desc">{act.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  };

  // 3. PARENT DASHBOARD VIEW
  const renderParentDashboard = () => {
    const { stats, childDetails, teacherFeedback } = data;
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <img src={childDetails.avatar} alt="Child Profile" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONITORED STUDENT PROFILE:</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{childDetails.name} &bull; <span className="text-primary-color">{childDetails.designation}</span></h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll Number: {childDetails.rollNumber} &bull; Overall Attendance: {childDetails.attendancePercent}</span>
          </div>
        </div>

        <div className="dashboard-grid cols-3">
          <Card variant="stats" label="Child Attendance" number={stats.childAttendance.value} icon="📅" trend={{ direction: 'up', value: 'Excellent', label: 'standing' }} onClick={() => navigate('/parent/attendance')} />
          <Card variant="stats" label="Math Quiz 2" number={stats.childLatestMark.value} icon="🏆" onClick={() => navigate('/parent/marks')} />
          <Card variant="stats" label="Conduct Index" number={stats.behaviourPoints.value} icon="⭐" trend={{ direction: 'up', value: 'Positive', label: 'observation rating' }} onClick={() => navigate('/parent/behaviour')} />
        </div>

        <div className="dashboard-layout-main">
          {/* Main Area */}
          <div className="widget-section">
            <Card title="Teacher Observations & Feedback">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {teacherFeedback.map((fb, idx) => (
                  <div key={idx} className="notice-card" style={{ padding: '1.25rem', borderLeftColor: 'var(--secondary)' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{fb.teacher} ({fb.subject})</strong>
                      <span className="notice-date">{fb.date}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.45 }}>
                      "{fb.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="widget-section">
            <Card title="Quick Guardian Actions">
              <div className="quick-actions-grid" style={{ gridTemplateColumns: '1fr' }}>
                <button className="quick-action-btn" onClick={() => navigate('/parent/attendance')}>
                  <span className="quick-action-icon">📅</span>
                  <span className="quick-action-label">Review Child Attendance</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/parent/marks')}>
                  <span className="quick-action-icon">🏆</span>
                  <span className="quick-action-label">Check Exam Report</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/parent/complaints')}>
                  <span className="quick-action-icon">⚠️</span>
                  <span className="quick-action-label">Log Ticket or Complaint</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  };

  // 4. STUDENT DASHBOARD VIEW
  const renderStudentDashboard = () => {
    const { stats, recentFeedback } = data;
    return (
      <>
        <div className="dashboard-grid cols-3">
          <Card variant="stats" label="Overall Attendance" number={stats.attendance.value} icon="📅" onClick={() => navigate('/student/attendance')} />
          <Card variant="stats" label="Current GPA" number={stats.academicGPA.value} icon="🏆" onClick={() => navigate('/student/marks')} />
          <Card variant="stats" label="Conduct Index" number={stats.conductScore.value} icon="⭐" onClick={() => navigate('/student/behaviour')} />
        </div>

        <div className="dashboard-layout-main">
          {/* Main Area */}
          <div className="widget-section">
            <Card title="My Academic Growth Track">
              <div style={{ padding: '1rem 0' }}>
                <LineChart
                  data={[78, 85, 82, 90, 88, 95]}
                  labels={['Assignment 1', 'Monthly Quiz', 'Midterm A', 'Lab Work', 'Essay Prep', 'Quiz 2']}
                  height={220}
                  color="var(--primary)"
                />
              </div>
            </Card>

            <Card title="Quick Student Actions">
              <div className="quick-actions-grid">
                <button className="quick-action-btn" onClick={() => navigate('/student/attendance')}>
                  <span className="quick-action-icon">📅</span>
                  <span className="quick-action-label">My Attendance</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/student/marks')}>
                  <span className="quick-action-icon">🏆</span>
                  <span className="quick-action-label">View My Marks</span>
                </button>
                <button className="quick-action-btn" onClick={() => navigate('/student/announcements')}>
                  <span className="quick-action-icon">📢</span>
                  <span className="quick-action-label">School Notices</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="widget-section">
            <Card title="Conduct Points Timeline">
              <div className="activity-feed">
                {recentFeedback.map((fb, idx) => (
                  <div className={`activity-item ${fb.points.startsWith('+') ? 'success' : 'danger'}`} key={idx}>
                    <div className="activity-icon-wrapper" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {fb.points.startsWith('+') ? '★' : '⚠'}
                    </div>
                    <div className="activity-details">
                      <div className="activity-header">
                        <span className="activity-title">{fb.title}</span>
                        <span className="activity-time">{fb.date}</span>
                      </div>
                      <p className="activity-desc">{fb.text}</p>
                      <span className="badge badge-primary" style={{
                        marginTop: '0.5rem',
                        backgroundColor: fb.points.startsWith('+') ? 'var(--success-light)' : 'var(--danger-light)',
                        color: fb.points.startsWith('+') ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {fb.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  };

  const handleLockSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = await api.updateTeacherProfileSelf({ subject: subjectLockInput });
      setTeacherProfile(updatedProfile);
      setShowSubjectModal(false);
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to configure instructor subject.');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>WORKSPACE</span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
          Welcome back, {user.name}!
        </h2>
      </div>

      {user.role === 'admin' && renderAdminDashboard()}
      {user.role === 'teacher' && renderTeacherDashboard()}
      {user.role === 'parent' && renderParentDashboard()}
      {user.role === 'student' && renderStudentDashboard()}

      {/* Subject Prompt modal right after login */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => {}} // Secure: forces the user to lock it in
        title="Privacy Configuration - Core Subject Lock-In"
        footerActions={
          <Button variant="primary" onClick={handleLockSubjectSubmit}>Lock In Subject & Proceed</Button>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Welcome to EduBridge! To enforce student confidentiality and strict privacy compliance, please select your primary instructional subject area. This locks your classroom schedules, attendance sheets, grading book, and assigned homework logs to only show records under this division.
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

export default Dashboard;
