import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import Modal from '../../components/Modals/Modal';
import { api } from '../../services/api';

const Timetable = () => {
  const { user } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState(null);
  
  // Mapped entities loaded from timetable response
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Selection state for viewing/editing schedules
  const [selectedClassId, setSelectedClassId] = useState('c1111111-1111-1111-1111-111111111111'); // Grade 10-A default
  
  // Modal state for editing a timetable cell
  const [showCellModal, setShowCellModal] = useState(false);
  const [activeCell, setActiveCell] = useState(null); // { day, periodId }
  const [cellSubject, setCellSubject] = useState('');
  const [cellTeacherId, setCellTeacherId] = useState('');

  // Modal state for assigning a Class Teacher
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [assignTeacherClassId, setAssignTeacherClassId] = useState('');

  // Form fields inside Assign Class Teacher Modal
  const [assignFormTeacherId, setAssignFormTeacherId] = useState('');
  const [assignFormName, setAssignFormName] = useState('');
  const [assignFormSubject, setAssignFormSubject] = useState('');
  const [assignFormPhone, setAssignFormPhone] = useState('');

  // Admin Configuration Tab State
  const [activeTab, setActiveTab] = useState('grid'); // 'grid', 'settings', 'timings', 'teachers'

  // Teacher Profile & child details for Student/Parent
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [childProfile, setChildProfile] = useState(null);

  // Seeding/saving loader
  const [saving, setSaving] = useState(false);

  // Time inputs state for period editing
  const [editingTimings, setEditingTimings] = useState([]);

  // Fetch all timetable configurations on mount
  const loadTimetableConfig = async () => {
    try {
      setLoading(true);
      const tt = await api.getTimetableData();
      setTimetable(tt);
      setClasses(tt.classes || []);
      setTeachers(tt.teachers || []);
      setEditingTimings(tt.periodTimings || []);

      if (user.role === 'teacher') {
        const profile = await api.getTeacherProfileSelf();
        setTeacherProfile(profile);
      } else if (user.role === 'parent') {
        const parent = await api.getParentProfileSelf();
        if (parent && parent.child_id) {
          const token = localStorage.getItem('edubridge_token');
          const response = await fetch(`${import.meta.env.VITE_BUSINESS_API_URL || 'http://localhost:5001/api'}/students/profile/${parent.child_id}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const resData = await response.json();
          if (resData.success) {
            setChildProfile(resData.data);
          }
        }
      } else if (user.role === 'student') {
        const profile = await api.getStudentProfileSelf();
        setChildProfile(profile);
      }
    } catch (err) {
      console.error('Failed to load timetable config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetableConfig();
  }, [user.role]);

  if (loading) {
    return <Loader size="medium" text="Retrieving school timetables..." />;
  }

  if (!timetable) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Error: Unable to load timetable configuration.</h3>
        <Button variant="primary" onClick={loadTimetableConfig}>Retry</Button>
      </div>
    );
  }

  // Resolve Class Name by ID
  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown Class';
  };

  // Resolve Teacher Name by ID
  const getTeacherName = (teacherId) => {
    const t = teachers.find(tch => tch.id === teacherId);
    return t ? t.name : 'Unknown Teacher';
  };

  // Enforce First Period Rule: Period 1 Class Teacher auto-resolver
  const getClassTeacherId = (classId) => {
    const ct = (timetable.classTeachers || []).find(x => x.classId === classId);
    return ct ? ct.teacherId : '';
  };

  // Working days selector handler
  const handleWorkingDaysToggle = async (day) => {
    let updatedDays = [...timetable.workingDays];
    if (updatedDays.includes(day)) {
      updatedDays = updatedDays.filter(d => d !== day);
    } else {
      updatedDays.push(day);
      // Sort in standard order
      const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      updatedDays.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    
    await saveConfig({ workingDays: updatedDays });
  };

  // Save changes wrapper
  const saveConfig = async (payload) => {
    setSaving(true);
    try {
      const updated = await api.saveTimetableData({
        ...timetable,
        ...payload
      });
      setTimetable(updated);
      setEditingTimings(updated.periodTimings || []);
    } catch (err) {
      alert(err.message || 'Failed to save timetable configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Lock/Unlock dates triggers
  const handleUnlockDate = async (classId, date) => {
    try {
      setSaving(true);
      const updated = await api.unlockAttendanceDate({ classId, date });
      setTimetable(updated);
    } catch (err) {
      alert(err.message || 'Failed to unlock attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Edit slot cell handlers
  const handleCellClick = (day, periodId) => {
    if (user.role !== 'admin') return;

    // Check if class teacher is configured for Period 1 rule check
    if (periodId === 'p1') {
      const teacherId = getClassTeacherId(selectedClassId);
      if (!teacherId) {
        alert('🚫 Cannot schedule Period 1. You must first assign a Class Teacher for this class under the "Class Teachers" tab.');
        return;
      }
    }

    const slot = (timetable.schedule || []).find(
      s => s.classId === selectedClassId && s.day === day && s.periodId === periodId
    );

    setActiveCell({ day, periodId });
    setCellSubject(slot ? slot.subject : '');
    
    // For Period 1, lock teacherId to Class Teacher ID
    if (periodId === 'p1') {
      setCellTeacherId(getClassTeacherId(selectedClassId));
    } else {
      setCellTeacherId(slot ? slot.teacherId : '');
    }
    
    setShowCellModal(true);
  };

  const handleSaveCell = async () => {
    if (!cellSubject || !cellTeacherId) {
      alert('Please fill out both the Subject and Teacher.');
      return;
    }

    // Filter out existing slot for this class, day, and period
    let cleanSchedule = (timetable.schedule || []).filter(
      s => !(s.classId === selectedClassId && s.day === activeCell.day && s.periodId === activeCell.periodId)
    );

    // Append updated slot
    cleanSchedule.push({
      classId: selectedClassId,
      day: activeCell.day,
      periodId: activeCell.periodId,
      subject: cellSubject,
      teacherId: cellTeacherId
    });

    await saveConfig({ schedule: cleanSchedule });
    setShowCellModal(false);
  };

  const handleRemoveCell = async () => {
    let cleanSchedule = (timetable.schedule || []).filter(
      s => !(s.classId === selectedClassId && s.day === activeCell.day && s.periodId === activeCell.periodId)
    );
    await saveConfig({ schedule: cleanSchedule });
    setShowCellModal(false);
  };

  // Render cell details
  const getCellContent = (classId, day, periodId) => {
    const slot = (timetable.schedule || []).find(
      s => s.classId === classId && s.day === day && s.periodId === periodId
    );
    if (!slot) return null;
    return {
      subject: slot.subject,
      teacherName: getTeacherName(slot.teacherId)
    };
  };

  // Timings editing triggers
  const handleTimingChange = (index, field, value) => {
    const updated = [...editingTimings];
    updated[index] = { ...updated[index], [field]: value };
    setEditingTimings(updated);
  };

  const handleAddTiming = () => {
    const nextNum = editingTimings.filter(pt => !pt.isBreak).length + 1;
    const newTiming = {
      id: `p-${Math.random().toString(36).substr(2, 5)}`,
      name: `Period ${nextNum}`,
      startTime: '09:00 AM',
      endTime: '09:50 AM',
      isBreak: false
    };
    setEditingTimings([...editingTimings, newTiming]);
  };

  const handleDeleteTiming = (index) => {
    const updated = editingTimings.filter((_, idx) => idx !== index);
    setEditingTimings(updated);
  };

  const handleSaveTimings = async () => {
    const validPeriodIds = new Set(editingTimings.map(pt => pt.id));
    const updatedSchedule = (timetable.schedule || []).filter(s => validPeriodIds.has(s.periodId));
    
    await saveConfig({ 
      periodTimings: editingTimings,
      schedule: updatedSchedule
    });
    alert('✅ Period timings saved successfully.');
  };

  // Class Teacher Modal Handlers
  const handleOpenAssignModal = (classId) => {
    setAssignTeacherClassId(classId);
    
    const assignedId = getClassTeacherId(classId);
    const teacher = teachers.find(t => t.id === assignedId);
    
    if (teacher) {
      setAssignFormTeacherId(teacher.id);
      setAssignFormName(teacher.name);
      setAssignFormSubject(teacher.subject);
      setAssignFormPhone(teacher.phone || '');
    } else {
      setAssignFormTeacherId('');
      setAssignFormName('');
      setAssignFormSubject('');
      setAssignFormPhone('');
    }
    
    setShowAssignTeacherModal(true);
  };

  const handleSelectTeacherInForm = (teacherId) => {
    setAssignFormTeacherId(teacherId);
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setAssignFormName(teacher.name);
      setAssignFormSubject(teacher.subject);
      setAssignFormPhone(teacher.phone || '');
    } else {
      setAssignFormName('');
      setAssignFormSubject('');
      setAssignFormPhone('');
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignFormName.trim()) {
      alert('Please enter a teacher name.');
      return;
    }
    if (!assignFormSubject.trim() || !assignFormPhone.trim()) {
      alert('Please fill out all details.');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('edubridge_token');
      
      // Look up if teacher with this name already exists (case-insensitive)
      let teacherId = assignFormTeacherId;
      const normalizedName = assignFormName.trim().toLowerCase();
      const existingTeacher = teachers.find(t => t.name.trim().toLowerCase() === normalizedName);
      
      if (existingTeacher) {
        teacherId = existingTeacher.id;
      }
      
      if (teacherId) {
        // Update existing teacher details
        const response = await fetch(`${import.meta.env.VITE_BUSINESS_API_URL || 'http://localhost:5001/api'}/teachers/${teacherId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: assignFormName.trim(),
            subject: assignFormSubject.trim(),
            phone: assignFormPhone.trim()
          })
        });
        
        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.message || 'Failed to update teacher details.');
        }
      } else {
        // Create new teacher profile
        const response = await fetch(`${import.meta.env.VITE_BUSINESS_API_URL || 'http://localhost:5001/api'}/teachers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: assignFormName.trim(),
            subject: assignFormSubject.trim(),
            phone: assignFormPhone.trim(),
            designation: 'Class Teacher'
          })
        });
        
        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.message || 'Failed to create new teacher profile.');
        }
        teacherId = resData.data.id;
      }
      
      await handleClassTeacherChange(assignTeacherClassId, teacherId);
      
      const tt = await api.getTimetableData();
      setTimetable(tt);
      setTeachers(tt.teachers || []);
      
      setShowAssignTeacherModal(false);
      alert('✅ Class Teacher assigned successfully.');
    } catch (err) {
      alert(err.message || 'Failed to assign Class Teacher.');
    } finally {
      setSaving(false);
    }
  };

  // Class Teacher assignment handler
  const handleClassTeacherChange = async (classId, teacherId) => {
    let updatedCT = [...(timetable.classTeachers || [])];
    const index = updatedCT.findIndex(x => x.classId === classId);
    
    if (index !== -1) {
      if (teacherId === '') {
        updatedCT = updatedCT.filter(x => x.classId !== classId);
      } else {
        updatedCT[index] = { classId, teacherId };
      }
    } else if (teacherId !== '') {
      updatedCT.push({ classId, teacherId });
    }

    await saveConfig({ classTeachers: updatedCT });
  };


  // ==========================================
  // RENDER: ADMIN TIMETABLE MANAGEMENT
  // ==========================================
  const renderAdminView = () => {
    const workingDays = timetable.workingDays || [];
    const periodTimings = timetable.periodTimings || [];

    return (
      <div className="dashboard-layout-main" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <div className="widget-section" style={{ minWidth: 0, overflow: 'hidden' }}>
          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border-color)',
            marginBottom: '1.5rem',
            gap: '1.5rem'
          }}>
            {[
              { id: 'grid', label: '📅 Interactive Schedule Grid' },
              { id: 'teachers', label: '👨‍🏫 Class Teachers Assignment' },
              { id: 'timings', label: '⏱ Period Timings Configuration' },
              { id: 'settings', label: '⚙️ Working Days & Gating' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 5px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: SCHEDULE GRID */}
          {activeTab === 'grid' && (
            <Card 
              title="Class Timetable Master Grid" 
              subtitle="Select a grade to view and edit schedule cells."
              headerAction={
                <div style={{ width: '220px' }}>
                  <FormInput
                    type="select"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    options={classes.map(c => ({ value: c.id, label: `${c.name} (${c.grade_level})` }))}
                  />
                </div>
              }
            >
              {saving && <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem' }}>🔄 Saving changes...</div>}
              
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                borderLeft: '4px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                💡 <strong>Admin Edit Mode:</strong> Click on any scheduling slot inside the grid to configure subjects and assign instructors. Period 1 slots will automatically lock to the class's assigned Class Teacher.
              </div>

              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '1300px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '15px', fontWeight: 800, color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)', width: '120px' }}>Day of week</th>
                      {periodTimings.map((pt) => (
                        <th key={pt.id} style={{ padding: '12px 15px', color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)', minWidth: '150px' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{pt.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{pt.startTime} - {pt.endTime}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workingDays.map((day) => (
                      <tr key={day} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '15px', fontWeight: 800, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>{day.substring(0, 3)}</td>
                        {periodTimings.map((pt) => {
                          if (pt.isBreak) {
                            return (
                              <td key={pt.id} style={{ padding: '15px', borderRight: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, fontStyle: 'italic' }}>
                                {pt.name}
                              </td>
                            );
                          }
                          const cell = getCellContent(selectedClassId, day, pt.id);
                          const isP1 = pt.id === 'p1';
                          
                          return (
                            <td 
                              key={pt.id} 
                              onClick={() => handleCellClick(day, pt.id)}
                              style={{ 
                                padding: '12px', 
                                borderRight: '1px solid var(--border-color)', 
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                verticalAlign: 'middle'
                              }}
                              className="timetable-cell-interactive"
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.04)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              {cell ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{cell.subject}</span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>👨‍🏫 {cell.teacherName}</span>
                                  {isP1 && <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700 }}>(Class Teacher)</span>}
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>+ Add Slot</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 2: GENERAL SETTINGS & GATING */}
          {activeTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Card title="Working Days & Attendance Gating" subtitle="General parameters of class scheduling.">
                {/* Working days checkboxes */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>School Working Days</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                      <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(timetable.workingDays || []).includes(day)}
                          onChange={() => handleWorkingDaysToggle(day)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>{day} {day === 'Saturday' && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Optional)</span>}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Attendance responsibility toggle switch */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Attendance Responsibility Gating</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1rem' }}>
                    When enabled, only the designated Class Teacher is authorized to log attendance for their class. Marking is constrained to Period 1, locked after submission, and can only be unlocked here by Admin.
                  </p>
                  
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!timetable.attendanceResponsibilityEnabled}
                      onChange={(e) => saveConfig({ attendanceResponsibilityEnabled: e.target.checked })}
                      style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                    />
                    <strong style={{ fontSize: '0.95rem', color: timetable.attendanceResponsibilityEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {timetable.attendanceResponsibilityEnabled ? 'Enabled (Restricted Permission)' : 'Disabled (Open Permission)'}
                    </strong>
                  </label>
                </div>
              </Card>

              {/* Locked Attendance List */}
              <Card title="Locked Class Registers" subtitle="Unlock locked class attendance records if correction is needed.">
                {(!timetable.lockedDates || timetable.lockedDates.length === 0) ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No class attendance registers are locked currently.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                          <th style={{ padding: '10px 5px', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class Name</th>
                          <th style={{ padding: '10px 5px', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked Date</th>
                          <th style={{ padding: '10px 5px', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetable.lockedDates.map((ld, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px 5px', fontWeight: 700, fontSize: '0.85rem' }}>{getClassName(ld.classId)}</td>
                            <td style={{ padding: '12px 5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ld.date}</td>
                            <td style={{ padding: '12px 5px', textAlign: 'right' }}>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleUnlockDate(ld.classId, ld.date)}
                              >
                                🔓 Unlock
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 3: PERIOD TIMINGS CONFIGURATION */}
          {activeTab === 'timings' && (
            <Card title="School Period & Breaks Schedule" subtitle="Configure timings for each period block and break time.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '700px', margin: '0 auto' }}>
                
                {editingTimings.map((pt, index) => (
                  <div 
                    key={pt.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1.25rem', 
                      padding: '10px 15px', 
                      backgroundColor: pt.isBreak ? 'rgba(0,0,0,0.02)' : 'var(--bg-primary)', 
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: pt.isBreak ? '4px solid var(--border-color)' : '4px solid var(--primary)'
                    }}
                  >
                    <div style={{ width: '160px' }}>
                      <input
                        type="text"
                        value={pt.name}
                        onChange={(e) => handleTimingChange(index, 'name', e.target.value)}
                        placeholder="e.g. Period 1"
                        className="form-control"
                        style={{ height: '36px', padding: '0 8px', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <input
                        type="text"
                        value={pt.startTime}
                        onChange={(e) => handleTimingChange(index, 'startTime', e.target.value)}
                        placeholder="e.g. 09:00 AM"
                        className="form-control"
                        style={{ height: '36px', padding: '0 8px', fontSize: '0.85rem', textAlign: 'center' }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>to</span>
                      <input
                        type="text"
                        value={pt.endTime}
                        onChange={(e) => handleTimingChange(index, 'endTime', e.target.value)}
                        placeholder="e.g. 09:50 AM"
                        className="form-control"
                        style={{ height: '36px', padding: '0 8px', fontSize: '0.85rem', textAlign: 'center' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={pt.isBreak ? 'break' : 'lecture'}
                        onChange={(e) => handleTimingChange(index, 'isBreak', e.target.value === 'break')}
                        className="form-control"
                        style={{ height: '36px', padding: '0 8px', fontSize: '0.85rem', width: '110px' }}
                      >
                        <option value="lecture">📖 Lecture</option>
                        <option value="break">☕ Break</option>
                      </select>
                      
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteTiming(index)}
                        style={{ height: '36px', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete Period"
                      >
                        🗑
                      </Button>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                  <Button variant="secondary" onClick={handleAddTiming}>
                    ➕ Add Period / Break
                  </Button>
                  <Button variant="primary" onClick={handleSaveTimings} disabled={saving}>
                    💾 Save Period Timings
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: CLASS TEACHERS ASSIGNMENT */}
          {activeTab === 'teachers' && (
            <Card title="Class Teacher Matrix" subtitle="Assign exactly one Class Teacher to handle attendance gating responsibility.">
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '15px', fontWeight: 800 }}>Class Name</th>
                      <th style={{ padding: '15px', fontWeight: 800 }}>Grade Level</th>
                      <th style={{ padding: '15px', fontWeight: 800 }}>Assigned Class Teacher Details</th>
                      <th style={{ padding: '15px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => {
                      const assignedTeacherId = getClassTeacherId(cls.id);
                      const teacher = teachers.find(t => t.id === assignedTeacherId);
                      return (
                        <tr key={cls.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '15px', fontWeight: 700 }}>{cls.name}</td>
                          <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{cls.grade_level}</td>
                          <td style={{ padding: '15px' }}>
                            {teacher ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>👤 {teacher.name}</strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subject: <strong>{teacher.subject}</strong></span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 Phone: {teacher.phone || 'N/A'}</span>
                              </div>
                            ) : (
                              <span className="badge badge-warning" style={{ textTransform: 'none', fontWeight: 600 }}>
                                ⚠️ No Class Teacher Assigned
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '15px', textAlign: 'right' }}>
                            <Button
                              size="sm"
                              variant={teacher ? "secondary" : "primary"}
                              onClick={() => handleOpenAssignModal(cls.id)}
                            >
                              {teacher ? '⚙️ Change Assignment' : '➕ Assign Teacher'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  };


  // ==========================================
  // RENDER: TEACHER VIEW
  // ==========================================
  const renderTeacherView = () => {
    if (!teacherProfile) return <Loader size="small" text="Matching teacher records..." />;

    // Check if current teacher is a class teacher of any class
    const myClasses = (timetable.classTeachers || [])
      .filter(ct => ct.teacherId === teacherProfile.id)
      .map(ct => getClassName(ct.classId));

    const isClassTeacherOfSome = myClasses.length > 0;

    const workingDays = timetable.workingDays || [];
    const periodTimings = timetable.periodTimings || [];

    return (
      <div className="dashboard-layout-main" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <div className="widget-section" style={{ minWidth: 0, overflow: 'hidden' }}>
          {/* Class Teacher Banner */}
          <div className="glass" style={{
            padding: '1.25rem 1.75rem',
            borderLeft: isClassTeacherOfSome ? '5px solid var(--success)' : '5px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px' }}>
                👨‍🏫 {teacherProfile.designation || 'Faculty Lecturer'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', marginTop: '6px' }}>
                <span><strong>Primary Subject:</strong> {teacherProfile.subject || 'Not Configured'}</span>
                <span>•</span>
                <span>
                  <strong>Class Teacher Designation:</strong>{' '}
                  {isClassTeacherOfSome ? (
                    <span className="badge badge-success" style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
                      Class Teacher of {myClasses.join(', ')}
                    </span>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No designated class</span>
                  )}
                </span>
              </p>
            </div>
            
            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
              <div><strong>Attendance Responsibility:</strong></div>
              <span className={`badge ${timetable.attendanceResponsibilityEnabled ? 'badge-primary' : 'badge-warning'}`} style={{ marginTop: '5px' }}>
                {timetable.attendanceResponsibilityEnabled ? 'Gating Active' : 'Gating Inactive'}
              </span>
            </div>
          </div>

          <Card title="My Personal Teaching Timetable" subtitle="Interactive schedule display of your weekly assigned lectures.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {workingDays.map((day) => {
                // Find all periods where this teacher is scheduled
                const dayLessons = (timetable.schedule || []).filter(
                  s => s.day === day && s.teacherId === teacherProfile.id
                );

                return (
                  <div key={day} style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h5 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      📅 {day}
                    </h5>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                      {periodTimings.filter(pt => !pt.isBreak).map((pt) => {
                        const lesson = dayLessons.find(l => l.periodId === pt.id);
                        
                        return (
                          <div 
                            key={pt.id} 
                            style={{ 
                              padding: '12px 15px', 
                              backgroundColor: lesson ? 'var(--bg-secondary)' : 'rgba(0,0,0,0.01)',
                              borderRadius: 'var(--radius-sm)',
                              border: lesson ? '1px solid rgba(37, 99, 235, 0.15)' : '1px dotted var(--border-color)',
                              borderLeft: lesson ? '4px solid var(--primary)' : '4px solid var(--border-color)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              minHeight: '75px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{pt.name}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{pt.startTime}</span>
                            </div>
                            
                            {lesson ? (
                              <>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{lesson.subject}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                                  🏫 Class: {getClassName(lesson.classId)}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500 }}>☕ Free Period</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  };


  // ==========================================
  // RENDER: STUDENT VIEW
  // ==========================================
  const renderStudentView = () => {
    if (!childProfile) return <Loader size="small" text="Resolving academic class settings..." />;

    const workingDays = timetable.workingDays || [];
    const periodTimings = timetable.periodTimings || [];

    return (
      <div className="dashboard-layout-main" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <div className="widget-section" style={{ minWidth: 0, overflow: 'hidden' }}>
          {/* Class Banner */}
          <div className="glass" style={{
            padding: '1rem 1.5rem',
            borderLeft: '5px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                🎓 Academic Timetable Sheet
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Classroom schedules mapped dynamically for: <strong>{getClassName(childProfile.class_id)}</strong>
              </p>
            </div>
            <span className="badge badge-primary">Student view</span>
          </div>

          <Card title="My Class Timetable" subtitle="Daily scheduling structure of core and elective subject lectures.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {workingDays.map((day) => {
                // Find all lessons for the student's class
                const dayLessons = (timetable.schedule || []).filter(
                  s => s.day === day && s.classId === childProfile.class_id
                );

                return (
                  <div key={day} style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h5 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      📅 {day}
                    </h5>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                      {periodTimings.filter(pt => !pt.isBreak).map((pt) => {
                        const lesson = dayLessons.find(l => l.periodId === pt.id);
                        
                        return (
                          <div 
                            key={pt.id} 
                            style={{ 
                              padding: '12px 15px', 
                              backgroundColor: lesson ? 'var(--bg-secondary)' : 'rgba(0,0,0,0.01)',
                              borderRadius: 'var(--radius-sm)',
                              border: lesson ? '1px solid rgba(37, 99, 235, 0.15)' : '1px dotted var(--border-color)',
                              borderLeft: lesson ? '4px solid var(--primary)' : '4px solid var(--border-color)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              minHeight: '75px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{pt.name}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{pt.startTime}</span>
                            </div>
                            
                            {lesson ? (
                              <>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{lesson.subject}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                                  👨‍🏫 {getTeacherName(lesson.teacherId)}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500 }}>No lecture</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  };


  // ==========================================
  // RENDER: PARENT VIEW
  // ==========================================
  const renderParentView = () => {
    if (!childProfile) return <Loader size="small" text="Fetching child data logs..." />;

    const workingDays = timetable.workingDays || [];
    const periodTimings = timetable.periodTimings || [];

    return (
      <div className="dashboard-layout-main" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <div className="widget-section" style={{ minWidth: 0, overflow: 'hidden' }}>
          {/* Linked Child Info */}
          <div className="glass" style={{
            padding: '1.25rem 1.75rem',
            borderLeft: '5px solid var(--secondary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🏡 Linked Child Schedule: <span style={{ color: 'var(--secondary)' }}>{childProfile.name}</span>
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Class Assignment: <strong>{getClassName(childProfile.class_id)}</strong> | Roll Number: <strong>{childProfile.roll_number}</strong>
              </p>
            </div>
            <span className="badge badge-primary">Parent Portal</span>
          </div>

          <Card title="Child Timetable" subtitle="Daily list of academic courses and timings for your child.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {workingDays.map((day) => {
                // Find all lessons for the child's class
                const dayLessons = (timetable.schedule || []).filter(
                  s => s.day === day && s.classId === childProfile.class_id
                );

                return (
                  <div key={day} style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h5 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      📅 {day}
                    </h5>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                      {periodTimings.filter(pt => !pt.isBreak).map((pt) => {
                        const lesson = dayLessons.find(l => l.periodId === pt.id);
                        
                        return (
                          <div 
                            key={pt.id} 
                            style={{ 
                              padding: '12px 15px', 
                              backgroundColor: lesson ? 'var(--bg-secondary)' : 'rgba(0,0,0,0.01)',
                              borderRadius: 'var(--radius-sm)',
                              border: lesson ? '1px solid rgba(37, 99, 235, 0.15)' : '1px dotted var(--border-color)',
                              borderLeft: lesson ? '4px solid var(--primary)' : '4px solid var(--border-color)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              minHeight: '75px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{pt.name}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{pt.startTime}</span>
                            </div>
                            
                            {lesson ? (
                              <>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{lesson.subject}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                                  👨‍🏫 {getTeacherName(lesson.teacherId)}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500 }}>No lecture scheduled</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  };


  // ==========================================
  // ENTRY ENTRYPOINT ROUTER
  // ==========================================
  return (
    <>
      {/* Page Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACADEMIC SYSTEM</span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
          {user.role === 'admin' ? 'Timetable Management Portal' : 'Class Weekly Timetable'}
        </h2>
      </div>

      {/* Render matching view according to role */}
      {user.role === 'admin' && renderAdminView()}
      {user.role === 'teacher' && renderTeacherView()}
      {user.role === 'student' && renderStudentView()}
      {user.role === 'parent' && renderParentView()}

      {/* Interactive cell slot config modal for Admin */}
      {showCellModal && activeCell && (
        <Modal
          isOpen={showCellModal}
          onClose={() => setShowCellModal(false)}
          title={`Configure Period Slot: ${activeCell.day} - ${timetable.periodTimings.find(x => x.id === activeCell.periodId)?.name}`}
          footerActions={
            <>
              <Button variant="secondary" onClick={() => setShowCellModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleRemoveCell} disabled={saving}>🗑 Clear Slot</Button>
              <Button variant="primary" onClick={handleSaveCell} disabled={saving}>💾 Save Slot</Button>
            </>
          }
        >
          <div className="form-container" style={{ padding: '0.5rem 0' }}>
            <FormInput
              label="Subject / Lesson Name"
              type="text"
              value={cellSubject}
              onChange={(e) => setCellSubject(e.target.value)}
              placeholder="e.g. Mathematics, English, Telugu"
              required
            />

            {activeCell.periodId === 'p1' ? (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Assigned Instructor</label>
                <input
                  type="text"
                  value={`${getTeacherName(getClassTeacherId(selectedClassId))} (Class Teacher)`}
                  disabled
                  className="form-control"
                  style={{ backgroundColor: 'rgba(0,0,0,0.04)', fontWeight: 600 }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                  🔒 First Period Rule: Locked to the assigned Class Teacher for this class.
                </span>
              </div>
            ) : (
              <FormInput
                label="Assigned Instructor"
                type="select"
                value={cellTeacherId}
                onChange={(e) => setCellTeacherId(e.target.value)}
                options={teachers.map(t => ({ value: t.id, label: `${t.name} (${t.subject})` }))}
                required
              />
            )}
          </div>
        </Modal>
      )}

      {/* Interactive modal for assigning a Class Teacher */}
      {showAssignTeacherModal && assignTeacherClassId && (
        <Modal
          isOpen={showAssignTeacherModal}
          onClose={() => setShowAssignTeacherModal(false)}
          title={`Assign Class Teacher for ${getClassName(assignTeacherClassId)}`}
          footerActions={
            <>
              <Button variant="secondary" onClick={() => setShowAssignTeacherModal(false)}>Cancel</Button>
              {getClassTeacherId(assignTeacherClassId) && (
                <Button 
                  variant="danger" 
                  onClick={async () => {
                    await handleClassTeacherChange(assignTeacherClassId, '');
                    setShowAssignTeacherModal(false);
                  }}
                  disabled={saving}
                >
                  🗑 Remove Assignment
                </Button>
              )}
            </>
          }
        >
          <div className="form-container" style={{ padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Assign a faculty teacher to lead this class. Enter their name, teaching subject, and contact number, and click Assign.
            </p>

            <FormInput
              label="Teacher Name"
              type="text"
              value={assignFormName}
              onChange={(e) => setAssignFormName(e.target.value)}
              placeholder="e.g. Prof. Marcus Vance"
              required
            />

            <FormInput
              label="Teaching Subject"
              type="text"
              value={assignFormSubject}
              onChange={(e) => setAssignFormSubject(e.target.value)}
              placeholder="e.g. Mathematics"
              required
            />

            <FormInput
              label="Contact Phone Number"
              type="text"
              value={assignFormPhone}
              onChange={(e) => setAssignFormPhone(e.target.value)}
              placeholder="e.g. +1 (555) 012-3456"
              required
            />

            <Button 
              variant="primary" 
              style={{ width: '100%', marginTop: '1.5rem', height: '42px', fontWeight: 700 }}
              onClick={handleAssignSubmit}
              disabled={saving}
            >
              {saving ? '⏳ Saving...' : '💾 Assign Class Teacher'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Timetable;
