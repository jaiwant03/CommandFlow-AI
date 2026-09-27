import React, { useState } from 'react';
import { getCurrentUser } from '../services/authService';
import HandwrittenHeading from '../components/HandwrittenHeading';
import { Save, Globe, Clock, Bell, User, ShieldCheck } from 'lucide-react';
import '../styles/global.css';

const Settings = () => {
  const user = getCurrentUser() || { name: 'CommandFlow User', email: 'user@commandflow.ai' };
  const [language, setLanguage] = useState('english');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <HandwrittenHeading text="Settings" size="normal" withFlourish={true} />
        <p className="page-subtitle">Configure application language, timezone, notification preferences, and account info.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={20} color="var(--primary)" />
            Application Preferences
          </h3>

          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>Default Language</label>
              <select
                className="form-input"
                style={{ width: '100%' }}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="english">English</option>
                <option value="tamil">Tamil</option>
                <option value="tanglish">Tanglish (Tamil in English Script)</option>
                <option value="auto">Auto-Detect</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>Default Timezone</label>
              <select
                className="form-input"
                style={{ width: '100%' }}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Used for scheduling natural language time commands.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span>Enable Execution Email & Telegram Notifications</span>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>Save Preferences</span>
              </button>
              {saved && <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>✓ Preferences Saved Successfully!</span>}
            </div>
          </form>
        </div>

        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary)" />
            Account Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Name:</span><br />
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user.name}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Email:</span><br />
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user.email}</strong>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>System Status:</span><br />
              <strong style={{ color: 'var(--primary-dark)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                <ShieldCheck size={16} /> JWT Authentication Active
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
