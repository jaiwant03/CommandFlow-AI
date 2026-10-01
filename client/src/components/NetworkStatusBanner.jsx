import React, { useState, useEffect } from 'react';
import { subscribeNetworkStatus, checkServerHealth } from '../services/api';
import { Loader2, RefreshCw, WifiOff, CheckCircle } from 'lucide-react';

const NetworkStatusBanner = () => {
  const [status, setStatus] = useState({ isOnline: true, isWaking: false, message: '' });
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Ping server health when component mounts
    checkServerHealth();

    const unsubscribe = subscribeNetworkStatus((netStatus) => {
      setStatus(netStatus);
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    await checkServerHealth();
    setTimeout(() => setRetrying(false), 800);
  };

  if (status.isOnline && !status.isWaking) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top, 0px)',
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: status.isWaking ? '#0284C7' : '#EF4444',
        color: '#FFFFFF',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.875rem',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: 'slideDown 0.25s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {status.isWaking ? (
          <Loader2 size={16} className="spin" style={{ flexShrink: 0 }} />
        ) : (
          <WifiOff size={16} style={{ flexShrink: 0 }} />
        )}
        <span>
          {status.message ||
            (status.isWaking
              ? 'Waking up CommandFlow AI Engine on Render... Please wait a moment.'
              : 'Network offline. Please check your internet connection.')}
        </span>
      </div>

      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          color: '#FFFFFF',
          borderRadius: '6px',
          padding: '0.3rem 0.75rem',
          fontSize: '0.785rem',
          fontWeight: 600,
          cursor: retrying ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          flexShrink: 0,
          minHeight: '36px'
        }}
      >
        <RefreshCw size={13} className={retrying ? 'spin' : ''} />
        <span>{retrying ? 'Connecting...' : 'Retry'}</span>
      </button>
    </div>
  );
};

export default NetworkStatusBanner;
