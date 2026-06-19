import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Table from '../../components/Tables/Table';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import Modal from '../../components/Modals/Modal';
import { api } from '../../services/api';

const ALL_CLASSES = [
  { value: 'class-6a', label: 'Grade 6-A' },
  { value: 'class-7a', label: 'Grade 7-A' },
  { value: 'class-8a', label: 'Grade 8-A' },
  { value: 'class-9a', label: 'Grade 9-A' },
  { value: 'c1111111-1111-1111-1111-111111111111', label: 'Grade 10-A' }
];

const Promotion = () => {
  const { user } = useOutletContext();
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(true);

  // Lists from backend
  const [activeStudents, setActiveStudents] = useState([]);
  const [completedSchoolingStudents, setCompletedSchoolingStudents] = useState([]);
  const [promotionHistory, setPromotionHistory] = useState([]);

  // Promote Single Student form state
  const [singleStudentSearch, setSingleStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [singleTargetClass, setSingleTargetClass] = useState('');
  const [singleAcademicYear, setSingleAcademicYear] = useState('2026-2027');
  const [singleSubmitting, setSingleSubmitting] = useState(false);

  // Promote Entire Class form state
  const [classSourceClass, setClassSourceClass] = useState('');
  const [classTargetClass, setClassTargetClass] = useState('');
  const [classAcademicYear, setClassAcademicYear] = useState('2026-2027');
  const [classSubmitting, setClassSubmitting] = useState(false);

  // Graduation form state
  const [selectedGradStudents, setSelectedGradStudents] = useState(new Set());
  const [gradAcademicYear, setGradAcademicYear] = useState('2025-2026');
  const [gradSubmitting, setGradSubmitting] = useState(false);

  // Past Performance state
  const [pastSearch, setPastSearch] = useState('');
  const [selectedPastStudent, setSelectedPastStudent] = useState(null);
  const [pastRecords, setPastRecords] = useState([]);
  const [selectedPastRecord, setSelectedPastRecord] = useState(null);
  const [loadingPast, setLoadingPast] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const actives = await api.getActiveStudents();
      const grads = await api.getCompletedSchoolingStudents();
      const history = await api.getPromotionHistory();

      setActiveStudents(actives || []);
      setCompletedSchoolingStudents(grads || []);
      setPromotionHistory(history || []);
    } catch (err) {
      console.error('Failed to load promotion data:', err);
      alert('Failed to load student promotion lists: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler: Promote single student
  const handlePromoteSingleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !singleTargetClass || !singleAcademicYear) {
      alert('Please select a student, a target class, and specify the academic year.');
      return;
    }

    try {
      setSingleSubmitting(true);
      await api.promoteStudent(selectedStudent.id, singleTargetClass, singleAcademicYear);
      alert(`✅ ${selectedStudent.name} has been successfully promoted to ${ALL_CLASSES.find(c => c.value === singleTargetClass)?.label || 'new class'}.`);
      setSelectedStudent(null);
      setSingleTargetClass('');
      setSingleStudentSearch('');
      await loadData();
    } catch (err) {
      alert('Failed to promote student: ' + err.message);
    } finally {
      setSingleSubmitting(false);
    }
  };

  // Handler: Promote entire class
  const handlePromoteClassSubmit = async (e) => {
    e.preventDefault();
    if (!classSourceClass || !classTargetClass || !classAcademicYear) {
      alert('Please fill out all fields.');
      return;
    }
    if (classSourceClass === classTargetClass) {
      alert('Source class and destination class cannot be the same.');
      return;
    }

    try {
      setClassSubmitting(true);
      const res = await api.promoteClass(classSourceClass, classTargetClass, classAcademicYear);
      alert(`✅ Successful! Promoted ${res.promotedCount || 0} students from ${ALL_CLASSES.find(c => c.value === classSourceClass)?.label} to ${ALL_CLASSES.find(c => c.value === classTargetClass)?.label}.`);
      setClassSourceClass('');
      setClassTargetClass('');
      await loadData();
    } catch (err) {
      alert('Failed to promote class: ' + err.message);
    } finally {
      setClassSubmitting(false);
    }
  };

  // Handler: Complete schooling for student(s)
  const handleGraduateSubmit = async () => {
    if (selectedGradStudents.size === 0) {
      alert('Please select at least one student to complete schooling.');
      return;
    }

    try {
      setGradSubmitting(true);
      const studentIds = Array.from(selectedGradStudents);
      await api.completeSchoolingStudents(studentIds, gradAcademicYear);
      alert(`✅ successfully moved ${studentIds.length} student(s) to Completed Schooling status.`);
      setSelectedGradStudents(new Set());
      await loadData();
    } catch (err) {
      alert('Failed to complete schooling for students: ' + err.message);
    } finally {
      setGradSubmitting(false);
    }
  };

  // Select student for past performance
  const handlePastStudentSelect = async (student) => {
    setSelectedPastStudent(student);
    setSelectedPastRecord(null);
    setLoadingPast(true);
    try {
      const records = await api.getPastPerformance(student.id);
      setPastRecords(records || []);
      if (records && records.length > 0) {
        setSelectedPastRecord(records[0]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve performance history: ' + err.message);
    } finally {
      setLoadingPast(false);
    }
  };

  // Checkbox helper for graduation
  const toggleGradStudentSelect = (id) => {
    setSelectedGradStudents(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const selectAll10thGraders = (grade10Students) => {
    if (selectedGradStudents.size === grade10Students.length) {
      setSelectedGradStudents(new Set());
    } else {
      setSelectedGradStudents(new Set(grade10Students.map(s => s.id)));
    }
  };

  if (loading) {
    return <Loader size="medium" text="Syncing student logs and promotion matrices..." />;
  }

  // Filter lists
  const filteredActiveStudents = activeStudents.filter(s =>
    s.name.toLowerCase().includes(singleStudentSearch.toLowerCase()) ||
    (s.roll_number && s.roll_number.toLowerCase().includes(singleStudentSearch.toLowerCase()))
  );

  const grade10Students = activeStudents.filter(s => s.class_id === 'c1111111-1111-1111-1111-111111111111');

  const filteredPastStudents = activeStudents.concat(completedSchoolingStudents).filter(s =>
    s.name.toLowerCase().includes(pastSearch.toLowerCase()) ||
    (s.roll_number && s.roll_number.toLowerCase().includes(pastSearch.toLowerCase()))
  );

  return (
    <>
      {/* Header title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>ADMIN MODULE</span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
          Student Promotion & Alumni Management
        </h2>
      </div>

      {/* Tabs Menu */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'single', label: '👤 Promote Single Student' },
          { id: 'class', label: '🏫 Promote Entire Class' },
          { id: 'graduate', label: '🎓 Completed Schooling' },
          { id: 'history', label: '📜 Promotion History' },
          { id: 'past', label: '📊 Past Performance History' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginRight: '0.25rem'
            }}
            onMouseOver={e => {
              if (activeTab !== tab.id) {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseOut={e => {
              if (activeTab !== tab.id) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents: Promote Single Student */}
      {activeTab === 'single' && (
        <div className="dashboard-layout-main">
          {/* Left Column: Student selection */}
          <div className="widget-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Card title="1. Select Student for Promotion" subtitle="Type student name or roll number.">
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Search student by name or roll number..."
                  value={singleStudentSearch}
                  onChange={(e) => setSingleStudentSearch(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{
                maxHeight: '350px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)'
              }}>
                <Table
                  columns={[
                    { title: 'Roll No', key: 'roll_number' },
                    { title: 'Student Name', key: 'name', render: (val) => <strong>{val}</strong> },
                    { title: 'Current Class', key: 'class_name' }
                  ]}
                  data={filteredActiveStudents}
                  emptyMessage="No active students found."
                  className="table-sm"
                  rowClick={(row) => setSelectedStudent(row)}
                  // Highlight selected row styling custom hook
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Promotion target selection */}
          <div className="widget-section">
            <Card title="2. Promotion Configuration" subtitle="Configure the destination class and academic year.">
              {selectedStudent ? (
                <form onSubmit={handlePromoteSingleSubmit} className="form-container">
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(37,99,235,0.08)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--primary)',
                    marginBottom: '1.25rem'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      Selected Student: <strong>{selectedStudent.name}</strong> ({selectedStudent.roll_number})
                    </p>
                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Current Class: {selectedStudent.class_name}
                    </p>
                  </div>

                  <FormInput
                    label="Destination Class / Grade"
                    type="select"
                    value={singleTargetClass}
                    onChange={(e) => setSingleTargetClass(e.target.value)}
                    options={ALL_CLASSES}
                    placeholder="Select class to promote into..."
                    required
                  />

                  <FormInput
                    label="Target Academic Year"
                    type="text"
                    value={singleAcademicYear}
                    onChange={(e) => setSingleAcademicYear(e.target.value)}
                    placeholder="e.g. 2026-2027"
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
                    ⚠️ <strong>Data Transfer Policy:</strong> All grades, attendance, behavior logs, and complaints records of {selectedStudent.name} for the current academic year will be aggregated, saved into the view-only history, and then cleared to start clean for {singleAcademicYear}.
                  </div>

                  <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={singleSubmitting}>
                    {singleSubmitting ? '🔄 Processing...' : `🚀 Promote ${selectedStudent.name}`}
                  </Button>
                </form>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👈</div>
                  <h4>No Student Selected</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '0.5rem auto 0 auto' }}>
                    Please select a student from the register on the left to configure their academic promotion.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab Contents: Promote Entire Class */}
      {activeTab === 'class' && (
        <Card title="Promote Entire Classroom" subtitle="Move all students in one class directly to the next class level.">
          <form onSubmit={handlePromoteClassSubmit} className="form-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem 0' }}>
            <div className="grid-2-cols" style={{ gap: '1rem' }}>
              <FormInput
                label="Source Class (From)"
                type="select"
                value={classSourceClass}
                onChange={(e) => setClassSourceClass(e.target.value)}
                options={ALL_CLASSES}
                placeholder="Choose source class..."
                required
              />

              <FormInput
                label="Destination Class (To)"
                type="select"
                value={classTargetClass}
                onChange={(e) => setClassTargetClass(e.target.value)}
                options={ALL_CLASSES}
                placeholder="Choose destination class..."
                required
              />
            </div>

            <FormInput
              label="Destination Academic Year"
              type="text"
              value={classAcademicYear}
              onChange={(e) => setClassAcademicYear(e.target.value)}
              placeholder="e.g. 2026-2027"
              required
            />

            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-primary)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              lineHeight: 1.5,
              marginBottom: '1.5rem'
            }}>
              💡 **Class promotion moves all students in bulk.** 
              For each student, the system will save their active grade/attendance summaries into **Past Performance** and then wipe the current year tables to ensure a clean register for the target year.
            </div>

            <Button type="submit" variant="primary" style={{ width: '100%', padding: '0.75rem' }} disabled={classSubmitting}>
              {classSubmitting ? '🔄 Processing Bulk Promotions...' : '🚀 Execute Class Promotion'}
            </Button>
          </form>
        </Card>
      )}

      {/* Tab Contents: Graduated Students */}
      {activeTab === 'graduate' && (
        <div className="dashboard-layout-main">
          {/* Active 10th class register */}
          <div className="widget-section">
            <Card
              title="10th Class Students"
              subtitle="Select students from Grade 10-A to finalize completed schooling status."
              headerAction={
                <Button variant="danger" size="sm" onClick={handleGraduateSubmit} disabled={selectedGradStudents.size === 0 || gradSubmitting}>
                  🎓 Complete Schooling Selected ({selectedGradStudents.size})
                </Button>
              }
            >
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <FormInput
                    label="Completion Year"
                    type="text"
                    value={gradAcademicYear}
                    onChange={(e) => setGradAcademicYear(e.target.value)}
                    placeholder="e.g. 2025-2026"
                    required
                    style={{ margin: 0 }}
                  />
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <Button variant="secondary" size="sm" onClick={() => selectAll10thGraders(grade10Students)}>
                    {selectedGradStudents.size === grade10Students.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>

              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                <Table
                  columns={[
                    {
                      title: 'Select',
                      key: 'id',
                      width: '60px',
                      render: (_, row) => (
                        <input
                          type="checkbox"
                          checked={selectedGradStudents.has(row.id)}
                          onChange={() => toggleGradStudentSelect(row.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      )
                    },
                    { title: 'Roll Number', key: 'roll_number' },
                    { title: 'Student Name', key: 'name', render: (val) => <strong>{val}</strong> },
                    { title: 'Current Class', key: 'class_name' }
                  ]}
                  data={grade10Students}
                  emptyMessage="No Grade 10 active students found."
                />
              </div>
            </Card>
          </div>

          {/* Graduated alumni list */}
          <div className="widget-section">
            <Card title="Past Completed Batch" subtitle="List of all former students who have completed schooling.">
              <div style={{
                maxHeight: '450px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                <Table
                  columns={[
                    { title: 'Roll Number', key: 'roll_number' },
                    { title: 'Student Name', key: 'name', render: (val) => <strong>{val}</strong> },
                    { title: 'Status', key: 'status', render: () => <span className="badge badge-success">COMPLETED</span> }
                  ]}
                  data={completedSchoolingStudents}
                  emptyMessage="No completed schooling records."
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Contents: Promotion History */}
      {activeTab === 'history' && (
        <Card title="Promotion Log Ledger" subtitle="Historical logs of all student promotions and graduations.">
          <Table
            columns={[
              { title: 'Student Name', key: 'studentName', render: (val) => <strong>{val}</strong> },
              { title: 'Roll Number', key: 'rollNumber' },
              { title: 'Previous Class', key: 'previousClassName' },
              { title: 'Destination Class', key: 'newClassName', render: (val, row) => row.status === 'Completed Schooling' ? <span className="badge badge-success">COMPLETED</span> : val },
              { title: 'Target Academic Year', key: 'academicYear' },
              { title: 'Status Code', key: 'status', render: (val) => <span className={`badge ${val === 'Completed Schooling' ? 'badge-success' : 'badge-primary'}`}>{val.toUpperCase()}</span> },
              { title: 'Processed By', key: 'promotedByName' },
              { title: 'Date Logged', key: 'promotedAt', render: (val) => new Date(val).toLocaleString() }
            ]}
            data={promotionHistory}
            emptyMessage="No promotion log reports recorded."
          />
        </Card>
      )}

      {/* Tab Contents: Past Performance History */}
      {activeTab === 'past' && (
        <div className="dashboard-layout-main">
          {/* Left Column: Select student */}
          <div className="widget-section">
            <Card title="1. Select Student" subtitle="Search student register to load view-only archives.">
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Filter student..."
                  value={pastSearch}
                  onChange={(e) => setPastSearch(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                <Table
                  columns={[
                    { title: 'Name', key: 'name', render: (val) => <strong>{val}</strong> },
                    { title: 'Roll No', key: 'roll_number' },
                    { title: 'Status', key: 'status', render: (val) => <span className={`badge ${val === 'Completed Schooling' ? 'badge-success' : 'badge-secondary'}`}>{val || 'Enrolled'}</span> }
                  ]}
                  data={filteredPastStudents}
                  emptyMessage="No matching students."
                  rowClick={(row) => handlePastStudentSelect(row)}
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Historical view */}
          <div className="widget-section">
            <Card title="2. Past Performance Logs" subtitle={selectedPastStudent ? `Historical snapshots for ${selectedPastStudent.name}` : "Details will load here."}>
              {selectedPastStudent ? (
                loadingPast ? (
                  <Loader size="small" text="Loading historical archives..." />
                ) : pastRecords.length > 0 ? (
                  <div>
                    {/* Academic year selection */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      {pastRecords.map((rec) => (
                        <button
                          key={rec.id}
                          onClick={() => setSelectedPastRecord(rec)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '4px',
                            border: '1px solid var(--primary)',
                            background: selectedPastRecord?.id === rec.id ? 'var(--primary)' : 'transparent',
                            color: selectedPastRecord?.id === rec.id ? 'white' : 'var(--primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Year: {rec.academic_year}
                        </button>
                      ))}
                    </div>

                    {selectedPastRecord && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Details card */}
                        <div style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div className="grid-2-cols" style={{ gap: '1rem', fontSize: '0.9rem' }}>
                            <div><strong>Previous Class:</strong> {selectedPastRecord.previous_class_name}</div>
                            <div><strong>Academic Year:</strong> {selectedPastRecord.academic_year}</div>
                          </div>
                        </div>

                        {/* Metrics summaries */}
                        <div className="grid-2-cols" style={{ gap: '1rem' }}>
                          <Card title="Academic Summary" style={{ margin: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                              <div>📊 <strong>Average Score:</strong> {selectedPastRecord.marks_summary?.average_score || 0}%</div>
                              <div>🏆 <strong>Total Score:</strong> {selectedPastRecord.marks_summary?.total_marks || 0} / {selectedPastRecord.marks_summary?.max_score || 0}</div>
                            </div>
                          </Card>

                          <Card title="Attendance Summary" style={{ margin: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                              <div>📅 <strong>Attendance Rate:</strong> {selectedPastRecord.attendance_summary?.percentage || 100}%</div>
                              <div>✔️ <strong>Present:</strong> {selectedPastRecord.attendance_summary?.present_days || 0} Days</div>
                              <div>❌ <strong>Absent:</strong> {selectedPastRecord.attendance_summary?.absent_days || 0} Days</div>
                            </div>
                          </Card>
                        </div>

                        {/* Subject marks nested details */}
                        <Card title="Subject Mark Details" style={{ margin: 0 }}>
                          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            <Table
                              columns={[
                                { title: 'Subject', key: 'subject' },
                                { title: 'Exam Type', key: 'type' },
                                { title: 'Score', key: 'score', render: (val, row) => `${val} / ${row.max_score}` }
                              ]}
                              data={selectedPastRecord.marks_summary?.subjects || []}
                              emptyMessage="No subject marks archived for this record."
                            />
                          </div>
                        </Card>

                        {/* Complaints */}
                        <Card title="Behavior & Discipline Observations" style={{ margin: 0 }}>
                          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>⚠️ <strong>Complaint Ledger:</strong> {selectedPastRecord.complaint_summary?.total || 0} Total ({selectedPastRecord.complaint_summary?.resolved || 0} Resolved, {selectedPastRecord.complaint_summary?.pending || 0} Pending)</div>
                            <div style={{ marginTop: '0.5rem' }}>
                              <strong>Teacher Remarks History:</strong>
                              <pre style={{
                                marginTop: '0.4rem',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'inherit',
                                backgroundColor: 'var(--bg-primary)',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)'
                              }}>
                                {selectedPastRecord.teacher_remarks}
                              </pre>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No historical past performance snapshots found for this student.
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Select a student from the register on the left to view their past academic records.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default Promotion;
