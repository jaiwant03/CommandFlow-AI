import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import NetworkStatusBanner from './components/NetworkStatusBanner';
import { getCurrentUser, checkAuth } from './services/authService';
import { initCapacitor, setupHardwareBackButton } from './services/capacitorService';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Automations from './pages/Automations';
import AutomationDetails from './pages/AutomationDetails';
import Contacts from './pages/Contacts';
import Schedules from './pages/Schedules';
import History from './pages/History';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';

// Styles
import './styles/global.css';
import './styles/responsive.css';

const ProtectedLayout = ({ children, currentLanguage, setLanguage, sidebarOpen, setSidebarOpen }) => {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
        />
        {children}
      </div>
      {/* Mobile-first Bottom Navigation */}
      <BottomNav onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
};

const App = () => {
  const [currentLanguage, setCurrentLanguage] = useState('auto');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarOpenRef = useRef(sidebarOpen);
  sidebarOpenRef.current = sidebarOpen;

  useEffect(() => {
    // Initialize native device features (Status Bar, Splash Screen)
    initCapacitor();

    // Register Android Hardware Back Button
    const cleanupBackButton = setupHardwareBackButton(() => {
      // 1. If mobile sidebar drawer is open, close it
      if (sidebarOpenRef.current) {
        setSidebarOpen(false);
        return true; // handled
      }

      // 2. Check if any active modal or voice modal is currently displayed in DOM
      const openModalCloseBtn = document.querySelector(
        '.modal-close, .voice-close-btn, .confirmation-modal-backdrop, .auth-modal-close'
      );
      if (openModalCloseBtn) {
        openModalCloseBtn.click();
        return true; // handled
      }

      // 3. If on a sub-page, navigate back
      const rootPaths = ['/dashboard', '/login', '/signup', '/'];
      if (!rootPaths.includes(location.pathname)) {
        navigate(-1);
        return true; // handled
      }

      // 4. Default: let Capacitor minimize or exit
      return false;
    });

    return () => cleanupBackButton();
  }, [location.pathname, navigate]);

  return (
    <>
      <NetworkStatusBanner />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout
              currentLanguage={currentLanguage}
              setLanguage={setCurrentLanguage}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            >
              <Dashboard currentLanguage={currentLanguage} />
            </ProtectedLayout>
          }
        />

        <Route
          path="/automations"
          element={
            <ProtectedLayout
              currentLanguage={currentLanguage}
              setLanguage={setCurrentLanguage}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            >
              <Automations />
            </ProtectedLayout>
          }
        />

        <Route
          path="/automations/:id"
          element={
            <ProtectedLayout
              currentLanguage={currentLanguage}
              setLanguage={setCurrentLanguage}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            >
              <AutomationDetails />
            </ProtectedLayout>
          }
        />

        <Route
          path="/contacts"
          element={
            <ProtectedLayout
              currentLanguage={currentLanguage}
              setLanguage={setCurrentLanguage}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            >
              <Contacts />
            </ProtectedLayout>
          }
        />

        <Route
          path="/schedules"
          element={
            <ProtectedLayout
              currentLanguage={currentLanguage}
              setLanguage={setCurrentLanguage}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            >
              <Schedules />
            </ProtectedLayout>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedLayout
              currentLanguage={currentLanguage}
              setLanguage={setCurrentLanguage}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            >
              <History />
            </ProtectedLayout>
          }
        />

        <Route
          path="/integrations"
          element={
            <ProtectedLayout
              currentLanguage={currentLanguage}
              setLanguage={setCurrentLanguage}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            >
              <Integrations />
            </ProtectedLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedLayout
              currentLanguage={currentLanguage}
              setLanguage={setCurrentLanguage}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            >
              <Settings />
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

export default App;
