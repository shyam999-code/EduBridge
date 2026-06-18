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

const PrivacyVerificationForm = ({ parentUserId, onLinked }) => {
  const [childName, setChildName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [className, setClassName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!childName || !rollNumber || !className) {
      setError('Please fill in all verification fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await api.verifyChild({
        childName,
        rollNumber,
        className
      });
      alert('Privacy verification successful! Your child profile has been linked to your account.');
      onLinked();
    } catch (err) {
      setError(err.message || 'Verification failed. Student details could not be matched.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px', margin: '2rem auto' }}>
      <Card
        title="Privacy & Confidentiality Verification"
        subtitle="Match your ward's student credentials to unlock the parent console."
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
          💡 <strong>Confidentiality Note:</strong> To safeguard student academic details and disciplinary logs, guardians are required to authenticate their child's records by entering their official Name, Roll Number, and Class Designation.
        </div>

        {error && (
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
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-container">
          <FormInput
            label="Son or Daughter's Full Name"
            name="childName"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="e.g. Leo Sterling"
            required
          />

          <FormInput
            label="Student Roll Number"
            name="rollNumber"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="e.g. ET-2026-1042"
            required
          />

          <FormInput
            label="Class Designation (e.g. 10A, 6-A)"
            name="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. 10A"
            required
          />

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%', height: '44px', marginTop: '0.5rem' }}
          >
            {loading ? 'Verifying Student Identity...' : '🔒 Verify & Unlock Console'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

const ParentLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parentProfile, setParentProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    try {
      const profile = await api.getParentProfileSelf();
      setParentProfile(profile);
    } catch (err) {
      console.error('Failed to load parent profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'parent') {
      navigate(`/login?unauthorized=true&role=${currentUser.role}`);
    } else {
      setUser(currentUser);
      setLoading(false);
      fetchProfile();
    }
  }, [navigate]);

  if (loading || loadingProfile) {
    return <Loader fullPage size="large" text="Validating parent credentials..." />;
  }

  const childLinked = !!parentProfile?.child_id;

  return (
    <div className="app-container">
      <Sidebar
        role="parent"
        activeUser={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        childLinked={childLinked}
      />

      <div className="main-content">
        <Navbar
          activeUser={user}
          onSidebarToggle={() => setSidebarOpen(prev => !prev)}
        />
        
        <main className="page-container">
          {childLinked ? (
            <Outlet context={{ user, parentProfile, refreshProfile: fetchProfile }} />
          ) : (
            <PrivacyVerificationForm parentUserId={user.id} onLinked={fetchProfile} />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default ParentLayout;
