import React, { useState, useEffect } from 'react';
import { fetchDocuments, generateDocument } from '../services/automationService';
import { SERVER_BASE_URL } from '../services/api';
import DocumentPreview from '../components/DocumentPreview';
import HandwrittenHeading from '../components/HandwrittenHeading';
import { FileText, Plus, Download, Eye, Sparkles } from 'lucide-react';
import '../styles/documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [docType, setDocType] = useState('leave_letter');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState('Class Advisor');
  const [loading, setLoading] = useState(false);

  const loadDocuments = async () => {
    try {
      const res = await fetchDocuments();
      if (res.success) setDocuments(res.data || []);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await generateDocument({
        type: docType,
        title: title || 'Official Letter Request',
        content: content || 'I am writing to formally request leave of absence...',
        recipientName: recipient
      });
      if (res.success) {
        setShowGenerateModal(false);
        setTitle('');
        setContent('');
        loadDocuments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <HandwrittenHeading text="PDF Document Center" size="normal" withFlourish={true} />
          <p className="page-subtitle">AI-generated leave letters, bonafide requests, and official PDFs.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)}>
          <Plus size={16} />
          <span>Generate Custom PDF</span>
        </button>
      </div>

      <div className="documents-grid">
        {documents.map((doc) => (
          <div key={doc._id} className="glass-card document-card">
            <div className="document-header">
              <div className="doc-icon">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="doc-title">{doc.title}</h4>
                <span className="doc-type">{doc.type.replace('_', ' ')}</span>
              </div>
            </div>

            <p className="doc-preview-text">
              {doc.content}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(doc.createdAt).toLocaleDateString()}
              </span>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <Eye size={14} /> Preview
                </button>
                {doc.pdfPath && (
                  <a
                    href={`${SERVER_BASE_URL}${doc.pdfPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    download
                  >
                    <Download size={14} /> PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No documents generated yet. Use Voice or Text commands or click "Generate Custom PDF" above.
        </div>
      )}

      {selectedDoc && (
        <DocumentPreview document={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}

      {showGenerateModal && (
        <div className="modal-backdrop" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '1rem' }}>
              Generate Official PDF Document
            </h3>

            <form onSubmit={handleCreateDocument}>
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select className="form-select" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="leave_letter">Leave Letter</option>
                  <option value="bonafide_request">Bonafide Certificate Request</option>
                  <option value="permission_letter">Permission Letter (HOD / Hackathon)</option>
                  <option value="od_request">On-Duty (OD) Request</option>
                  <option value="internship_request">Internship Request</option>
                  <option value="custom_document">Custom Letter</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Leave Application for Family Function"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Recipient Name / Designation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. The Class Advisor / Dr. Ramesh"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Letter Content / Body</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '120px' }}
                  placeholder="Respected Sir, I request leave of absence..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Sparkles size={16} />
                  <span>{loading ? 'Rendering PDF...' : 'Generate PDF'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
