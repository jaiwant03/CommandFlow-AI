import React from 'react';
import '../styles/dashboard.css';

const StatusCard = ({ title, value, icon: Icon, type = 'total' }) => {
  const isRed = type === 'failed';
  const strokeColor = isRed ? '#EF4444' : '#00C896';
  const fillColor = isRed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 200, 150, 0.12)';

  return (
    <div className={`glass-card stat-card floating-${type === 'total' ? '1' : type === 'success' ? '2' : type === 'scheduled' ? '3' : '1'}`} style={{
      position: 'relative',
      overflow: 'hidden',
      padding: '1.35rem 1.5rem',
      background: 'rgba(255, 255, 255, 0.95)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
        <div>
          <div className="stat-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
          <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: '0.1rem' }}>{value}</div>
        </div>
        <div className={`stat-icon ${type}`} style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', background: isRed ? '#FEE2E2' : 'var(--primary-light)', color: isRed ? '#DC2626' : 'var(--primary-dark)' }}>
          <Icon size={22} />
        </div>
      </div>

      {/* Static Vector Line Sparkline Graph (Frozen in Time) */}
      <div style={{ width: '100%', height: '32px', marginTop: '0.25rem' }}>
        <svg width="100%" height="100%" viewBox="0 0 120 30" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <path
            d={isRed ? "M 0 10 Q 30 25 60 12 T 120 22 L 120 30 L 0 30 Z" : "M 0 22 Q 30 8 60 18 T 120 5 L 120 30 L 0 30 Z"}
            fill={fillColor}
          />
          <path
            d={isRed ? "M 0 10 Q 30 25 60 12 T 120 22" : "M 0 22 Q 30 8 60 18 T 120 5"}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default StatusCard;
