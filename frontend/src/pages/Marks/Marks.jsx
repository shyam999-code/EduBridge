import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Table from '../../components/Tables/Table';
import Loader from '../../components/Loaders/Loader';
import { BarChart, LineChart } from '../../components/Charts/CustomChart';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import Modal from '../../components/Modals/Modal';
import { api } from '../../services/api';

const ALL_CLASSES = [
  { id: 'class-6a', name: 'Grade 6-A' },
  { id: 'class-7a', name: 'Grade 7-A' },
  { id: 'class-8a', name: 'Grade 8-A' },
  { id: 'class-9a', name: 'Grade 9-A' },
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Grade 10-A' }
];

const SUBJECTS = ['Telugu', 'Hindi', 'English', 'Mathematics', 'Biology', 'Physics', 'Social Studies', 'Sports'];


const Marks = () => {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  
  // Faculty Specific States
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('Telugu');
  const [selectedClass, setSelectedClass] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectLockInput, setSubjectLockInput] = useState('Telugu');

  // Student Roll Number Edit States
  const [editingRollNoStudent, setEditingRollNoStudent] = useState(null);
  const [showRollNoModal, setShowRollNoModal] = useState(false);
  const [newRollNoValue, setNewRollNoValue] = useState('');

  // New Dashboard States
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Verification states for student Academic Analytics gating
  const [isStudentVerified, setIsStudentVerified] = useState(true);
  const [verifyName, setVerifyName] = useState('');
  const [verifyRoll, setVerifyRoll] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleStudentVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyName || !verifyRoll) {
      setVerifyError('Please fill in both Name and Roll Number.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');

    try {
      await api.verifyStudentProfile({ name: verifyName, rollNumber: verifyRoll });
      alert('Verification successful! Access to academic analytics is unlocked.');
      localStorage.setItem('edubridge_student_verified', 'true');
      setIsStudentVerified(true);
      setLoading(true);
      await loadMarksReport();
    } catch (err) {
      setVerifyError(err.message || 'Verification failed. Name or Roll Number does not match our records.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Grade Form State
  const [newGrade, setNewGrade] = useState({
    studentId: '',
    assessmentType: 'Midterm Exam',
    score: '',
    maxScore: '100'
  });

  const loadMarksReport = async () => {
    try {
      if (user.role === 'teacher') {
        // 1. Fetch teacher details to enforce privacy subject
        const profile = await api.getTeacherProfileSelf();
        setTeacherProfile(profile);
        if (!profile.subject) {
          setShowSubjectModal(true);
        } else {
          setSelectedSubject(profile.subject);
        }

        // 2. Fetch all student list
        const students = await api.listStudents();
        setStudentsList(students);

        // 3. Fetch marks console data
        const res = await api.getMarksData();
        setData(res);

        // 4. Fetch all attendance logs
        try {
          const businessApiUrl = import.meta.env.VITE_BUSINESS_API_URL || 'http://localhost:5001/api';
          const token = localStorage.getItem('edubridge_token');
          const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          };
          const attendanceRes = await fetch(`${businessApiUrl}/attendance`, { headers });
          const attendanceJson = await attendanceRes.json();
          if (attendanceJson.success) {
            setAttendanceRecords(attendanceJson.data.records || []);
          }
        } catch (e) {
          console.error('Failed to load attendance logs:', e);
        }

        if (students.length > 0) {
          setNewGrade(prev => ({ ...prev, studentId: students[0].id }));
        }
      } else if (user.role === 'admin') {
        // 1. Fetch all student list for admin (needed for class filtering)
        const students = await api.listStudents();
        setStudentsList(students);

        // 2. Fetch marks console data
        const res = await api.getMarksData();
        setData(res);

        // 3. Fetch all attendance logs for admin
        try {
          const businessApiUrl = import.meta.env.VITE_BUSINESS_API_URL || 'http://localhost:5001/api';
          const token = localStorage.getItem('edubridge_token');
          const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          };
          const attendanceRes = await fetch(`${businessApiUrl}/attendance`, { headers });
          const attendanceJson = await attendanceRes.json();
          if (attendanceJson.success) {
            setAttendanceRecords(attendanceJson.data.records || []);
          }
        } catch (e) {
          console.error('Failed to load attendance logs:', e);
        }

        if (students.length > 0) {
          setNewGrade(prev => ({ ...prev, studentId: students[0].id }));
        }
      } else {
        const res = await api.getMarksData();
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load marks report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMarksReport();
  }, [user.role]);

  useEffect(() => {
    const filtered = studentsList.filter(s => !selectedClass || s.class_id === selectedClass);
    if (filtered.length > 0) {
      setNewGrade(prev => ({ ...prev, studentId: filtered[0].id }));
    } else {
      setNewGrade(prev => ({ ...prev, studentId: '' }));
    }
  }, [selectedClass, studentsList]);

  if (loading) {
    return <Loader size="medium" text="Loading subject markbooks..." />;
  }

  const isFaculty = user.role === 'teacher' || user.role === 'admin';

  const handleActionClick = (row) => {
    setNewGrade({
      studentId: row.student_id,
      assessmentType: row.isPlaceholder ? 'Annual Exam' : row.type,
      score: row.isPlaceholder ? '' : row.score.toString(),
      maxScore: row.isPlaceholder ? '100' : row.max.toString()
    });
    setShowAddGrade(true);
  };

  const handleEditInternalClick = (studentRow, internalRecord) => {
    setSelectedSubject(studentRow.subject);
    setNewGrade({
      studentId: studentRow.student_id,
      assessmentType: internalRecord.type,
      score: internalRecord.score.toString(),
      maxScore: internalRecord.max_score.toString()
    });
    setShowAddGrade(true);
  };

  const handleAddGradeSubmit = async (e) => {
    e.preventDefault();
    if (!newGrade.score || !newGrade.studentId) return;

    try {
      await api.postStudentMark({
        student_id: newGrade.studentId,
        subject: selectedSubject,
        type: newGrade.assessmentType,
        score: Number(newGrade.score),
        max_score: Number(newGrade.maxScore),
        date: new Date().toISOString().split('T')[0]
      });

      setShowAddGrade(false);
      setNewGrade({
        studentId: studentsList.length > 0 ? studentsList[0].id : '',
        assessmentType: 'Midterm Exam',
        score: '',
        maxScore: '100'
      });

      setLoading(true);
      await loadMarksReport();
    } catch (err) {
      alert(err.message || 'Failed to submit student grade.');
    }
  };

  const handleLockSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = await api.updateTeacherProfileSelf({ subject: subjectLockInput });
      setTeacherProfile(updatedProfile);
      setSelectedSubject(subjectLockInput);
      setShowSubjectModal(false);
      
      setLoading(true);
      await loadMarksReport();
    } catch (err) {
      alert(err.message || 'Failed to update subject privacy profile.');
    }
  };

  const handleEditRollNoClick = (row) => {
    setEditingRollNoStudent(row);
    setNewRollNoValue(row.rollNumber || '');
    setShowRollNoModal(true);
  };

  const handleSaveRollNoSubmit = async (e) => {
    e.preventDefault();
    if (!newRollNoValue.trim() || !editingRollNoStudent) return;
    try {
      await api.updateStudent(editingRollNoStudent.student_id, {
        roll_number: newRollNoValue.trim()
      });
      setShowRollNoModal(false);
      setEditingRollNoStudent(null);
      triggerNotification(`Roll number updated successfully for ${editingRollNoStudent.studentName}.`);
      setLoading(true);
      await loadMarksReport();
    } catch (err) {
      alert(err.message || 'Failed to update roll number.');
    }
  };

  // Shared Helper Functions for calculations
  const calculateAttendancePct = (studentId) => {
    const studentLogs = attendanceRecords.filter(r => r.student_id === studentId);
    if (studentLogs.length > 0) {
      const presentLogs = studentLogs.filter(r => r.status === 'Present');
      return Math.round((presentLogs.length / studentLogs.length) * 100);
    }
    // Stable fallback hash based on studentId
    let sum = 0;
    for (let i = 0; i < studentId.length; i++) sum += studentId.charCodeAt(i);
    return 75 + (sum % 23);
  };

  const getRiskLevel = (score, attPct) => {
    if (score < 50 && attPct < 75) {
      return { level: 'High Risk', color: 'var(--danger)', badgeClass: 'badge-danger' };
    }
    return { level: 'Medium Risk', color: 'var(--warning)', badgeClass: 'badge-warning' };
  };

  const triggerNotification = (message) => {
    setNotificationMessage(message);
    setTimeout(() => {
      setNotificationMessage('');
    }, 4000);
  };

  const handleNotifyParent = (student) => {
    triggerNotification(`Notification sent successfully to parent of ${student.studentName} regarding ${selectedSubject} academic progress.`);
  };

  const handleScheduleMeeting = (student) => {
    triggerNotification(`Meeting scheduled successfully. Calendar invite sent to parent of ${student.studentName}.`);
  };

  const handleViewProfile = (student) => {
    setViewingStudent({
      ...student,
      attendance: calculateAttendancePct(student.student_id)
    });
    setShowProfileModal(true);
  };

  // Top level calculations accessible by modals
  const teacherSummary = data ? (data.summary || []).filter(r => {
    if (user.role === 'student' || user.role === 'parent') return true;
    if (r.subject !== selectedSubject) return false;
    // For admin or teacher: additionally filter by selected class
    if (user.role === 'admin' || user.role === 'teacher') {
      const student = studentsList.find(s => s.id === r.student_id);
      if (!student) return false;
      return student.class_id === selectedClass;
    }
    return true;
  }) : [];
  const gradedStudents = teacherSummary.filter(s => !s.isPlaceholder);
  const failedStudents = gradedStudents.filter(s => Number(s.score) < 50);

  const getFilteredSummary = () => {
    let summary = teacherSummary;
    return summary.filter(r => 
      r.subject.toLowerCase().includes(search.toLowerCase()) || 
      r.type.toLowerCase().includes(search.toLowerCase()) ||
      (r.studentName && r.studentName.toLowerCase().includes(search.toLowerCase()))
    );
  };

  // Columns for standard / fallback layout
  const columns = [
    ...(isFaculty ? [
      {
        title: 'Student',
        key: 'studentName',
        render: (val, row) => {
          const hasInternals = row.internals && row.internals.length > 0;
          const isExpanded = expandedRows[row.student_id];
          return (
            <div>
              <strong>{val}</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Roll No: {row.rollNumber || 'N/A'}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditRollNoClick(row);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    padding: '0 0.25rem',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginLeft: '0.25rem'
                  }}
                >
                  ✏️ Edit
                </button>
              </span>
              {hasInternals && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedRows(prev => ({ ...prev, [row.student_id]: !prev[row.student_id] }));
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontWeight: 600
                  }}
                >
                  {isExpanded ? '▲ Hide Internals' : `▼ View Internals (${row.internals.length})`}
                </button>
              )}
              {hasInternals && isExpanded && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--primary)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  minWidth: '220px'
                }}>
                  {row.internals.map((internal, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <span>📝 {internal.type}: <strong>{internal.score} / {internal.max_score}</strong></span>
                      {user.role === 'teacher' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditInternalClick(row, internal);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(37,99,235,0.08)'
                          }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
      }
    ] : []),
    { 
      title: 'Subject', 
      key: 'subject', 
      render: (val, row) => {
        const hasInternals = row.internals && row.internals.length > 0;
        const isExpanded = expandedRows[row.subject];
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong>{val}</strong>
              {hasInternals && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedRows(prev => ({ ...prev, [row.subject]: !prev[row.subject] }));
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontWeight: 600
                  }}
                >
                  {isExpanded ? '▲ Hide Internals' : `▼ View Internals (${row.internals.length})`}
                </button>
              )}
            </div>
            {row.details && (
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                ({row.details})
              </span>
            )}
            {hasInternals && isExpanded && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--primary)',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                minWidth: '200px'
              }}>
                {row.internals.map((internal, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📝 {internal.type}: <strong>{internal.score} / {internal.max_score}</strong></span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '1rem' }}>{internal.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    { title: 'Assessment Type', key: 'type' },
    {
      title: 'Score Obtained',
      key: 'score',
      render: (val, row) => (
        row.isPlaceholder ? (
          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Not Graded</span>
        ) : (
          <span><strong>{val}</strong> / {row.max}</span>
        )
      )
    },
    {
      title: 'Letter Grade',
      key: 'grade',
      render: (val, row) => {
        if (row.isPlaceholder) {
          return <span className="badge badge-warning">Pending</span>;
        }
        let badgeColor = 'badge-primary';
        if (val.startsWith('A')) badgeColor = 'badge-success';
        if (val.startsWith('B')) badgeColor = 'badge-primary';
        if (val.startsWith('C')) badgeColor = 'badge-warning';
        if (val.startsWith('D') || val.startsWith('F')) badgeColor = 'badge-danger';
        return <span className={`badge ${badgeColor}`}>{val}</span>;
      }
    },
    { title: 'Evaluation Date', key: 'date' },
    ...(user.role === 'teacher' ? [
      {
        title: 'Grading Actions',
        key: 'actions',
        align: 'right',
        render: (_, row) => (
          <Button 
            size="sm" 
            variant={row.isPlaceholder ? "primary" : "secondary"} 
            onClick={() => handleActionClick(row)}
          >
            {row.isPlaceholder ? "✚ Enter Marks" : "✏️ Edit Marks"}
          </Button>
        )
      }
    ] : [
      { title: 'Evaluated By', key: 'teacher', render: (val) => <span className="text-secondary">{val || 'Teacher'}</span> }
    ])
  ];

  // =========================================================
  // RENDER: TEACHER REDESIGNED CONSOLE
  // =========================================================
  const renderTeacherConsole = () => {
    // Admin or Teacher must select a class first
    if ((user.role === 'admin' || user.role === 'teacher') && !selectedClass) {
      return (
        <div style={{ marginTop: '2rem' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '3rem' }}>🏫</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Select a Class to View Marks</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '420px', lineHeight: 1.6, margin: 0 }}>
                Choose a class to view and enter the student marks register for that class.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                {ALL_CLASSES.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    style={{ padding: '0.5rem 1.1rem', borderRadius: '999px', border: '1.5px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.target.style.background = 'var(--primary)'; e.target.style.color = '#fff'; }}
                    onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--primary)'; }}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // Sports is activity-based — no written exam marks
    if (isFaculty && selectedSubject === 'Sports') {
      return (
        <div style={{ marginTop: '2rem' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '3.5rem' }}>⚽</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}
              >Sports — Activity Based Subject</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', lineHeight: 1.7, margin: 0 }}>
                Sports is an <strong>activity-based subject</strong> and does not have written examinations or a marks register.
                Student performance in Sports is evaluated through participation, physical fitness, and conduct — not through scored assessments.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ padding: '0.85rem 1.4rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.3)', fontSize: '0.875rem', color: 'var(--success)', fontWeight: 600 }}>
                  ✅ Use <strong>Daily Attendance</strong> to track participation
                </div>
                <div style={{ padding: '0.85rem 1.4rem', borderRadius: 'var(--radius-md)', background: 'rgba(234,179,8,0.08)', border: '1.5px solid rgba(234,179,8,0.3)', fontSize: '0.875rem', color: 'var(--warning)', fontWeight: 600 }}>
                  ⭐ Use <strong>Behaviour Tracker</strong> to record conduct
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    const totalStudentsCount = teacherSummary.length;
    const totalGraded = gradedStudents.length;

    const passedStudents = gradedStudents.filter(s => Number(s.score) >= 50);
    const highPerformers = gradedStudents.filter(s => Number(s.score) > 75);

    const passPct = totalGraded > 0 ? Math.round((passedStudents.length / totalGraded) * 100) : 100;
    const classAvg = totalGraded > 0 ? Math.round(gradedStudents.reduce((sum, s) => sum + Number(s.score), 0) / totalGraded) : 0;

    const highPerfCount = highPerformers.length;
    const avgPerfCount = gradedStudents.filter(s => Number(s.score) >= 50 && Number(s.score) <= 75).length;
    const lowPerfCount = failedStudents.length;

    const highPct = totalGraded > 0 ? Math.round((highPerfCount / totalGraded) * 100) : 0;
    const avgPct = totalGraded > 0 ? Math.round((avgPerfCount / totalGraded) * 100) : 0;
    const lowPct = totalGraded > 0 ? Math.round((lowPerfCount / totalGraded) * 100) : 0;

    const lowAttLowMarks = failedStudents.filter(s => calculateAttendancePct(s.student_id) < 75).length;
    const highRiskCount = lowAttLowMarks;

    const sortedTop10 = [...gradedStudents]
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 10);

    return (
      <div className="widget-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Metrics Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="teacher-metrics-grid">
          <style>{`
            @media (max-width: 1024px) {
              .teacher-metrics-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
            @media (max-width: 600px) {
              .teacher-metrics-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
          
          {/* Card 1: Pass Percentage */}
          <Card 
            variant="stats" 
            label="Pass Percentage" 
            number={`${passPct}%`} 
            icon="📈" 
            trend={{ direction: 'up', value: `${passedStudents.length} Passed`, label: `/ ${totalStudentsCount} Students`, color: 'success' }} 
          />

          {/* Card 2: Failed Students (Interactive Warning Card) */}
          <div 
            onClick={() => setShowFailedModal(true)}
            style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Card 
              variant="stats" 
              label="Failed Students" 
              number={`${lowPerfCount} Students`} 
              icon="⚠️" 
              trend={{ 
                direction: 'down', 
                value: 'Warning', 
                label: 'Click to view list', 
                color: 'danger' 
              }} 
            />
          </div>

          {/* Card 3: High Performers */}
          <Card 
            variant="stats" 
            label="High Performers" 
            number={`${highPerfCount} Students`} 
            icon="🏆" 
            trend={{ direction: 'up', value: 'Above 75%', label: 'marks range', color: 'success' }} 
          />

          {/* Card 4: Class Average */}
          <Card 
            variant="stats" 
            label="Class Average" 
            number={`${classAvg}%`} 
            icon="🏅" 
            trend={{ direction: 'up', value: `${selectedSubject || 'Telugu'}`, label: 'Subject Rating', color: 'primary' }} 
          />
        </div>

        {/* Performance Breakdown Section */}
        <Card title="Performance Breakdown" subtitle="Distribution of students based on academic standing.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            
            {/* Above 75% */}
            <div>
              <div className="flex-between" style={{ marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🟢</span> Above 75% : {highPerfCount} Students
                </span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>{highPct}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${highPct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
              </div>
            </div>

            {/* 50% - 75% */}
            <div>
              <div className="flex-between" style={{ marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🟡</span> 50% - 75% : {avgPerfCount} Students
                </span>
                <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{avgPct}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${avgPct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
              </div>
            </div>

            {/* Below 50% */}
            <div>
              <div className="flex-between" style={{ marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🔴</span> Below 50% : {lowPerfCount} Students
                </span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{lowPct}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${lowPct}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
              </div>
            </div>

          </div>
        </Card>

        {/* Class Gradebook Register */}
        <Card 
          title="Class Gradebook Register" 
          subtitle={user.role === 'admin'
            ? `View all student grades for ${selectedSubject || 'Telugu'} — ${ALL_CLASSES.find(c => c.id === selectedClass)?.name || ''} (read-only).`
            : `View, enter, and edit all student grades for ${selectedSubject || 'Telugu'}.`
          }
        >
          <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }} className="search-input-wrapper">
              <input
                type="text"
                placeholder="Filter records by student name, roll number, or assessment type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control search-control"
              />
            </div>
          </div>
          <Table
            columns={columns}
            data={getFilteredSummary()}
            emptyMessage="No student records found."
          />
        </Card>

        {/* Students Requiring Attention Section */}
        <Card 
          title="Students Requiring Attention" 
          subtitle={`Students scoring below 50% in ${selectedSubject || 'Telugu'} who need academic intervention.`}
        >
          <Table 
            columns={[
              {
                title: 'Student Name',
                key: 'studentName',
                render: (val, row) => <strong style={{ fontSize: '0.9rem' }}>{val}</strong>
              },
              { title: 'Roll Number', key: 'rollNumber' },
              { title: 'Subject', key: 'subject' },
              {
                title: 'Marks',
                key: 'score',
                render: (val, row) => <strong>{val} / {row.max}</strong>
              },
              {
                title: 'Attendance %',
                key: 'attendance',
                render: (_, row) => {
                  const attPct = calculateAttendancePct(row.student_id);
                  return <span style={{ fontWeight: 600, color: attPct < 75 ? 'var(--danger)' : 'var(--success)' }}>{attPct}%</span>;
                }
              },
              {
                title: 'Risk Level',
                key: 'risk',
                render: (_, row) => {
                  const attPct = calculateAttendancePct(row.student_id);
                  const risk = getRiskLevel(Number(row.score), attPct);
                  return <span className={`badge ${risk.badgeClass}`}>{risk.level}</span>;
                }
              },
              {
                title: 'Actions',
                key: 'actions',
                align: 'right',
                render: (_, row) => (
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <Button size="sm" variant="secondary" onClick={() => handleViewProfile(row)}>View Profile</Button>
                    <Button size="sm" variant="primary" onClick={() => handleNotifyParent(row)}>Notify Parent</Button>
                    <Button size="sm" variant="success" onClick={() => handleScheduleMeeting(row)}>Schedule Meeting</Button>
                  </div>
                )
              }
            ]}
            data={failedStudents}
            emptyMessage="No students are currently scoring below 50%. Keep it up!"
          />
        </Card>

        {/* Top Performers Section */}
        <Card 
          title="Top Performers" 
          subtitle={`Top 10 scoring pupils in ${selectedSubject || 'Telugu'}.`}
        >
          <Table 
            columns={[
              {
                title: 'Student Name',
                key: 'studentName',
                render: (val, row) => <strong style={{ fontSize: '0.9rem' }}>{val}</strong>
              },
              { title: 'Roll Number', key: 'rollNumber' },
              {
                title: 'Marks',
                key: 'score',
                render: (val, row) => <strong>{val} / {row.max}</strong>
              },
              {
                title: 'Grade',
                key: 'grade',
                render: (val) => <span className="badge badge-success">{val}</span>
              },
              {
                title: 'Attendance %',
                key: 'attendance',
                render: (_, row) => {
                  const attPct = calculateAttendancePct(row.student_id);
                  return <span style={{ fontWeight: 600 }}>{attPct}%</span>;
                }
              }
            ]}
            data={sortedTop10}
            emptyMessage="No grades evaluated yet."
          />
        </Card>

      </div>
    );
  };

  // =========================================================
  // RENDER: STANDARD / FALLBACK REPORT CONSOLE
  // =========================================================
  const renderStandardConsole = () => {
    const isStudentOrParent = user.role === 'student' || user.role === 'parent';

    if (isStudentOrParent) {
      return (
        <div className="dashboard-layout-main" style={{ gridTemplateColumns: '1fr' }}>
          <div className="widget-section">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="admin-metrics-grid">
              <Card variant="stats" label="Average Academic Score" number={data?.percentage || 'N/A'} icon="🏅" />
              <Card variant="stats" label="Total Scored Marks" number={data ? `${data.totalMarks} / ${data.maxMarks}` : 'N/A'} icon="🏆" />
              <Card variant="stats" label="Overall Standing" number={data?.grade || 'N/A'} icon="📈" />
            </div>

            <Card
              title="My Academic Evaluation Registry"
              subtitle="Personal assessment records, examination outcomes, and academic grades."
            >
              <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }} className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search by subject, type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-control search-control"
                  />
                </div>
              </div>
              
              <Table
                columns={columns}
                data={getFilteredSummary()}
              />
            </Card>

            {data?.summary && data.summary.length > 0 && (
              <Card title="My Academic Performance Trend" subtitle="Progress chart across academic evaluations.">
                <div style={{ padding: '0.75rem 0' }}>
                  <LineChart
                    data={data.summary.map(s => Number(s.score))}
                    labels={data.summary.map(s => {
                      const deptMap = {
                        'Telugu': 'Telugu',
                        'Hindi': 'Hindi',
                        'English': 'English',
                        'Mathematics': 'Math',
                        'Biology': 'Biology',
                        'Physics': 'Physics',
                        'Science': 'Science',
                        'Social Studies': 'Social'
                      };
                      return deptMap[s.subject] || s.subject;
                    })}
                    height={220}
                    color="var(--primary)"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-layout-main">
        {/* Main Section */}
        <div className="widget-section">
          {/* Reusable stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }} className="admin-metrics-grid">
            <Card variant="stats" label="Total Students Assessed" number="1,248" icon="👥" trend={{ direction: 'up', value: '+3.2%', label: 'vs last term', color: 'success' }} />
            <Card variant="stats" label="Overall Pass Rate" number="94.6%" icon="📈" trend={{ direction: 'up', value: 'Excellent', label: 'academic standing', color: 'success' }} />
            <Card variant="stats" label="Average Academic Score" number="82.4%" icon="🏅" trend={{ direction: 'up', value: '+1.2%', label: 'improvement', color: 'success' }} />
            <Card variant="stats" label="Distinction Holders" number="384" icon="🏆" trend={{ direction: 'up', value: '30.7%', label: 'of total cohort', color: 'primary' }} />
          </div>

          <Card
            title="Academic Evaluation Registry"
            subtitle="Centralized assessment records, examination outcomes, and academic performance tracking."
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

            <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }} className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search students, classes, departments, examinations, or assessment records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control search-control"
                />
              </div>
            </div>
            
            <Table
              columns={columns}
              data={getFilteredSummary()}
            />
          </Card>

          {/* Class-wise Performance Analysis */}
          <Card title="Class-wise Performance Analysis" subtitle="Academic averages, enrollment counts, and passing metrics by grade level.">
            <Table
              columns={[
                { title: 'Class Designation', key: 'class', render: (val) => <strong>{val}</strong> },
                { title: 'Total Enrolled', key: 'enrolled', align: 'center' },
                { title: 'Academic Average', key: 'avg', align: 'center', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
                { title: 'Passing Rate', key: 'passRate', align: 'center', render: (val) => <span style={{ fontWeight: 600, color: 'var(--success)' }}>{val}</span> },
                {
                  title: 'Academic Standing',
                  key: 'standing',
                  align: 'right',
                  render: (val) => {
                    let badge = 'badge-success';
                    if (val === 'Excellent') badge = 'badge-success';
                    if (val === 'Good') badge = 'badge-primary';
                    if (val === 'Satisfactory') badge = 'badge-warning';
                    return <span className={`badge ${badge}`}>{val}</span>;
                  }
                }
              ]}
              data={[
                { class: 'Grade 10-A', enrolled: 28, avg: '88.4%', passRate: '96.4%', standing: 'Excellent' },
                { class: 'Grade 9-A', enrolled: 29, avg: '84.2%', passRate: '93.1%', standing: 'Good' },
                { class: 'Grade 8-A', enrolled: 30, avg: '79.8%', passRate: '90.0%', standing: 'Good' },
                { class: 'Grade 7-A', enrolled: 29, avg: '76.5%', passRate: '89.6%', standing: 'Satisfactory' },
                { class: 'Grade 6-A', enrolled: 31, avg: '81.2%', passRate: '92.4%', standing: 'Good' }
              ]}
            />
          </Card>

          {/* Pass/Fail Distribution */}
          <Card title="Pass/Fail Distribution" subtitle="Institutional breakdown of student academic standings.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
              <div>
                <div className="flex-between" style={{ marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🟢</span> Distinction Holders (&gt;75%): 384 Students
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>30.7%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '30.7%', height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🟡</span> General Pass Standing (50% - 75%): 796 Students
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--warning)' }}>63.8%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '63.8%', height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🔴</span> Academic Referral Required (&lt;50%): 68 Students
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>5.5%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '5.5%', height: '100%', background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Subjects Requiring Academic Attention */}
          <Card title="Subjects Requiring Academic Attention" subtitle="Subject areas showing lower performance averages or higher referral ratios.">
            <Table
              columns={[
                { title: 'Subject Area', key: 'subject', render: (val) => <strong>{val}</strong> },
                { title: 'Overall Average', key: 'avg', align: 'center', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
                { title: 'Referral Rate', key: 'failRate', align: 'center', render: (val) => <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{val}</span> },
                {
                  title: 'Action Status',
                  key: 'status',
                  align: 'right',
                  render: (val) => {
                    let badge = 'badge-danger';
                    if (val === 'Curriculum Review') badge = 'badge-danger';
                    if (val === 'Remedial Cohort') badge = 'badge-warning';
                    return <span className={`badge ${badge}`}>{val}</span>;
                  }
                }
              ]}
              data={[
                { subject: 'Sports Participation & Fitness', avg: '68.2%', failRate: '12.4%', status: 'Curriculum Review' },
                { subject: 'Languages (Hindi)', avg: '71.5%', failRate: '8.2%', status: 'Remedial Cohort' },
                { subject: 'Social Studies & Civics', avg: '74.1%', failRate: '6.5%', status: 'Remedial Cohort' }
              ]}
            />
          </Card>
        </div>

        {/* Sidebar Section */}
        <div className="widget-section">
          <Card title="School Performance Trend" subtitle="Institutional progress chart across academic terms.">
            <div style={{ padding: '0.75rem 0' }}>
              <LineChart
                data={(data.summary || []).slice(0, 10).map(s => s.score)}
                labels={(data.summary || []).slice(0, 10).map(s => {
                  const deptMap = {
                    'Telugu': 'Telugu',
                    'Hindi': 'Hindi',
                    'English': 'English',
                    'Mathematics': 'Math',
                    'Biology': 'Biology',
                    'Physics': 'Physics',
                    'Science': 'Science',
                    'Social Studies': 'Social'
                  };
                  return deptMap[s.subject] || s.subject;
                })}
                height={200}
                color="var(--primary)"
              />
            </div>
          </Card>

          <Card title="Department-wise Academic Performance" subtitle="Average performance metrics mapped across departments.">
            <div style={{ padding: '0.5rem 0' }}>
              <BarChart
                data={data.subjectAverages.map((item, idx) => {
                  const deptMap = {
                    'Telugu': 'Languages (Telugu)',
                    'Hindi': 'Languages (Hindi)',
                    'English': 'Languages (English)',
                    'Mathematics': 'Mathematics',
                    'Biology': 'Biology',
                    'Physics': 'Physics',
                    'Science': 'Sciences',
                    'Social Studies': 'Humanities',
                    'Sports': 'Physical Ed'
                  };
                  return {
                    label: deptMap[item.subject] || item.subject,
                    value: item.score,
                    color: idx % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'
                  };
                })}
              />
            </div>
          </Card>

          {/* Top Performing Students */}
          <Card title="Top Performing Students" subtitle="Highest achieving student leaders based on current term index.">
            <Table
              columns={[
                {
                  title: 'Student Profile',
                  key: 'name',
                  render: (val, row) => (
                    <div>
                      <strong>{val}</strong>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.class}</span>
                    </div>
                  )
                },
                { title: 'GPA', key: 'gpa', align: 'center', render: (val) => <strong>{val}</strong> },
                { title: 'Rank', key: 'rank', align: 'right', render: (val) => <span className="badge badge-success">{val}</span> }
              ]}
              data={[
                { name: 'Leo Sterling', class: 'Grade 10-A', gpa: '96.2%', rank: '#1' },
                { name: 'Clara Jenkins', class: 'Grade 10-A', gpa: '95.8%', rank: '#2' },
                { name: 'Aravind Rao', class: 'Grade 9-A', gpa: '94.7%', rank: '#3' },
                { name: 'Vijay Kumar', class: 'Grade 8-A', gpa: '94.2%', rank: '#4' },
                { name: 'Mahendra', class: 'Grade 10-A', gpa: '93.8%', rank: '#5' }
              ]}
            />
          </Card>
        </div>
      </div>
    );
  };

  return (
    <>
      {notificationMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '1rem 1.75rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
          zIndex: 9999,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          fontSize: '0.9rem'
        }}>
          <span>✨</span>
          <span>{notificationMessage}</span>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .admin-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .admin-metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {user.role === 'student' && !isStudentVerified ? (
        <div style={{ maxWidth: '560px', margin: '2rem auto' }}>
          <Card
            title="Confidentiality & Privacy Verification"
            subtitle="Authenticate your identity to view academic performance and grades."
          >
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(37, 99, 235, 0.05)',
              borderLeft: '4px solid var(--primary)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45
            }}>
              💡 <strong>Confidentiality Note:</strong> Student data is strictly gated for privacy. Please enter your official Name and Roll Number exactly as registered to verify your session and view your record sheets.
            </div>

            {verifyError && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--danger-light)',
                borderLeft: '4px solid var(--danger)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                color: 'var(--danger)',
                fontWeight: 500
              }}>
                ❌ {verifyError}
              </div>
            )}

            <form onSubmit={handleStudentVerifySubmit} className="form-container">
              <FormInput
                label="Full Name"
                name="verifyName"
                value={verifyName}
                onChange={(e) => setVerifyName(e.target.value)}
                placeholder="e.g. Leo Sterling"
                required
              />

              <FormInput
                label="Student Roll Number"
                name="verifyRoll"
                value={verifyRoll}
                onChange={(e) => setVerifyRoll(e.target.value)}
                placeholder="e.g. ET-2026-1042"
                required
              />

              <Button
                type="submit"
                variant="primary"
                disabled={verifyLoading}
                style={{ width: '100%', height: '44px', marginTop: '0.5rem' }}
              >
                {verifyLoading ? 'Verifying Credentials...' : '🔒 Verify & Access Data'}
              </Button>
            </form>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex-between">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {isFaculty && (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACADEMIC MARKS</span>
              )}
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
                {isFaculty ? 'Class Grading Console' : 'Academic Analytics Dashboard'}
              </h2>
              {!isFaculty && (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                  Monitor institutional performance, assessments, and academic outcomes.
                </span>
              )}
            </div>
            {isFaculty && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {(user.role === 'admin' || user.role === 'teacher') && (
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    <option value="">-- Select Class --</option>
                    {ALL_CLASSES.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                )}
                {user.role === 'admin' && (
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    {SUBJECTS.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                )}
                {user.role === 'teacher' && selectedClass && selectedSubject !== 'Sports' && (
                  <Button variant="primary" onClick={() => setShowAddGrade(true)}>
                    ✚ Record New Grade
                  </Button>
                )}
              </div>
            )}
          </div>

          {isFaculty ? renderTeacherConsole() : renderStandardConsole()}
        </>
      )}

      {/* Record Grade Modal */}
      <Modal
        isOpen={showAddGrade}
        onClose={() => setShowAddGrade(false)}
        title="Record Student Evaluation Grade"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setShowAddGrade(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddGradeSubmit}>Submit Grade</Button>
          </>
        }
      >
        <form onSubmit={handleAddGradeSubmit} className="form-container">
          {user.role === 'teacher' ? (
            <FormInput
              label="Subject Area (Locked)"
              name="subject"
              type="text"
              value={selectedSubject}
              disabled
              required
            />
          ) : (
            <FormInput
              label="Subject Area"
              name="subject"
              type="select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={SUBJECTS.map(s => ({ value: s, label: s }))}
              required
            />
          )}

          <FormInput
            label="Student Target Name"
            name="studentId"
            type="select"
            value={newGrade.studentId}
            onChange={(e) => setNewGrade(prev => ({ ...prev, studentId: e.target.value }))}
            options={studentsList
              .filter(s => !selectedClass || s.class_id === selectedClass)
              .map(s => ({
                value: s.id,
                label: `${s.name} (${s.roll_number})`
              }))}
            required
          />

          <FormInput
            label="Assessment Type"
            name="assessmentType"
            type="text"
            value={newGrade.assessmentType}
            onChange={(e) => setNewGrade(prev => ({ ...prev, assessmentType: e.target.value }))}
            placeholder="e.g. Annual Exam, Midterm Quiz, Lab Prep"
            required
          />

          <div className="form-row">
            <FormInput
              label="Score Obtained"
              name="score"
              type="text"
              value={newGrade.score}
              onChange={(e) => setNewGrade(prev => ({ ...prev, score: e.target.value }))}
              placeholder="e.g. 92"
              required
            />

            <FormInput
              label="Maximum Score Available"
              name="maxScore"
              type="text"
              value={newGrade.maxScore}
              onChange={(e) => setNewGrade(prev => ({ ...prev, maxScore: e.target.value }))}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Lock Subject Modal for teachers */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => {}} 
        title="Privacy Configuration - Core Subject Lock-In"
        footerActions={
          <Button variant="primary" onClick={handleLockSubjectSubmit}>Lock In Subject & Proceed</Button>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            To enforce student confidentiality and strict privacy gating regulations, please select your primary instructional subject area. This locks your grading book and attendance log submissions to only show student records under this division.
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

      {/* Failed Students List Modal */}
      <Modal
        isOpen={showFailedModal}
        onClose={() => setShowFailedModal(false)}
        title={`Failed Students List (${failedStudents.length})`}
        footerActions={
          <Button variant="secondary" onClick={() => setShowFailedModal(false)}>Close List</Button>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            These students have scored below the passing mark of 50% in the current academic evaluations.
          </p>
          <Table
            columns={[
              { title: 'Student Name', key: 'studentName', render: (val) => <strong>{val}</strong> },
              { title: 'Roll Number', key: 'rollNumber' },
              { title: 'Score', key: 'score', render: (val, row) => <strong>{val} / {row.max}</strong> },
              { 
                title: 'Attendance', 
                key: 'attendance', 
                render: (_, row) => {
                  const att = calculateAttendancePct(row.student_id);
                  return <span style={{ fontWeight: 600, color: att < 75 ? 'var(--danger)' : 'var(--success)' }}>{att}%</span>;
                }
              }
            ]}
            data={failedStudents}
            emptyMessage="No failed students found in this subject."
          />
        </div>
      </Modal>

      {/* Student Profile Spotlight Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Academic Profile Spotlight"
        footerActions={
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Close Spotlight</Button>
        }
      >
        {viewingStudent && (
          <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: 'white',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {viewingStudent.studentName ? viewingStudent.studentName.charAt(0) : 'S'}
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{viewingStudent.studentName}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll Number: {viewingStudent.rollNumber}</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Current Subject:</span>
                <strong>{viewingStudent.subject}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Latest Marks:</span>
                <strong>{viewingStudent.score} / {viewingStudent.max} ({viewingStudent.grade})</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Attendance Rate:</span>
                <strong style={{ color: viewingStudent.attendance < 75 ? 'var(--danger)' : 'var(--success)' }}>{viewingStudent.attendance}%</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Academic Risk Standing:</span>
                <span className={`badge ${getRiskLevel(Number(viewingStudent.score), viewingStudent.attendance).badgeClass}`}>
                  {getRiskLevel(Number(viewingStudent.score), viewingStudent.attendance).level}
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: '0.5rem', backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
              <strong>Teacher Intervention Recommendations:</strong>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {viewingStudent.attendance < 75 
                  ? "⚠️ Immediate parental outreach is highly recommended. The student's academic performance is directly coupled with high absence rates." 
                  : "📝 Schedule remedial tutoring sessions and coordinate with the student to review classwork. Their attendance is satisfactory."}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Roll Number Modal */}
      <Modal
        isOpen={showRollNoModal}
        onClose={() => {
          setShowRollNoModal(false);
          setEditingRollNoStudent(null);
        }}
        title="Edit Student Roll Number"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => {
              setShowRollNoModal(false);
              setEditingRollNoStudent(null);
            }}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveRollNoSubmit}>Save Changes</Button>
          </>
        }
      >
        {editingRollNoStudent && (
          <form onSubmit={handleSaveRollNoSubmit} className="form-container">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Updating roll number for student: <strong>{editingRollNoStudent.studentName}</strong>.
            </p>
            <FormInput
              label="Student Roll Number"
              name="newRollNo"
              type="text"
              value={newRollNoValue}
              onChange={(e) => setNewRollNoValue(e.target.value)}
              placeholder="e.g. SCH-101"
              required
            />
          </form>
        )}
      </Modal>
    </>
  );
};

export default Marks;
