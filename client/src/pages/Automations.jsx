import React, { useState, useEffect } from 'react';
import { fetchAutomations, fetchAutomationDetails } from '../services/automationService';
import AutomationCard from '../components/AutomationCard';
import { Layers, Bot, Mail, Send, Database, Zap, Sparkles, RefreshCw, GitCommit, Search, X, ChevronRight, CheckCircle, Clock, AlertTriangle, Eye, Workflow, Calendar } from 'lucide-react';
import '../styles/global.css';
import '../styles/voice.css';
import '../styles/automation.css';

const Automations = () => {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuto, setSelectedAuto] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const res = await fetchAutomations();
      if (res.success) setAutomations(res.data || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (automation) => {
    const automationId = automation?.automationId || automation?._id;
    if (!automationId) return;

    setDetailsLoading(true);
    try {
      const res = await fetchAutomationDetails(automationId);
      if (res.success && res.data) {
        setSelectedAuto(res.data);
      } else {
        setSelectedAuto(automation);
      }
    } catch (err) {
      console.warn(err);
      setSelectedAuto(automation);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredAutomations = automations.filter((automation) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    const targetText = [
      automation.automationId,
      automation.originalCommand,
      automation.channel,
      automation.intent,
      automation.language,
      automation.status,
      automation.recipient?.name,
      automation.recipient?.email,
      automation.recipient?.telegramId,
      automation.recipient?.phone,
      automation.generatedContent?.subject,
      automation.generatedContent?.body
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return targetText.includes(query);
  });

  useEffect(() => {
    loadAutomations();
  }, []);

  /* ==========================================================
     HELPER FUNCTIONS FOR RECENT AUTOMATIONS
  ========================================================== */

  const getChannelIcon = (ch) => {
    switch (ch) {
      case 'gmail': return <Mail size={16} />;
      case 'telegram': return <Send size={16} />;
      case 'calendar': return <Calendar size={16} />;
      default: return <Zap size={16} />;
    }
  };

  const getStatusClass = (status) => {
    const upper = String(status || '').toUpperCase();
    if (upper === 'SUCCESS') return 'status-success';
    if (upper === 'SCHEDULED') return 'status-scheduled';
    if (upper === 'PROCESSING' || upper === 'RUNNING') return 'status-processing';
    return 'status-failed';
  };

  const getChannelClass = (automation) => {
    const ch = (automation?.channel || '').toLowerCase();
    if (ch === 'gmail') return 'gmail';
    if (ch === 'telegram') return 'telegram';
    if (ch === 'calendar') return 'calendar';
    return 'default';
  };

  const getAutomationTitle = (automation) => {
    return automation?.originalCommand || 'Untitled Automation';
  };

  const getAutomationMeta = (automation) => {
    return `${automation?.intent || 'General'} • ${automation?.channel?.toUpperCase() || 'N/A'}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const RecentAutomationRow = ({ automation }) => {
    const status = String(automation?.status || '').toUpperCase();
    const statusClass = getStatusClass(status);
    const channelClass = getChannelClass(automation);

    return (
      <div className="cf-recent-row" onClick={() => handleViewDetails(automation)}>
        <div className="cf-recent-left">
          <div className={`cf-recent-icon ${channelClass}`}>
            {getChannelIcon(automation?.channel)}
          </div>
          <div className="cf-recent-info">
            <div className="cf-recent-title">{getAutomationTitle(automation)}</div>
            <div className="cf-recent-meta">{getAutomationMeta(automation)}</div>
          </div>
        </div>

        <div className="cf-recent-middle">
          <span className={`cf-status-pill ${statusClass}`}>
            <span className="cf-status-dot" />
            {status || 'RUNNING'}
          </span>
        </div>

        <div className="cf-recent-right">
          <span className="cf-recent-time">{formatDate(automation?.createdAt || automation?.updatedAt)}</span>
          <ChevronRight size={16} className="cf-recent-chevron" />
        </div>
      </div>
    );
  };

  return (
    <div className="automations-page">
      {/* ========================================================
          PAGE HEADER & SEARCH
      ======================================================== */}
      <div className="cf-page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '31px', fontWeight: 700, color: '#0F172A', margin: '0 0 0.35rem 0', letterSpacing: '-0.5px' }}>
            Automations
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
            Manage automation pipelines and active execution flows
          </p>
        </div>
      </div>

      {/* ========================================================
          SEARCH & CONTROLS
      ======================================================== */}
      <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search automations, commands, email, intent..."
          className="form-input"
          style={{ 
            width: '100%', 
            height: '54px',
            paddingLeft: '2.75rem', 
            paddingRight: '2.75rem', 
            fontSize: '0.9rem',
            border: '1px solid #CBD5E1',
            borderRadius: '11px',
            background: '#FFFFFF',
            boxSizing: 'border-box'
          }}
        />
        {searchTerm && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearchTerm('')}
            style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ========================================================
          ACTIVE PIPELINES SECTION
      ======================================================== */}
      <section className="cf-section-card" style={{ marginBottom: '2rem', marginTop: 0 }}>
        <div className="cf-section-header">
          <div className="cf-section-title">
            <Zap size={18} />
            <span>Active Pipelines</span>
          </div>
          <button type="button" className="cf-view-all">
            View All
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading automations...
            </div>
          )}

          {!loading && automations.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <Workflow size={30} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <strong>No automations yet</strong>
              <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Start by creating your first automation pipeline.</p>
            </div>
          )}

          {!loading && searchTerm && filteredAutomations.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No automations match your search.
            </div>
          )}

          {!loading && filteredAutomations.map((auto) => (
            <RecentAutomationRow
              key={auto._id || auto.automationId}
              automation={auto}
            />
          ))}
        </div>
      </section>

      {detailsLoading && selectedAuto && (
        <div className="voice-modal-overlay" onClick={() => setSelectedAuto(null)}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '680px', padding: '2rem', background: '#FFFFFF' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700 }}>Loading execution details...</h3>
            </div>
          </div>
        </div>
      )}

      {!detailsLoading && selectedAuto && (
        <div className="voice-modal-overlay" onClick={() => setSelectedAuto(null)}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            {/* Header - Fixed */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#0F172A' }}>
                  Execution Details
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>ID: {selectedAuto.automationId}</p>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748B', padding: '0.5rem' }} onClick={() => setSelectedAuto(null)}>
                ✕
              </button>
            </div>

            {/* Content - Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {/* Status Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${String(selectedAuto.status || '').toUpperCase() === 'SUCCESS' ? '#10B981' : String(selectedAuto.status || '').toUpperCase() === 'SCHEDULED' ? '#F59E0B' : '#EF4444'}` }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Status</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>{selectedAuto.status || 'RUNNING'}</p>
                </div>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Channel</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>{selectedAuto.channel?.toUpperCase() || 'N/A'}</p>
                </div>
              </div>

              {/* Quick Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Intent</span>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#0F172A', fontWeight: 500 }}>{selectedAuto.intent || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Language</span>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#0F172A', fontWeight: 500 }}>{selectedAuto.language?.toUpperCase() || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Target</span>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#0F172A', fontWeight: 500 }}>{selectedAuto.recipient?.name || selectedAuto.recipient?.email || selectedAuto.recipient?.telegramId || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Execution Time</span>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#0F172A', fontWeight: 500 }}>{selectedAuto.executedAt ? new Date(selectedAuto.executedAt).toLocaleString() : new Date(selectedAuto.createdAt || Date.now()).toLocaleString()}</p>
                </div>
              </div>

              {/* Original Command */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original Command</h4>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem', fontStyle: 'italic', fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
                  "{selectedAuto.originalCommand}"
                </div>
              </div>

              {/* AI Processing Result */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Processing Result</h4>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#334155' }}>
                  {selectedAuto.generatedContent?.subject && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: '#0F172A' }}>Subject:</strong>
                      <div style={{ marginTop: '0.25rem' }}>{selectedAuto.generatedContent.subject}</div>
                    </div>
                  )}
                  <div>
                    <strong style={{ color: '#0F172A' }}>Message:</strong>
                    <div style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{selectedAuto.generatedContent?.body || 'No generated content available.'}</div>
                  </div>
                </div>
              </div>

              {/* Execution Result */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Execution Result</h4>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem', fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0F172A' }}>Recipient:</strong> {selectedAuto.recipient?.name || selectedAuto.recipient?.email || selectedAuto.recipient?.telegramId || 'N/A'}</div>
                  <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0F172A' }}>Channel:</strong> {selectedAuto.channel?.toUpperCase() || 'N/A'}</div>
                  <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0F172A' }}>Intent:</strong> {selectedAuto.intent || 'N/A'}</div>
                  <div><strong style={{ color: '#0F172A' }}>Message:</strong> {selectedAuto.error ? selectedAuto.error : selectedAuto.status}</div>
                </div>
              </div>

              {/* Error Information */}
              {selectedAuto.error && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Error Information</h4>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '1rem', color: '#991B1B', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {selectedAuto.error}
                  </div>
                </div>
              )}

              {/* Webhook ID */}
              <div style={{ marginBottom: 0 }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Webhook / n8n ID</h4>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569', wordBreak: 'break-all' }}>
                  {selectedAuto.n8nExecutionId || 'N/A'}
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
              <button className="btn btn-secondary" onClick={() => setSelectedAuto(null)} style={{ padding: '0.7rem 1.5rem', fontSize: '0.9rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automations;
