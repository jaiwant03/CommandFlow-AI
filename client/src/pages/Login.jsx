import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { Bot, ArrowRight, Lock, Mail } from 'lucide-react';
import '../styles/global.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#F8FAFC',
      backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(0, 200, 150, 0.08) 0%, transparent 40%), radial-gradient(circle at 85% 75%, rgba(0, 200, 150, 0.06) 0%, transparent 45%)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="brand-logo" style={{ margin: '0 auto 1rem', width: '48px', height: '48px' }}>
            <Bot size={28} />
          </div>
          <h2 className="page-title" style={{ fontSize: '1.75rem' }}>CommandFlow AI</h2>
          <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>
            Voice-to-Action Multi-Channel Automation Platform
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            color: 'var(--danger)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Create Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;