import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { Bot, ArrowRight, Lock, Mail, Sparkles, Eye, EyeOff, AlertCircle, ShieldCheck, Zap, Radio } from 'lucide-react';
import HandwrittenIntro from '../components/HandwrittenIntro';
import '../styles/global.css';
import '../styles/auth.css';

const Login = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showIntro) {
    return (
      <HandwrittenIntro
        duration={5000}
        onComplete={() => setShowIntro(false)}
      />
    );
  }

  return (
    <div className="auth-page-container">
      {/* Dynamic Ambient 3D Glowing Orbs */}
      <div className="auth-ambient-orb auth-ambient-orb-1" aria-hidden="true" />
      <div className="auth-ambient-orb auth-ambient-orb-2" aria-hidden="true" />
      <div className="auth-ambient-orb auth-ambient-orb-3" aria-hidden="true" />

      {/* Modeled 3D Sculpted Card */}
      <div className="auth-modelled-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-pedestal">
            <div className="auth-logo-halo" />
            <div className="auth-logo-box">
              <Bot size={34} strokeWidth={2.2} />
            </div>
          </div>

          <h1 className="auth-brand-title">
            <span>CommandFlow</span>
            <span className="auth-brand-ai">AI</span>
          </h1>

          <div className="auth-subtitle-pill">
            <Sparkles size={13} color="#059669" />
            <span>Voice-to-Action Automation Platform</span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="auth-alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Modeled Form */}
        <form onSubmit={handleLogin} className="auth-form" noValidate>
          {/* Email Field */}
          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="auth-email">
              <span>Email Address</span>
            </label>
            <div className={`auth-input-wrapper ${focusedField === 'email' ? 'is-focused' : ''}`}>
              <div className="auth-input-icon">
                <Mail size={18} />
              </div>
              <input
                id="auth-email"
                type="email"
                className="auth-input-field"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="auth-password">
              <span>Password</span>
            </label>
            <div className={`auth-input-wrapper ${focusedField === 'password' ? 'is-focused' : ''}`}>
              <div className="auth-input-icon">
                <Lock size={18} />
              </div>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Auxiliary Options: Remember Me & Forgot Password */}
          <div className="auth-aux-row">
            <label className="auth-remember-label">
              <input
                type="checkbox"
                className="auth-checkbox-custom"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <span className="auth-forgot-link" style={{ opacity: 0.85, cursor: 'pointer' }} onClick={() => setError('Contact your workspace administrator to reset your credentials.')}>
              Forgot password?
            </span>
          </div>

          {/* Modeled 3D Tactile Submit Button */}
          <button
            type="submit"
            className="auth-modelled-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="auth-spinner" />
                <span>Authenticating Workspace...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight size={18} strokeWidth={2.4} />
              </>
            )}
          </button>
        </form>

        {/* Modeled Card Footer */}
        <div className="auth-footer">
          <div className="auth-switch-text">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-switch-link">
              Create Account
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setShowIntro(true)}
            className="auth-replay-pill"
            title="Replay the 5-second handwritten CommandFlow AI signature animation"
          >
            <Sparkles size={14} color="#10B981" />
            <span>Replay Handwritten Intro (5s)</span>
          </button>

          {/* Trust & Capabilities Bar */}
          <div className="auth-features-bar">
            <div className="auth-feature-chip">
              <Radio size={12} color="#10B981" />
              <span>Voice Automation</span>
            </div>
            <div className="auth-feature-chip">
              <Zap size={12} color="#0284C7" />
              <span>Zero Latency</span>
            </div>
            <div className="auth-feature-chip">
              <ShieldCheck size={12} color="#059669" />
              <span>Enterprise Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;