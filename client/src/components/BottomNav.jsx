import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, Calendar, History, Menu } from 'lucide-react';
import '../styles/bottomNav.css';

const BottomNav = ({ onOpenMenu }) => {
  const navTabs = [
    { label: 'Command', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Automations', path: '/automations', icon: <Zap size={20} /> },
    { label: 'Schedules', path: '/schedules', icon: <Calendar size={20} /> },
    { label: 'History', path: '/history', icon: <History size={20} /> }
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="bottom-nav-inner">
        {navTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon">{tab.icon}</div>
            <span className="bottom-nav-label">{tab.label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className="bottom-nav-item bottom-nav-menu-btn"
          onClick={onOpenMenu}
          title="More Options"
        >
          <div className="bottom-nav-icon">
            <Menu size={20} />
          </div>
          <span className="bottom-nav-label">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
