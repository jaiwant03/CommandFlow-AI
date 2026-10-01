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
  X
} from 'lucide-react';
import '../styles/navbar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Command Center', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { label: 'Automations', icon: <Zap size={18} />, path: '/automations' },
    { label: 'Contacts', icon: <Users size={18} />, path: '/contacts' },
    { label: 'Schedules', icon: <Calendar size={18} />, path: '/schedules' },
    { label: 'History', icon: <History size={18} />, path: '/history' },
    { label: 'Integrations', icon: <Layers size={18} />, path: '/integrations' },
    { label: 'Settings', icon: <Settings size={18} />, path: '/settings' }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 1190
          }}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-logo" style={{ background: 'var(--primary)', color: '#FFFFFF', padding: '0.4rem', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <Bot size={22} />
            </div>
            <span className="brand-name" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem' }}>
              CommandFlow
            </span>
          </div>

          {/* Close button on mobile drawer */}
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
            <strong>CommandFlow AI Engine</strong><br />
            Groq AI + BullMQ + n8n
          </div>
        </div>

        <div className="sidebar-rocket-card">
          <img src="/rocket.png" alt="rocket" className="rocket-image" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
