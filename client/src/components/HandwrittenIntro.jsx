import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Zap,
  Radio
} from 'lucide-react';
import { loginUser, getCurrentUser } from '../services/authService';
import '../styles/global.css';
import '../styles/auth.css';
import '../styles/handwrittenIntro.css';

/**
 * HandwrittenIntro Component (Cinematic 3D Intro with Seamless Login Docking)
 * 
 * 1. Intro Stage (0s – 2.5s):
 *    - Exact 3D CommandFlow AI Logo token in the center with 3D Y-axis rotation,
 *      physical extrusion, metallic reflections, and glossy bevel.
 *    - Bold 3D CommandFlow AI text with gradient and shimmer.
 * 2. Docking Transition (2.5s – 3.7s):
 *    - The logo shrinks ("became small"), executes a smooth 3D rotation, and
 *      glides from screen center to attach directly into the logo box of the Login card.
 *    - The text glides and scales to become the Login card header.
 *    - The Login card materializes smoothly around the docked logo.
 * 3. Docked Stage (3.7s+):
 *    - The Login page is fully interactive and ready for credentials input.
 */
const HandwrittenIntro = ({ onComplete, duration = 2800 }) => {
  // dockStage: 'intro' | 'docking' | 'docked'
  const [dockStage, setDockStage] = useState('intro');
  const [dockOffset, setDockOffset] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;
    const isSmall = typeof window !== 'undefined' && window.innerWidth <= 360;
    if (isSmall) return { pedestal: 85, title: 98 };
    if (isMobile) return { pedestal: 100, title: 114 };
    return { pedestal: 180, title: 198 };
  });

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const cardRef = useRef(null);
  const pedestalRef = useRef(null);

  // Calculate dynamic pixel-perfect offset from viewport center to card logo pedestal
  useEffect(() => {
    const calculateOffset = () => {
      const isMobile = window.innerWidth <= 480;
      const isSmallMobile = window.innerWidth <= 360;
      const vh = window.innerHeight;

      let pOffset = 180;
      let tOffset = 198;

      if (isSmallMobile) {
        pOffset = Math.min(85, Math.max(50, Math.round(vh * 0.11)));
        tOffset = pOffset + 12;
      } else if (isMobile) {
        pOffset = Math.min(100, Math.max(65, Math.round(vh * 0.13)));
        tOffset = pOffset + 14;
      } else {
        pOffset = Math.min(210, Math.max(140, Math.round(vh * 0.22)));
        tOffset = pOffset + 18;
      }

      setDockOffset({ pedestal: pOffset, title: tOffset });
    };

    calculateOffset();
    window.addEventListener('resize', calculateOffset);
    return () => window.removeEventListener('resize', calculateOffset);
  }, []);

  // Sequence timer: Play intro then dock into login card
  useEffect(() => {
    // If user is already logged in, let them finish intro and go straight to dashboard
    const currentUser = getCurrentUser();

    const dockTimer = setTimeout(() => {
      if (currentUser) {
        if (onComplete) onComplete();
        return;
      }
      setDockStage('docking');
      setTimeout(() => {
        setDockStage('docked');
      }, 1100);
    }, duration);

    // Keyboard Skip (Escape, Space, Enter)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        if (dockStage === 'intro') {
          clearTimeout(dockTimer);
          if (currentUser) {
            if (onComplete) onComplete();
            return;
          }
          setDockStage('docked');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(dockTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, onComplete, dockStage]);

  // Click backdrop during intro to immediately dock into login
  const handleBackdropClick = (e) => {
    if (dockStage === 'intro' && !cardRef.current?.contains(e.target)) {
      if (getCurrentUser()) {
        if (onComplete) onComplete();
        return;
      }
      setDockStage('docked');
    }
  };

  // Login handler when docked
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      if (res.success) {
        sessionStorage.setItem('cf_intro_seen', 'true');
        if (onComplete) onComplete();
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

  // Immediate navigation to signup
  const handleCreateAccount = (e) => {
    e.preventDefault();
    sessionStorage.setItem('cf_intro_seen', 'true');
    if (onComplete) onComplete('/signup');
    navigate('/signup');
  };

  const isIntro = dockStage === 'intro';
  const isDocking = dockStage === 'docking';
  const isDocked = dockStage === 'docked';

  return (
    <div
      className={`cf-cinema-intro-stage auth-page-container ${isDocked ? 'is-docked' : isDocking ? 'is-docking' : 'is-intro'}`}
      onClick={handleBackdropClick}
      role="region"
      aria-label="CommandFlow AI 3D Intro & Login"
    >
      {/* Studio White Cinematic Backdrop & Ambient Glows */}
      <div className="cf-cinema-backdrop" aria-hidden="true" />
      <div className="cf-radial-glow cf-glow-primary" aria-hidden="true" />
      <div className="cf-radial-glow cf-glow-secondary" aria-hidden="true" />

      {/* Restrained Ambient Floating Light Particles */}
      <div className="cf-ambient-particles" aria-hidden="true">
        <span className="cf-particle p-1" />
        <span className="cf-particle p-2" />
        <span className="cf-particle p-3" />
        <span className="cf-particle p-4" />
        <span className="cf-particle p-5" />
        <span className="cf-particle p-6" />
      </div>

      {/* The Target Login Card */}
      <div
        ref={cardRef}
        className={`auth-modelled-card cf-dockable-card ${isDocked ? 'card-docked' : isDocking ? 'card-docking' : 'card-intro'}`}
      >
        {/* Brand Header */}
        <div className="auth-header cf-dock-header">
          {/* Logo Anchor / Pedestal */}
          <div
            ref={pedestalRef}
            className={`auth-logo-pedestal cf-dock-pedestal ${isDocked ? 'pedestal-docked' : isDocking ? 'pedestal-docking' : 'pedestal-intro'}`}
            style={{
              '--target-offset-y': `${dockOffset}px`
            }}
          >
            {/* Halo pulse ring on login card */}
            <div className={`auth-logo-halo cf-dock-halo ${isDocked ? 'halo-active' : isDocking ? 'halo-blooming' : 'halo-hidden'}`} />

            {/* The 3D Token that shrinks, rotates, and attaches into this box */}
            <div className={`cf-3d-token-wrap cf-dock-token-wrap ${isDocked ? 'token-docked' : isDocking ? 'token-docking' : 'token-intro'}`}>
              <div className={`cf-3d-token ${isDocked ? 'token-idle' : isDocking ? 'token-spinning-dock' : 'token-intro-spin'}`}>
                {/* Physical edge thickness slices in Z-space */}
                <div className="token-layer token-slice slice-5" />
                <div className="token-layer token-slice slice-4" />
                <div className="token-layer token-slice slice-3" />
                <div className="token-layer token-slice slice-2" />
                <div className="token-layer token-slice slice-1" />

                {/* Back Face */}
                <div className="token-layer token-face-back">
                  <div className="token-back-metallic" />
                  <div className="token-back-icon">
                    <Bot size={28} strokeWidth={2.2} />
                  </div>
                </div>

                {/* Front Face (Matches the exact Login Logo Box when docked!) */}
                <div className="token-layer token-face-front auth-logo-box">
                  <div className="token-front-rim" />
                  <div className="token-gloss-shine" />
                  <div className="token-light-sweep" />
                  <div className="token-bot-icon">
                    <Bot size={28} strokeWidth={2.3} />
                  </div>
                </div>
              </div>

              {/* 3D Atmospheric Ground Shadow (Visible in intro, dissolves as it docks) */}
              <div className={`cf-3d-shadow ${isDocked ? 'shadow-hidden' : isDocking ? 'shadow-fading' : 'shadow-visible'}`} />
            </div>
          </div>

          {/* 3D Brand Title (Transitions from screen center to card header) */}
          <h1
            className={`auth-brand-title cf-dock-title ${isDocked ? 'title-docked' : isDocking ? 'title-docking' : 'title-intro'}`}
            style={{
              '--target-offset-y': `${dockOffset + 48}px`
            }}
          >
            <span className="cf-text-commandflow">CommandFlow</span>
            <span className="cf-text-space">&nbsp;</span>
            <span className="cf-text-ai auth-brand-ai">AI</span>
          </h1>

          {/* Subtitle Pill (Materializes during docking) */}
          <div className={`auth-subtitle-pill cf-dock-pill ${isIntro ? 'pill-hidden' : 'pill-visible'}`}>
            <Sparkles size={12} color="#059669" />
            <span>Voice-to-Action Automation Platform</span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="auth-alert-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form (Fades and slides in seamlessly when docking) */}
        <form
          onSubmit={handleLogin}
          className={`auth-form cf-dock-form ${isIntro ? 'form-hidden' : 'form-visible'}`}
          noValidate
        >
          {/* Email Field */}
          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="intro-auth-email">
              <span>Email Address</span>
            </label>
            <div className={`auth-input-wrapper ${focusedField === 'email' ? 'is-focused' : ''}`}>
              <div className="auth-input-icon">
                <Mail size={16} />
              </div>
              <input
                id="intro-auth-email"
                type="email"
                className="auth-input-field"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoComplete="email"
                tabIndex={isDocked ? 0 : -1}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="intro-auth-password">
              <span>Password</span>
            </label>
            <div className={`auth-input-wrapper ${focusedField === 'password' ? 'is-focused' : ''}`}>
              <div className="auth-input-icon">
                <Lock size={16} />
              </div>
              <input
                id="intro-auth-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                autoComplete="current-password"
                tabIndex={isDocked ? 0 : -1}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={isDocked ? 0 : -1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                tabIndex={isDocked ? 0 : -1}
              />
              <span>Remember me</span>
            </label>
            <span
              className="auth-forgot-link"
              style={{ opacity: 0.85, cursor: 'pointer' }}
              onClick={() => setError('Contact your workspace administrator to reset your credentials.')}
              tabIndex={isDocked ? 0 : -1}
            >
              Forgot password?
            </span>
          </div>

          {/* Modeled 3D Tactile Submit Button */}
          <button
            type="submit"
            className="auth-modelled-btn"
            disabled={loading || !isDocked}
            tabIndex={isDocked ? 0 : -1}
          >
            {loading ? (
              <>
                <div className="auth-spinner" />
                <span>Authenticating Workspace...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight size={16} strokeWidth={2.4} />
              </>
            )}
          </button>
        </form>

        {/* Card Footer */}
        <div className={`auth-footer cf-dock-footer ${isIntro ? 'footer-hidden' : 'footer-visible'}`}>
          <div className="auth-switch-text">
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-switch-link"
              onClick={handleCreateAccount}
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
              tabIndex={isDocked ? 0 : -1}
            >
              Create Account
            </button>
          </div>

          {/* Trust & Capabilities Bar */}
          <div className="auth-features-bar">
            <div className="auth-feature-chip">
              <Radio size={11} color="#10B981" />
              <span>Voice Automation</span>
            </div>
            <div className="auth-feature-chip">
              <Zap size={11} color="#0284C7" />
              <span>Zero Latency</span>
            </div>
            <div className="auth-feature-chip">
              <ShieldCheck size={11} color="#059669" />
              <span>Enterprise Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandwrittenIntro;
