import React from 'react';
import { Globe } from 'lucide-react';

const LanguageSelector = ({ selectedLanguage, onSelectLanguage }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Globe size={16} color="var(--primary)" />
      <select
        value={selectedLanguage || 'auto'}
        onChange={(e) => onSelectLanguage && onSelectLanguage(e.target.value)}
        style={{
          background: 'var(--bg-surface-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem 0.5rem',
          fontSize: '0.8rem',
          cursor: 'pointer'
        }}
      >
        <option value="auto">🌐 Auto-Detect (English/Tamil/Tanglish)</option>
        <option value="english">🇬🇧 English</option>
        <option value="tanglish">🇮🇳 Tanglish (Tamil-English)</option>
        <option value="tamil">🇮🇳 தமிழ் (Tamil Native)</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
