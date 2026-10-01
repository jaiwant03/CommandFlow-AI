import React from 'react';
import { FileText, Download, X, Eye } from 'lucide-react';
import { SERVER_BASE_URL } from '../services/api';
import '../styles/history.css';

const DocumentPreview = ({ document: docItem, onClose }) => {
  if (!docItem) return null;

  const pdfUrl = docItem.pdfPath ? `${SERVER_BASE_URL}${docItem.pdfPath}` : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--accent)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>
              {docItem.title || 'PDF Document Preview'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', background: '#090d16', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DOCUMENT METADATA</div>
          <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div><strong>Type:</strong> {docItem.type}</div>
            <div><strong>ID:</strong> {docItem.automationId}</div>
            <div><strong>Language:</strong> {docItem.language}</div>
            <div><strong>Created:</strong> {new Date(docItem.createdAt).toLocaleString()}</div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Generated Body Text:</h4>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
            {docItem.content}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              download
            >
              <Download size={16} />
              <span>Download PDF File</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
