import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import Loader from '../../components/Loaders/Loader';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import { api } from '../../services/api';

const Profile = () => {
  const { user } = useOutletContext();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  
  // Editable fields state
  const [editForm, setEditForm] = useState({
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfileSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    api.updateProfile(profile.role, editForm).then(res => {
      setLoading(false);
      setProfile(res.profile);
      alert('Contact information updated reactively in localStorage!');
    });
  };

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim() === '') {
      alert('Please enter a valid password.');
      return;
    }
    setPasswordLoading(true);
    api.changePassword(newPassword)
      .then(() => {
        setPasswordLoading(false);
        setNewPassword('');
        alert('Password updated successfully!');
      })
      .catch((err) => {
        setPasswordLoading(false);
        alert(err.message || 'Failed to update password. Please try again.');
      });
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>USER ACCOUNT</span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
          My Account Profile Card
        </h2>
      </div>

      <div className="dashboard-layout-main">
        {/* Left Side: Avatar Display Details Card */}
        <div className="widget-section">
          <Card style={{ padding: '2rem', textAlign: 'center', position: 'relative' }}>
            {/* Banner block mockup */}
            <div style={{
              height: '110px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              margin: '-2rem -2rem 0 -2rem',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
            }}></div>

            <div style={{ marginTop: '-50px', position: 'relative', display: 'inline-block' }}>
              <img
                src={profile.avatar}
                alt={profile.name}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--bg-secondary)',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              <button
                title="Mock upload image"
                onClick={() => alert('Photo upload trigger activated. Select file placeholder.')}
                style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: '2px solid var(--bg-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem'
                }}
              >
                📸
              </button>
            </div>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, marginTop: '1rem' }}>
              {profile.name}
            </h3>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--primary)',
              letterSpacing: '0.05em',
              display: 'block',
              marginTop: '4px'
            }}>
              {profile.designation}
            </span>
            
            <span style={{
              display: 'inline-block',
              padding: '0.25rem 1rem',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginTop: '0.75rem'
            }}>
              School ID: {profile.rollNumber || 'ET-ADM-9041'}
            </span>

            {/* Academic stats section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              borderTop: '1px solid var(--border-color)',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              textAlign: 'left',
              fontSize: '0.85rem'
            }}>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>EMAIL ADDRESS:</span>
                <strong style={{ wordBreak: 'break-all' }}>{profile.email}</strong>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>CONTACT HOTLINE:</span>
                <strong>{profile.phone}</strong>
              </div>
              <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>REGISTRATION ADDRESS:</span>
                <strong>{profile.address}</strong>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Edit Form Card */}
        <div className="widget-section">
          <Card title="Update Contact Information" subtitle="Keep school records and phone grids updated.">
            {loading ? (
              <Loader size="medium" text="Saving contact sheets..." />
            ) : (
              <form onSubmit={handleUpdateProfileSubmit} className="form-container">
                <FormInput
                  label="Registered Email Address"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />

                <FormInput
                  label="Registered Phone Number"
                  name="phone"
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />

                <FormInput
                  label="Registered Home Address"
                  name="address"
                  type="textarea"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  style={{ width: '100%', height: '42px', marginTop: '0.5rem' }}
                >
                  💾 Save Contact Settings
                </Button>
              </form>
            )}
          </Card>

          {profile.role === 'student' && (
            <div style={{ marginTop: '2rem' }}>
              <Card title="Change Account Password" subtitle="Update your password for future console logins.">
                <form onSubmit={handleChangePasswordSubmit} className="form-container">
                  <FormInput
                    label="New Secure Password"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={passwordLoading}
                    style={{ width: '100%', height: '42px', marginTop: '0.5rem' }}
                  >
                    {passwordLoading ? 'Updating Password...' : '🔒 Update Password'}
                  </Button>
                </form>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
