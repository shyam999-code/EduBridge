import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';
import Card from '../../components/Cards/Card';
import Loader from '../../components/Loaders/Loader';
import { api } from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unauthorizedMsg, setUnauthorizedMsg] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('Telugu');

  const [isAdminRegisterMode, setIsAdminRegisterMode] = useState(false);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminSchoolName, setAdminSchoolName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [registrationSuccessMsg, setRegistrationSuccessMsg] = useState('');

  useEffect(() => {
    // Check if redirect was due to unauthorized access
    if (searchParams.get('unauthorized') === 'true') {
      setUnauthorizedMsg(true);
    }
  }, [searchParams]);

  // Demo accounts helper to make reviewing extremely simple
  const handleQuickDemo = (demoRole) => {
    setRole(demoRole);
    setUserId('');
    setPassword('');
    setError('');
    setUnauthorizedMsg(false);
    setIsAdminRegisterMode(false);
    setRegistrationSuccessMsg('');
  };

  const handleAdminRegisterSubmit = (e) => {
    e.preventDefault();
    if (!adminFullName || !adminSchoolName || !adminEmail || !adminMobile || !adminPassword || !adminConfirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (adminPassword !== adminConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setRegistrationSuccessMsg('');

    api.registerAdminRequest(adminFullName, adminSchoolName, adminEmail, adminMobile, adminPassword)
      .then((res) => {
        setLoading(false);
        setRegistrationSuccessMsg(res.message || 'Registration Request Submitted Successfully. Waiting for Super Admin Approval.');
        // Reset registration fields
        setAdminFullName('');
        setAdminSchoolName('');
        setAdminEmail('');
        setAdminMobile('');
        setAdminPassword('');
        setAdminConfirmPassword('');
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || 'Failed to submit registration request.');
      });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);
    setError('');
    setUnauthorizedMsg(false);

    const authPromise = isRegisterMode
      ? api.register(userId, password, role)
      : api.login(userId, password, role);

    authPromise
      .then(async (res) => {
        if (res.success) {
          if (role === 'teacher') {
            try {
              await api.updateTeacherProfileSelf({ subject: selectedSubject });
            } catch (err) {
              console.error('Failed to auto-update teacher subject:', err);
            }
          }
          setLoading(false);
          navigate(`/${res.user.role}/dashboard`);
        } else {
          setLoading(false);
          setError(isRegisterMode ? 'Registration failed.' : 'Invalid login credentials.');
        }
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || 'Connection failed. Please try again.');
      });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.08) 0%, rgba(9, 13, 22, 0.02) 90%), var(--bg-primary)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blur Orbs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'rgba(37, 99, 235, 0.06)',
        filter: 'blur(100px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '45vw',
        height: '45vw',
        borderRadius: '50%',
        background: 'rgba(124, 58, 237, 0.05)',
        filter: 'blur(120px)',
        zIndex: 0
      }} />

      {/* Main Split-Panel Frame */}
      <div className="glass" style={{
        width: '1000px',
        maxWidth: '100%',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-premium)',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        overflow: 'hidden',
        minHeight: '580px',
        zIndex: 1
      }}>
        <style>{`
          @media (max-width: 768px) {
            .login-branding-panel {
              display: none !important;
            }
            .glass {
              grid-template-columns: 1fr !important;
              max-width: 480px !important;
              min-height: auto !important;
            }
          }
        `}</style>

        {/* Left Side: Branding Panel */}
        <div className="login-branding-panel" style={{
          backgroundColor: 'var(--bg-sidebar)',
          padding: '4rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#f8fafc',
          position: 'relative',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '1.5rem' }}>
            {/* School Related Logo (Graduation Cap) */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
              marginBottom: '0.5rem'
            }}>
              🎓
            </div>

            <div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.8rem',
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                marginBottom: '0.75rem'
              }}>
                EduBridge
              </h1>
              <p style={{
                fontFamily: 'var(--font-main)',
                fontSize: '1.15rem',
                fontWeight: 500,
                color: 'var(--sidebar-text-muted)',
                lineHeight: 1.45,
                maxWidth: '340px'
              }}>
                A Complete School Management & Parent Engagement Portal
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sidebar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select a Demo Role to Login:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Admin', 'Teacher', 'Parent', 'Student'].map((r) => {
                const isSelected = role === r.toLowerCase();
                return (
                  <button
                    key={r}
                    onClick={() => handleQuickDemo(r.toLowerCase())}
                    style={{
                      backgroundColor: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      padding: '0.4rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--primary)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div style={{
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-secondary)',
        }} className="login-card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700 }}>
              {isRegisterMode ? 'Account Registration' : 'Account Login'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {isRegisterMode
                ? 'Create a new console profile to manage classes, sheets, and logs.'
                : 'Sign in to manage classes, tracking sheets, and performance logs.'}
            </p>
          </div>

          {unauthorizedMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--warning-light)',
              borderLeft: '4px solid var(--warning)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              color: 'var(--warning)',
              fontWeight: 500
            }}>
              Your active session doesn't permit accessing this layout. Please log in as the requested role.
            </div>
          )}

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
              {error}
            </div>
          )}

          {registrationSuccessMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              borderLeft: '4px solid #16a34a',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              color: '#16a34a',
              fontWeight: 500
            }}>
              {registrationSuccessMsg}
            </div>
          )}

          {role === 'admin' && isAdminRegisterMode ? (
            <form onSubmit={handleAdminRegisterSubmit} className="form-container">
              <FormInput
                label="Full Name *"
                name="adminFullName"
                type="text"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
              <FormInput
                label="School Name *"
                name="adminSchoolName"
                type="text"
                value={adminSchoolName}
                onChange={(e) => setAdminSchoolName(e.target.value)}
                placeholder="e.g. Greenfield Academy"
                required
              />
              <FormInput
                label="Email Address *"
                name="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. john.doe@greenfield.edu"
                required
              />
              <FormInput
                label="Mobile Number *"
                name="adminMobile"
                type="text"
                value={adminMobile}
                onChange={(e) => setAdminMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                required
              />
              <FormInput
                label="Password *"
                name="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <FormInput
                label="Confirm Password *"
                name="adminConfirmPassword"
                type="password"
                value={adminConfirmPassword}
                onChange={(e) => setAdminConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                style={{ marginTop: '1rem', width: '100%', height: '46px' }}
              >
                {loading ? 'Submitting Registration Request...' : 'Submit Registration'}
              </Button>
              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
                Already have an admin account?{' '}
                <span
                  onClick={() => {
                    setIsAdminRegisterMode(false);
                    setError('');
                    setRegistrationSuccessMsg('');
                  }}
                  style={{
                    color: 'var(--primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sign In Here
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="form-container">
              <FormInput
                label={role === 'parent' ? "Student ID *" : "User ID"}
                name="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={role === 'parent' ? "e.g. 8D46" : "e.g. admin, teacher, student"}
                required
              />

              <FormInput
                label={role === 'parent' ? "Parent Mobile Number *" : "Password"}
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={role === 'parent' ? "e.g. 9988776655" : "••••••••"}
                required
              />

              <FormInput
                label="Account User Role"
                name="role"
                type="select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { value: 'admin', label: 'School Administrator (Admin)' },
                  { value: 'teacher', label: 'Faculty Teacher' },
                  { value: 'parent', label: 'Parent / Guardian' },
                  { value: 'student', label: 'Enrolled Pupil (Student)' }
                ]}
                required
              />

              {role === 'teacher' && (
                <FormInput
                  label="Primary Subject Area"
                  name="subject"
                  type="select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  options={[
                    { value: 'Telugu', label: '1. Telugu' },
                    { value: 'Hindi', label: '2. Hindi' },
                    { value: 'English', label: '3. English' },
                    { value: 'Mathematics', label: '4. Mathematics' },
                    { value: 'Science', label: '5. Science (Biology & Physics)' },
                    { value: 'Social Studies', label: '6. Social Studies' },
                    { value: 'Sports', label: '7. Sports' }
                  ]}
                  required
                />
              )}


              <div className="flex-between" style={{ fontSize: '0.8rem', fontWeight: 500, marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" style={{ accentColor: 'var(--primary)' }} /> Remember me
                </label>
                <a href="#forgot" onClick={(e) => {
                  e.preventDefault();
                  setError('For security reviews, please click the demo role pills on the left side to populate and sign in instantly.');
                }} style={{ fontWeight: 600 }}>Forgot Password?</a>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                style={{ marginTop: '1rem', width: '100%', height: '46px' }}
              >
                {loading
                  ? (isRegisterMode ? 'Registering Account...' : 'Authenticating Access...')
                  : (isRegisterMode ? 'Register & Sign In' : 'Sign In To Console')}
              </Button>

              {role === 'admin' && (
                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                  <span
                    onClick={() => {
                      setIsAdminRegisterMode(true);
                      setError('');
                      setRegistrationSuccessMsg('');
                    }}
                    style={{
                      color: 'var(--primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Register School Admin
                  </span>
                </div>
              )}

              <div style={{
                textAlign: 'center',
                marginTop: '1.25rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                {isRegisterMode ? "Already have an account? " : "New to EduBridge? "}
                <span
                  onClick={() => {
                     setIsRegisterMode(!isRegisterMode);
                    setError('');
                  }}
                  style={{
                    color: 'var(--primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isRegisterMode ? 'Sign In Here' : 'Register Here'}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
