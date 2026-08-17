import React, { useState, useRef } from 'react';
import { Sparkles, Loader, Image as ImageIcon, X } from 'lucide-react';
import '../styles/automation.css';

const CommandInput = ({ value, onChange, onExecute, isLoading }) => {
  const [attachments, setAttachments] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setErrorMsg('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const invalidFile = files.find(f => !allowedTypes.includes(f.type.toLowerCase()) && !f.type.startsWith('image/'));

    if (invalidFile) {
      setErrorMsg('Please upload a valid image file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filePromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            filename: file.name,
            contentType: file.type || 'image/png',
            data: reader.result
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then(newAttachments => {
        setAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      })
      .catch(err => {
        console.error('File reading error:', err);
        setErrorMsg('Failed to process image file.');
      });
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value || !value.trim() || isLoading) return;
    onExecute(value, 'text', attachments);
  };

  const sampleCommands = [
    "Send my bonafide letter to admin@example.com through Gmail",
    "Send a Telegram message saying I will be late",
    "Send hello to admin@example.com through Gmail tomorrow at 9 AM"
  ];

  return (
    <div className="command-input-container" style={{ width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative', minWidth: '240px' }}>
            <input
              type="text"
              className="command-input-box"
              placeholder="Tell CommandFlow what you want to do..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--border-color)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                backgroundColor: '#FFFFFF',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            multiple
            style={{ display: 'none' }}
            id="cmd-image-upload-input"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={isLoading}
            title="Upload Image Attachment"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.95rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#F1F5F9',
              color: '#0F172A',
              border: '2px solid #CBD5E1',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)',
              height: '50px'
            }}
          >
            <ImageIcon size={19} color="#2563EB" />
            <span>Upload Image</span>
          </button>

          <button
            type="submit"
            className="btn btn-primary command-execute-btn"
            disabled={!value || !value.trim() || isLoading}
            style={{
              position: 'static',
              transform: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.95rem 1.4rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              border: 'none',
              cursor: (!value || !value.trim() || isLoading) ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              height: '50px'
            }}
          >
            {isLoading ? (
              <>
                <Loader size={19} className="spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles size={19} />
                <span>Analyze & Run</span>
              </>
            )}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.825rem',
          color: '#EF4444',
          fontWeight: 600
        }}>
          {errorMsg}
        </div>
      )}

      {attachments.length > 0 && (
        <div style={{
          marginTop: '0.6rem',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Attachments:</span>
          {attachments.map((att, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                borderRadius: 'var(--radius-md)',
                padding: '0.2rem 0.6rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <ImageIcon size={14} />
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {att.filename}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

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
