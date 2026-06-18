import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Footer from '../../components/Footer/Footer';
import Loader from '../../components/Loaders/Loader';
import Modal from '../../components/Modals/Modal';
import Button from '../../components/Buttons/Button';
import { api } from '../../services/api';

const TeacherLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teacherSubject, setTeacherSubject] = useState('');
  const [showSubjectChooseModal, setShowSubjectChooseModal] = useState(false);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'teacher') {
      navigate(`/login?unauthorized=true&role=${currentUser.role}`);
    } else {
      setUser(currentUser);
      setLoading(false);
      // Fetch teacher profile to get locked subject
      api.getTeacherProfileSelf().then(profile => {
        if (profile) {
          if (profile.rawSubject === 'Science' && !localStorage.getItem('active_science_subject')) {
            setShowSubjectChooseModal(true);
          }
          if (profile.subject) {
            setTeacherSubject(profile.subject);
          }
        }
      }).catch(() => {});
    }
  }, [navigate]);

  const handleSelectDiscipline = (discipline) => {
    localStorage.setItem('active_science_subject', discipline);
    setTeacherSubject(discipline);
    setShowSubjectChooseModal(false);
    window.location.reload();
  };

  if (loading) {
    return <Loader fullPage size="large" text="Validating faculty credentials..." />;
  }

  return (
    <div className="app-container">
      <Sidebar
        role="teacher"
        activeUser={user}
        teacherSubject={teacherSubject}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <Navbar
          activeUser={user}
          onSidebarToggle={() => setSidebarOpen(prev => !prev)}
        />
        
        <main className="page-container">
          <Outlet context={{ user }} />
        </main>

        <Footer />
      </div>

      <Modal
        isOpen={showSubjectChooseModal}
        onClose={() => {}}
        title="Science Subject Specialization"
      >
        <div style={{ padding: '0.5rem 0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Welcome, Science Instructor! Please choose which discipline you want to view/manage for this session. You can switch this at any time from the navigation bar.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button
              variant="primary"
              onClick={() => handleSelectDiscipline('Biology')}
              style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 'bold' }}
            >
              🧬 Biology
            </Button>
            <Button
              variant="success"
              onClick={() => handleSelectDiscipline('Physics')}
              style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 'bold' }}
            >
              ⚛️ Physics
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherLayout;
