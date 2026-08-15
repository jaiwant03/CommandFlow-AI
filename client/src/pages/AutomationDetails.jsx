import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAutomationDetails } from '../services/automationService';
import { ArrowLeft, Zap, CheckCircle, Clock, FileText } from 'lucide-react';
import '../styles/automation.css';

const AutomationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAutomationDetails(id);
        if (res.success) {
          setData(res.data);
          setLogs(res.logs || []);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    load();
  }, [id]);

  if (!data) {
    return (
      <div className="page-container">
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>Loading automation details...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Automations
      </button>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 className="page-title">{data.automationId}</h1>
          <span className={`status-badge status-${data.status.toLowerCase()}`}>{data.status}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div><strong>Intent:</strong> {data.intent}</div>
          <div><strong>Channel:</strong> {data.channel.toUpperCase()}</div>
          <div><strong>Language:</strong> {data.language}</div>
          <div><strong>Recipient:</strong> {data.recipient?.name}</div>
          <div><strong>Input Mode:</strong> {data.inputType}</div>
          <div><strong>Execution ID:</strong> {data.n8nExecutionId || 'N/A'}</div>
        </div>

        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Original Natural Language Command:</h3>
        <div style={{ background: '#090d16', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
          "{data.originalCommand}"
        </div>

        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Generated Content:</h3>
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
          <strong>Subject: {data.generatedContent?.subject}</strong>\n\n
          {data.generatedContent?.body}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1rem' }}>Execution Logs</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {logs.map((log, idx) => (
            <div key={idx} style={{ padding: '0.75rem 1rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: 'var(--primary)' }}>{log.action}</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.message}</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutomationDetails;
