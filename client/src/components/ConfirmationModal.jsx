import React from 'react';
import { Mail, Send, Calendar, FileText, CheckCircle, X, AlertCircle, Clock, ShieldCheck, Loader } from 'lucide-react';
import '../styles/automation.css';

const ConfirmationModal = ({ parsedData, originalCommand, onConfirm, onCancel, isExecuting }) => {
  if (!parsedData) return null;

  const recipient = parsedData.resolvedRecipient || { name: 'Recipient', email: '', telegramId: '' };
  const isEmail = parsedData.channel === 'gmail';
  const isScheduled = parsedData.scheduleRequired;

  return (
    <div className="voice-modal-overlay" onClick={onCancel}>
      <div
        className="glass-card"
        style={{
          width: '90%',
          maxWidth: '620px',
          padding: '2rem',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.825rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <ShieldCheck size={16} />
              <span>Command Confirmation Preview</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              Confirm Automation Parameters
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Command Summary */}
        <div style={{ background: 'var(--bg-dark)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem', fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
          "{originalCommand}"
        </div>

        {/* Extracted Parameters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Target Recipient */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Recipient Destination
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {recipient.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginTop: '0.1rem' }}>
              {isEmail ? (recipient.email || `${recipient.name.toLowerCase().replace(/\s+/g, '')}@example.com`) : (recipient.telegramId || `@${recipient.name.toLowerCase().replace(/\s+/g, '')}`)}
            </div>
          </div>

          {/* Delivery Channel & Schedule */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Channel & Schedule
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span className={`channel-pill ${parsedData.channel}`}>
                {isEmail ? <Mail size={12} /> : <Send size={12} />}
                {parsedData.channel.toUpperCase()}
              </span>
              <span className={`status-badge ${isScheduled ? 'status-scheduled' : 'status-processing'}`}>
                {isScheduled ? <Clock size={12} /> : <CheckCircle size={12} />}
                {isScheduled ? `${parsedData.date || 'Tomorrow'} at ${parsedData.time || '9:00 AM'}` : 'Immediate'}
              </span>
            </div>
          </div>
        </div>



        {/* Content Preview */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Generated Content Preview
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', maxHeight: '160px', overflowY: 'auto' }}>
            {parsedData.generatedSubject && (
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                Subject: {parsedData.generatedSubject}
              </div>
            )}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
              {parsedData.generatedBody || 'Content generated based on command intent.'}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={isExecuting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={isExecuting}>
            {isExecuting ? (
              <>
                <Loader size={16} className="spin" />
                <span>Executing Automation...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>{isScheduled ? 'Confirm & Schedule Automation' : 'Confirm & Send Now'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
