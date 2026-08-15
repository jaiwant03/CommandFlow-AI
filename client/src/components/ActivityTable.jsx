import React from 'react';
import { Eye, Mail, Send, Zap, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import '../styles/history.css';

const ActivityTable = ({ automations = [], onViewDetails }) => {
  const getChannelIcon = (ch) => {
    switch (ch) {
      case 'gmail': return <Mail size={14} color="#138A4B" />;
      case 'telegram': return <Send size={14} color="#0B5D34" />;
      default: return <Zap size={14} />;
    }
  };

  const renderStatus = (st) => {
    const statusUpper = (st || '').toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS':
        return <span className="status-badge status-success"><CheckCircle size={12} /> SUCCESS</span>;
      case 'SCHEDULED':
        return <span className="status-badge status-scheduled"><Clock size={12} /> SCHEDULED</span>;
      case 'PROCESSING':
      case 'RUNNING':
        return <span className="status-badge status-processing"><Zap size={12} className="spin" /> PROCESSING</span>;
      default:
        return <span className="status-badge status-failed"><AlertTriangle size={12} /> FAILED</span>;
    }
  };

  return (
    <div className="table-container">
      <table className="activity-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '0.75rem 1rem' }}>Automation ID</th>
            <th style={{ padding: '0.75rem 1rem' }}>Command</th>
            <th style={{ padding: '0.75rem 1rem' }}>Intent</th>
            <th style={{ padding: '0.75rem 1rem' }}>Channel</th>
            <th style={{ padding: '0.75rem 1rem' }}>Recipient</th>
            <th style={{ padding: '0.75rem 1rem' }}>Execution Time</th>
            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
            <th style={{ padding: '0.75rem 1rem' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {automations.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                No automation activity recorded yet.
              </td>
            </tr>
          ) : (
            automations.map((item) => (
              <tr key={item._id || item.automationId} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  {item.automationId}
                </td>
                <td style={{ padding: '0.75rem 1rem', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{item.originalCommand}"
                </td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                  {item.intent}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700 }}>
                    {getChannelIcon(item.channel)} {item.channel}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {item.recipient?.name || item.recipient?.email || item.recipient?.telegramId || 'N/A'}
                </td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(item.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {renderStatus(item.status)}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                    onClick={() => onViewDetails && onViewDetails(item)}
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityTable;
