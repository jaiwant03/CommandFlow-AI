import React, { useState } from 'react';
import { getCurrentUser } from '../services/authService';
import HandwrittenHeading from '../components/HandwrittenHeading';
import { Save, Globe, Clock, Bell, User, ShieldCheck, Server, RefreshCw } from 'lucide-react';
import { SERVER_BASE_URL } from '../services/api';
import '../styles/global.css';
import '../styles/settings.css';

const Settings = () => {
  const user = getCurrentUser() || { name: 'CommandFlow User', email: 'user@commandflow.ai' };
  const [language, setLanguage] = useState('english');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [notifications, setNotifications] = useState(true);
  const [customServerUrl, setCustomServerUrl] = useState(() => {
    return localStorage.getItem('commandflow_custom_api_url') || '';
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (customServerUrl.trim()) {
      localStorage.setItem('commandflow_custom_api_url', customServerUrl.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('commandflow_custom_api_url');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container settings-page">
      <div className="settings-header-area">
        <HandwrittenHeading text="Settings" size="normal" withFlourish={true} />
        <p className="settings-subtitle">Configure application language, timezone, notification preferences, and account info.</p>
      </div>

      <div className="settings-grid-layout">
        {/* Main Application Preferences Card */}
        <div className="glass-card settings-card settings-main-card">
          <h3 className="settings-card-title">
            <Globe size={20} color="var(--primary)" />
            <span>Application Preferences</span>
          </h3>

          <form onSubmit={handleSave}>
            <div className="settings-form-group">
              <label className="settings-form-label">
                <Globe size={15} color="#059669" />
                <span>Default Language</span>
              </label>
              <select
                className="settings-form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="english">English</option>
                <option value="tamil">Tamil</option>
                <option value="tanglish">Tanglish (Tamil in English Script)</option>
                <option value="auto">Auto-Detect</option>
              </select>
            </div>

            <div className="settings-form-group">
              <label className="settings-form-label">
                <Clock size={15} color="#0284C7" />
                <span>Default Timezone</span>
              </label>
              <select
                className="settings-form-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
              <span className="settings-form-help">
                Used for scheduling natural language time commands.
              </span>
            </div>

            <div className="settings-form-group">
              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span>Enable Execution Email & Telegram Notifications</span>
              </label>
            </div>

            <div className="settings-server-section">
              <label className="settings-form-label">
                <Server size={15} color="#7C3AED" />
                <span>Backend API Server Endpoint</span>
              </label>
              <input
                type="text"
                className="settings-form-input settings-server-input"
                placeholder="https://commandflow-ai.onrender.com (or http://192.168.1.x:5000)"
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
              />
              <div className="settings-preset-chips">
                <button
                  type="button"
                  className={`settings-preset-btn ${customServerUrl === 'https://commandflow-ai.onrender.com' || (!customServerUrl && SERVER_BASE_URL.includes('onrender.com')) ? 'active' : ''}`}
                  onClick={() => setCustomServerUrl('https://commandflow-ai.onrender.com')}
                >
                  Cloud (Render)
                </button>
                <button
                  type="button"
                  className={`settings-preset-btn ${customServerUrl === 'http://localhost:5000' || (!customServerUrl && SERVER_BASE_URL.includes('localhost:5000')) ? 'active' : ''}`}
                  onClick={() => setCustomServerUrl('http://localhost:5000')}
                >
                  Localhost:5000
                </button>
                {customServerUrl && (
                  <button
                    type="button"
                    className="settings-preset-btn"
                    style={{ color: '#64748B' }}
                    onClick={() => setCustomServerUrl('')}
                  >
                    Reset to Default
                  </button>
                )}
              </div>
              <div className="settings-active-badge">
                <span>Active Connection:</span>
                <strong>{SERVER_BASE_URL}</strong>
              </div>
            </div>

            <div className="settings-actions-bar">
              <button type="submit" className="settings-save-btn">
                <Save size={16} />
                <span>Save Preferences</span>
              </button>
              {saved && (
                <span className="settings-saved-badge">
                  ✓ Preferences Saved Successfully!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Account Details Card */}
        <div className="glass-card settings-card settings-side-card">
          <h3 className="settings-card-title">
            <User size={20} color="var(--primary)" />
            <span>Account Details</span>
          </h3>

          <div className="settings-account-list">
            <div className="settings-account-item">
              <span className="settings-account-label">Full Name</span>
              <strong className="settings-account-value">{user.name}</strong>
            </div>

            <div className="settings-account-item">
              <span className="settings-account-label">Email Address</span>
              <strong className="settings-account-value">{user.email}</strong>
            </div>

            <div className="settings-status-box">
              <span className="settings-account-label">System Authentication</span>
              <strong>
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
