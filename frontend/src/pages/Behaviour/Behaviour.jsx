import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Table from '../../components/Tables/Table';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import Modal from '../../components/Modals/Modal';
import { api } from '../../services/api';

const Behaviour = () => {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddRemark, setShowAddRemark] = useState(false);
  const [students, setStudents] = useState([]);
  const [spotlightRecords, setSpotlightRecords] = useState([]);
  
  // Remark Form state
  const [remarkForm, setRemarkForm] = useState({
    student_id: '',
    type: 'positive',
    title: '',
    description: '',
  });

  const loadData = async () => {
    try {
      const behaviourRes = await api.getBehaviourData();
      setData(behaviourRes);

      const spotlightRes = await api.getBehaviourSpotlight();
      setSpotlightRecords(spotlightRes);

      if (user.role === 'teacher' || user.role === 'admin') {
        const studentList = await api.listStudents();
        setStudents(studentList);
        if (studentList.length > 0) {
          setRemarkForm(prev => ({ ...prev, student_id: studentList[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load behavior observations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, []);

  if (loading) {
    return <Loader size="medium" text="Accessing conduct observations..." />;
  }

  const handleRemarkSubmit = async (e) => {
    e.preventDefault();
    if (!remarkForm.student_id || !remarkForm.title || !remarkForm.description) return;

    try {
      setLoading(true);
      const points = remarkForm.type === 'positive' ? 10 : -5;
      await api.createBehaviourReport({
        student_id: remarkForm.student_id,
        type: remarkForm.type,
        title: remarkForm.title,
        description: remarkForm.description,
        points: points,
        author_id: user.id
      });

      setShowAddRemark(false);
      setRemarkForm({
        student_id: students[0]?.id || '',
        type: 'positive',
        title: '',
        description: '',
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to log behavior remark.');
      setLoading(false);
    }
  };

  const handleDeleteRemark = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this behavior observation? This will permanently remove the log and revert the associated conduct points.')) {
      return;
    }
    try {
      setLoading(true);
      await api.deleteBehaviourReport(id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete behavior remark.');
      setLoading(false);
    }
  };

  const isFaculty = user.role === 'teacher' || user.role === 'admin';

  return (
    <>
      <div className="flex-between">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONDUCT REPORT</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
            {isFaculty ? 'Student Behavior Tracker' : 'My Conduct Index & Observations'}
          </h2>
        </div>
        {isFaculty && (
          <Button variant="primary" onClick={() => setShowAddRemark(true)}>
            ✚ Log Behavior Observation
          </Button>
        )}
      </div>

      <div className="dashboard-layout-main">
        {/* Main Area: Timeline */}
        <div className="widget-section">
          {/* Conduct statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <Card variant="stats" label="Conduct Score" number={data.points} icon="★" trend={{ direction: 'up', value: 'Excellent', label: 'standing', color: 'success' }} />
            <Card variant="stats" label="Accolades (Positive)" number={data.positiveCount} icon="🏆" trend={{ direction: 'up', value: '+14 logs', label: 'registered', color: 'success' }} />
            <Card variant="stats" label="Infractions (Negative)" number={data.negativeCount} icon="⚠️" trend={{ direction: 'down', value: '2 logs', label: 'registered', color: 'danger' }} />
          </div>

          <Card title="Conduct & Observations Timeline" subtitle="Timeline tracking teacher notations, safety practices, and peer tutoring logs.">
            <div className="timeline-container" style={{ paddingLeft: '1rem' }}>
              <div className="timeline-line"></div>

              {data.observations.map((obs, idx) => (
                <div key={idx} className={`timeline-node ${obs.type}`}>
                  <div className="timeline-badge">
                    {obs.type === 'positive' ? '★' : '⚠'}
                  </div>
                  <div className="timeline-content" style={{ position: 'relative' }}>
                    {isFaculty && (
                      <button
                        onClick={() => handleDeleteRemark(obs.id)}
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '0.25rem 0.35rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'var(--danger-light)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        title="Delete observation"
                      >
                        🗑️
                      </button>
                    )}
                    <span className="timeline-time">{obs.date}</span>
                    <h4 className="timeline-title" style={{ color: obs.type === 'positive' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {obs.studentName && (
                        <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{obs.studentName} ({obs.studentClass}) :</span>
                      )}
                      <span>{obs.title}</span>
                      <span className="badge" style={{
                        fontSize: '0.65rem',
                        backgroundColor: obs.type === 'positive' ? 'var(--success-light)' : 'var(--danger-light)',
                        color: obs.type === 'positive' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {obs.type === 'positive' ? '+ Conduct' : '- Infraction'}
                      </span>
                    </h4>
                    <p style={{ marginTop: '0.5rem', lineHeight: 1.45 }}>{obs.desc}</p>
                    <span className="timeline-author">Logged by {obs.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar widgets */}
        <div className="widget-section">
          <Card title="Behavior Index Criteria" subtitle="School conduct ranking parameters.">
            <div className="behavior-meter-container">
              <div className="behavior-meter-header">
                <span>School Pride & Citizenship</span>
                <span className="text-success">92%</span>
              </div>
              <div className="behavior-meter-track">
                <div className="behavior-meter-fill positive" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div className="behavior-meter-container">
              <div className="behavior-meter-header">
                <span>Classroom Cooperation</span>
                <span className="text-success">88%</span>
              </div>
              <div className="behavior-meter-track">
                <div className="behavior-meter-fill positive" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div className="behavior-meter-container">
              <div className="behavior-meter-header">
                <span>Punctuality & Materials Prep</span>
                <span className="text-warning">75%</span>
              </div>
              <div className="behavior-meter-track">
                <div className="behavior-meter-fill negative" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className="glass-info-box" style={{ backgroundColor: 'var(--primary-light)', padding: '1rem', marginTop: '1rem', borderRadius: 'var(--radius-md)' }}>
              <h5 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>School Award Standing</h5>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Leo Sterling is eligible for the annual <strong>Citizenship Shield</strong> given his active calculus peer mentoring program and exceptional code ratings.
              </p>
            </div>
          </Card>

          <Card title="🌟 Helping Nature Spotlight" subtitle="Inspiring conduct commendations from across the school to motivate peers.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem', marginTop: '0.75rem' }}>
              {spotlightRecords.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No positive accolades registered yet.</p>
              ) : (
                spotlightRecords.slice(0, 5).map((spot, idx) => (
                  <div key={idx} className="glass" style={{
                    padding: '0.75rem 1rem',
                    borderLeft: '4px solid var(--success)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    boxShadow: 'var(--shadow-xs)',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong style={{ color: 'var(--success)' }}>{spot.studentName}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{spot.studentClass}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                      {spot.title}
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {spot.desc}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right', fontStyle: 'italic' }}>
                      - Logged by {spot.author}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Log Remark Modal */}
      <Modal
        isOpen={showAddRemark}
        onClose={() => setShowAddRemark(false)}
        title="Log Pupil Behavior Observation"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setShowAddRemark(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRemarkSubmit}>Log Notation</Button>
          </>
        }
      >
        <form onSubmit={handleRemarkSubmit} className="form-container">
          <FormInput
            label="Target Student"
            name="student_id"
            type="select"
            value={remarkForm.student_id}
            onChange={(e) => setRemarkForm(prev => ({ ...prev, student_id: e.target.value }))}
            options={students.map(s => ({ value: s.id, label: `${s.name} (${s.roll_number})` }))}
            required
          />

          <FormInput
            label="Observation Category"
            name="type"
            type="select"
            value={remarkForm.type}
            onChange={(e) => setRemarkForm(prev => ({ ...prev, type: e.target.value }))}
            options={[
              { value: 'positive', label: 'Accolade / Positive Commendation (+ Points)' },
              { value: 'negative', label: 'Infraction / Classroom Warning (- Points)' }
            ]}
            required
          />

          <FormInput
            label="Accolade or Infraction Title"
            name="title"
            type="text"
            value={remarkForm.title}
            onChange={(e) => setRemarkForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Exceptional Peer Mentoring, Unprepared for Class"
            required
          />

          <FormInput
            label="Detailed Descriptive Observations"
            name="description"
            type="textarea"
            value={remarkForm.description}
            onChange={(e) => setRemarkForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Provide descriptive details of what transpired, safety elements, or cooperative support actions noticed."
            required
          />
        </form>
      </Modal>
    </>
  );
};

export default Behaviour;
