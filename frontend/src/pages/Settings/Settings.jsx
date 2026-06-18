import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/Cards/Card';
import FormInput from '../../components/Forms/FormInput';
import Button from '../../components/Buttons/Button';

const Settings = () => {
  const { user } = useOutletContext();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Settings Form State
  const [preferences, setPreferences] = useState({
    language: 'en',
    emailAlerts: true,
    smsAlerts: false,
    publicProfile: true,
    compactLayout: false
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = (e) => {
    setTheme(e.target.checked ? 'dark' : 'light');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    alert('Preferences locked and saved reactively!');
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM PARAMETERS</span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
          Console & Preferences Settings
        </h2>
      </div>

      <div className="dashboard-layout-main">
        {/* Main Configuration form */}
        <div className="widget-section">
          <Card title="Interface & Preference Settings" subtitle="Adjust panel layouts, notification alerts, and text rendering.">
            <form onSubmit={handleSaveSettings} className="form-container">
              
              <FormInput
                label="Enable Console Dark Theme"
                name="darkTheme"
                type="switch"
                value={theme === 'dark'}
                onChange={handleToggleTheme}
                helperText="Switch between sleek dark canvas aesthetics and clear primary backgrounds."
              />

              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }}></div>

              <FormInput
                label="System Display Language"
                name="language"
                type="select"
                value={preferences.language}
                onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                options={[
                  { value: 'en', label: 'English (US School District Standard)' },
                  { value: 'es', label: 'Español (Spanish Translation)' },
                  { value: 'fr', label: 'Français (French Translation)' }
                ]}
              />

              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }}></div>

              <div className="form-group">
                <span className="form-label" style={{ marginBottom: '0.5rem' }}>Automated Communications Grid</span>
                
                <FormInput
                  label="Email Notification Bulletins"
                  name="emailAlerts"
                  type="switch"
                  value={preferences.emailAlerts}
                  onChange={(e) => setPreferences(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                  helperText="Send daily marks ledger updates and noticeboard highlights to my inbox."
                  className="mb-1"
                />

                <FormInput
                  label="Mobile SMS Urgent Bulletins"
                  name="smsAlerts"
                  type="switch"
                  value={preferences.smsAlerts}
                  onChange={(e) => setPreferences(prev => ({ ...prev, smsAlerts: e.target.checked }))}
                  helperText="Send emergency closures, bus delays, or safety notices directly as SMS alerts."
                />
              </div>

              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }}></div>

              <FormInput
                label="Enable Compact Dashboard Grid Layout"
                name="compactLayout"
                type="switch"
                value={preferences.compactLayout}
                onChange={(e) => setPreferences(prev => ({ ...prev, compactLayout: e.target.checked }))}
                helperText="Compress Statistics Cards margins to display multi-row dashboards at a glance."
              />

              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%', height: '42px', marginTop: '1rem' }}
              >
                💾 Lock Preferences & Save
              </Button>

            </form>
          </Card>
        </div>

        {/* Sidebar Info card */}
        <div className="widget-section">
          <Card title="Session Control" subtitle="Manage your active console session.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <Button
                variant="danger"
                style={{ width: '100%', height: '40px', marginTop: '0.5rem' }}
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
              >
                🚪 Sign Out & Log Out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Settings;
