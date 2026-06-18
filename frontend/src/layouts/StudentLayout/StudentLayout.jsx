import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Footer from '../../components/Footer/Footer';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import Card from '../../components/Cards/Card';
import { api } from '../../services/api';
import ChatbotWidget from '../../components/ChatbotWidget/ChatbotWidget';

const StudentLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'student') {
      navigate(`/login?unauthorized=true&role=${currentUser.role}`);
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }, [navigate]);

  if (loading) {
    return <Loader fullPage size="large" text="Validating student credentials..." />;
  }

  return (
    <div className="app-container">
      <Sidebar
        role="student"
        activeUser={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        studentVerified={true}
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
      <ChatbotWidget user={user} />
    </div>
  );
};

export default StudentLayout;
