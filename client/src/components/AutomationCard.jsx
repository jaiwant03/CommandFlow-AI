import React from 'react';
import { Zap, Mail, Send, Calendar, CheckCircle, Clock, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import '../styles/automation.css';

const AutomationCard = ({ automation, onViewDetails }) => {
  const getChannelIcon = (ch) => {
    switch (ch) {
      case 'gmail': return <Mail size={14} />;
      case 'telegram': return <Send size={14} />;
      default: return <Zap size={14} />;
    }
  };

  const getStatusBadge = (st) => {
    const statusUpper = (st || '').toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS':
      case 'SENT':
        return <span className="status-badge status-success"><CheckCircle size={12} /> SUCCESS</span>;
      case 'SCHEDULED':
        return <span className="status-badge status-scheduled"><Clock size={12} /> SCHEDULED</span>;
      case 'PROCESSING':
      case 'RUNNING':
        return <span className="status-badge status-processing"><Zap size={12} className="spin" /> PROCESSING</span>;
      case 'SENDING':
        return <span className="status-badge status-sending"><Send size={12} className="spin" /> SENDING</span>;
      case 'QUEUED':
      case 'WAITING':
        return <span className="status-badge status-queued"><Clock size={12} /> QUEUED</span>;
      case 'RETRYING':
        return <span className="status-badge status-retrying"><RefreshCw size={12} className="spin" /> RETRYING</span>;
      default:
        return <span className="status-badge status-failed"><AlertTriangle size={12} /> FAILED</span>;
    }
  };

  return (
    <div className="glass-card automation-card">
      <div className="automation-card-header">
        <div className="automation-card-topline">
          <span className="automation-id">{automation.automationId}</span>
          <span className={`meta-pill channel-pill ${automation.channel}`}>
            {getChannelIcon(automation.channel)}
            {automation.channel.toUpperCase()}
          </span>
          <span className="meta-pill meta-pill-muted">
            🌐 {automation.language}
          </span>
        </div>

        {getStatusBadge(automation.status)}
      </div>

      <div>
        <h4 className="automation-command-text">"{automation.originalCommand}"</h4>
      </div>

      <div className="automation-meta-pills">
        <span className="meta-pill meta-pill-soft">
          Target: <strong>{automation.recipient?.name || automation.recipient?.email || automation.recipient?.telegramId || 'Recipient'}</strong>
        </span>
        <span className="meta-pill meta-pill-soft">
          Intent: <strong>{automation.intent}</strong>
        </span>
        {automation.schedule?.date && (
          <span className="meta-pill meta-pill-warning">
            <Calendar size={12} />
            {automation.schedule.date} {automation.schedule.time || ''}
          </span>
        )}
      </div>

      <div className="automation-card-footer">
        <span className="automation-card-time">
          {new Date(automation.createdAt).toLocaleString()}
        </span>

        <button
          className="btn btn-secondary automation-card-action"
          onClick={() => onViewDetails && onViewDetails(automation)}
        >
          <Eye size={14} />
          <span>Execution Details</span>
        </button>
      </div>
    </div>
  );
};

export default AutomationCard;
