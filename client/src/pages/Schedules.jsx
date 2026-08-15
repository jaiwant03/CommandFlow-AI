import React, { useState, useEffect } from 'react';
import { fetchSchedules, deleteSchedule } from '../services/automationService';
import { Calendar, Clock, Trash2, RefreshCw, Mail, Send } from 'lucide-react';
import '../styles/global.css';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetchSchedules();
      if (res.success) setSchedules(res.data || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await deleteSchedule(id);
      loadSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Schedules</h1>
          <p className="page-subtitle">Upcoming scheduled commands to be dispatched automatically by the background worker.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadSchedules} title="Refresh Schedules">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {schedules.map((item) => (
          <div key={item._id} className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '42px', height: '42px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={22} />
              </div>

              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>"{item.command}"</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                  <span>Automation ID: <strong style={{ color: 'var(--primary-dark)', fontFamily: 'var(--font-mono)' }}>{item.automationId}</strong></span>
                  <span>Target Time: <strong>{new Date(item.nextExecution).toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`status-badge status-${(item.status || 'scheduled').toLowerCase()}`}>
                {item.status}
              </span>
              <button
                className="btn btn-danger"
                style={{ padding: '0.35rem 0.65rem' }}
                onClick={() => handleCancel(item._id)}
                title="Cancel Schedule"
              >
                <Trash2 size={14} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No upcoming scheduled automations found. Try saying: "Send hello to admin@example.com through Gmail tomorrow at 9 AM"
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedules;
