import React from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { LogOut, Zap, Menu } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import '../styles/navbar.css';

const Navbar = ({ toggleSidebar, currentLanguage, setLanguage }) => {
  const navigate = useNavigate();
  const user = getCurrentUser() || { name: 'Demo User', email: 'demo@commandflow.ai' };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="btn btn-secondary"
          onClick={toggleSidebar}
          style={{ padding: '0.4rem', display: 'flex', alignItems: 'center' }}
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="system-status">
          <span className="status-dot"></span>
          <span>Engine Online</span>
        </div>
      </div>

      <div className="navbar-right">
        <LanguageSelector selectedLanguage={currentLanguage} onSelectLanguage={setLanguage} />

        <div className="user-profile">
          <div className="avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
          <span className="user-name">{user.name}</span>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleLogout}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          title="Sign Out"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
