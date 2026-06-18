import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import Footer from '../../components/Footer/Footer';
import Loader from '../../components/Loaders/Loader';
import { api } from '../../services/api';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'admin') {
      // Role mismatch redirection
      navigate(`/login?unauthorized=true&role=${currentUser.role}`);
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }, [navigate]);

  if (loading) {
    return <Loader fullPage size="large" text="Validating admin credentials..." />;
  }

  return (
    <div className="app-container">
      <Sidebar
        role="admin"
        activeUser={user}
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
    </div>
  );
};

export default AdminLayout;
