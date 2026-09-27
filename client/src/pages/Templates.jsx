import React, { useState } from 'react';
import HandwrittenHeading from '../components/HandwrittenHeading';
import { FileCode, Sparkles, Copy, Check } from 'lucide-react';
import '../styles/global.css';

const defaultTemplates = [
  {
    name: 'Leave Letter Template',
    type: 'leave_letter',
    content: 'To\nThe Class Advisor / HOD,\n\nRespected Sir/Madam,\n\nI am writing to request a leave of absence for tomorrow due to a family function. I request you to kindly grant me permission.\n\nThanking you,\nYours faithfully,\nStudent'
  },
  {
    name: 'Bonafide Certificate Request',
    type: 'bonafide_request',
    content: 'To\nThe College Office / Principal,\n\nRespected Sir/Madam,\n\nI request you to issue a Bonafide Certificate for my bank education loan processing.\n\nThanking you,\nYours sincerely,\nStudent'
  },
  {
    name: 'Hackathon Permission Letter',
    type: 'permission_letter',
    content: 'To\nThe Head of Department (HOD),\n\nRespected Sir/Madam,\n\nOur project team has been selected for the National Hackathon. Kindly grant permission to attend the event on the upcoming dates.\n\nThanking you,\nTeam Leader'
  },
  {
    name: 'Internship Follow-up Template',
    type: 'internship_followup',
    content: 'Dear HR Manager,\n\nI am following up on my internship application submitted three days ago. Please let me know if any additional information is required.\n\nBest regards,\nApplicant'
  }
];

const Templates = () => {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <HandwrittenHeading text="AI Template Library" size="normal" withFlourish={true} />
        <p className="page-subtitle">Reusable templates intelligently populated by Groq AI engine.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {defaultTemplates.map((tpl, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FileCode size={20} color="var(--primary)" />
                <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tpl.name}</h4>
              </div>
              <span className="status-badge status-processing" style={{ fontSize: '0.7rem', marginBottom: '0.75rem' }}>
                {tpl.type}
              </span>
              <div style={{ background: 'var(--bg-dark)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', minHeight: '120px' }}>
                {tpl.content}
              </div>
            </div>

            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => handleCopy(tpl.content, idx)}
            >
              {copiedIdx === idx ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              <span>{copiedIdx === idx ? 'Copied to Clipboard' : 'Copy Template'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;
