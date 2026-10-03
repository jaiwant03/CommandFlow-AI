import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Users,
  Calendar,
  History,
  Layers,
  Settings,
  Bot,
  X,
  LogOut,
  User,
  Sparkles
} from 'lucide-react';
import { getCurrentUser, logoutUser } from '../services/authService';
import '../styles/navbar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const user = getCurrentUser() || { name: 'User', email: 'user@commandflow.ai' };

  const navItems = [
    { label: 'Command Center', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { label: 'Automations', icon: <Zap size={20} />, path: '/automations' },
    { label: 'Contacts', icon: <Users size={20} />, path: '/contacts' },
    { label: 'Schedules', icon: <Calendar size={20} />, path: '/schedules' },
    { label: 'History', icon: <History size={20} />, path: '/history' },
    { label: 'Integrations', icon: <Layers size={20} />, path: '/integrations' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    { label: 'Watch Intro', icon: <Sparkles size={20} style={{ color: '#00D29E' }} />, path: '/intro' }
  ];

  const handleLogout = () => {
    logoutUser();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Backdrop Overlay - strictly behind sidebar (zIndex 2400) */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 2400,
            cursor: 'pointer'
          }}
          aria-label="Close Navigation"
        />
      )}

      {/* Sidebar Drawer - strictly in front of backdrop (zIndex 2500) */}
      <aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          zIndex: 2500,
          paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)'
        }}
      >
        <div
          className="sidebar-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #E8EEF5'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              className="brand-logo"
              style={{
                background: 'var(--primary, #10B981)',
                color: '#FFFFFF',
                padding: '0.45rem',
                borderRadius: '10px',
                display: 'flex'
              }}
            >
              <Bot size={22} />
            </div>
            <span
              className="brand-name"
              style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontWeight: 800,
                color: '#0F172A',
                fontSize: '1.25rem'
              }}
            >
              CommandFlow
            </span>
          </div>

          {/* Prominent close button for mobile drawer */}
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              color: '#475569',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '38px',
              minHeight: '38px'
            }}
            title="Close Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card in Mobile Drawer */}
        <div
          className="sidebar-user-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 650, fontSize: '0.875rem', color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user.email}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ padding: '0.75rem 0.5rem', flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{
                minHeight: '46px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 1rem',
                borderRadius: '10px',
                marginBottom: '0.25rem',
                textDecoration: 'none'
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.925rem', fontWeight: 600 }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Drawer Footer with Logout Button */}
        <div style={{ padding: '1rem', borderTop: '1px solid #E8EEF5', backgroundColor: '#FFFFFF' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.7rem',
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              border: '1px solid #FCA5A5',
              borderRadius: '10px',
              fontWeight: 650,
              fontSize: '0.875rem',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
