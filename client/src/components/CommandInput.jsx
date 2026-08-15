import React from 'react';
import { Sparkles, Loader } from 'lucide-react';
import '../styles/automation.css';

const CommandInput = ({ value, onChange, onExecute, isLoading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value || !value.trim() || isLoading) return;
    onExecute(value, 'text');
  };

  const sampleCommands = [
    "Send my bonafide letter to admin@example.com through Gmail",
    "Send a Telegram message saying I will be late",
    "Send hello to admin@example.com through Gmail tomorrow at 9 AM"
  ];

  return (
    <div className="command-input-container" style={{ width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          className="command-input-box"
          placeholder="Tell CommandFlow what you want to do..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '1.1rem 9.5rem 1.1rem 1.25rem',
            fontSize: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--border-color)',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            backgroundColor: '#FFFFFF',
            boxShadow: 'var(--shadow-sm)'
          }}
        />
        <button
          type="submit"
          className="btn btn-primary command-execute-btn"
          disabled={!value || !value.trim() || isLoading}
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '0.7rem 1.2rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary)'
          }}
        >
          {isLoading ? (
            <>
              <Loader size={18} className="spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Analyze & Run</span>
            </>
          )}
        </button>
      </form>

      <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try examples:</span>
        {sampleCommands.map((cmd, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(cmd)}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--primary-dark)',
              borderRadius: 'var(--radius-full)',
              padding: '0.25rem 0.75rem',
              fontSize: '0.775rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            "{cmd}"
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommandInput;
