import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { getCurrentUser } from './services/authService';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Automations from './pages/Automations';
import AutomationDetails from './pages/AutomationDetails';
import Schedules from './pages/Schedules';
import History from './pages/History';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';

// Styles
import './styles/global.css';

const ProtectedLayout = ({ children, currentLanguage, setLanguage }) => {
  const user = getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content">
        <Navbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
        />
        {children}
      </div>
    </div>
  );
};

const App = () => {
  const [currentLanguage, setCurrentLanguage] = useState('auto');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedLayout currentLanguage={currentLanguage} setLanguage={setCurrentLanguage}>
            <Dashboard currentLanguage={currentLanguage} />
          </ProtectedLayout>
        }
      />

      <Route
        path="/automations"
        element={
          <ProtectedLayout currentLanguage={currentLanguage} setLanguage={setCurrentLanguage}>
            <Automations />
          </ProtectedLayout>
        }
      />

      <Route
        path="/automations/:id"
        element={
          <ProtectedLayout currentLanguage={currentLanguage} setLanguage={setCurrentLanguage}>
            <AutomationDetails />
          </ProtectedLayout>
        }
      />

      <Route
        path="/schedules"
        element={
          <ProtectedLayout currentLanguage={currentLanguage} setLanguage={setCurrentLanguage}>
            <Schedules />
          </ProtectedLayout>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedLayout currentLanguage={currentLanguage} setLanguage={setCurrentLanguage}>
            <History />
          </ProtectedLayout>
        }
      />

      <Route
        path="/integrations"
        element={
          <ProtectedLayout currentLanguage={currentLanguage} setLanguage={setCurrentLanguage}>
            <Integrations />
          </ProtectedLayout>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedLayout currentLanguage={currentLanguage} setLanguage={setCurrentLanguage}>
            <Settings />
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
