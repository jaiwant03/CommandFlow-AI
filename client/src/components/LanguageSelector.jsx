import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown, Sparkles, Languages } from 'lucide-react';
import '../styles/languageSelector.css';

const LANGUAGE_OPTIONS = [
  {
    id: 'auto',
    label: 'Auto-Detect',
    nativeLabel: 'Auto (Multilingual)',
    flag: '🌐',
    badge: 'AI Smart',
    badgeColor: 'green',
    description: 'Auto-detects English, Tamil & Tanglish mixed speech'
  },
  {
    id: 'english',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    badge: 'Standard',
    badgeColor: 'blue',
    description: 'Formal emails, leave requests & business notices'
  },
  {
    id: 'tanglish',
    label: 'Tanglish',
    nativeLabel: 'Tamil-English',
    flag: '🇮🇳',
    badge: 'Bilingual',
    badgeColor: 'purple',
    description: 'Tamil speech or instructions in Latin English script'
  },
  {
    id: 'tamil',
    label: 'தமிழ் (Tamil)',
    nativeLabel: 'Tamil Native',
    flag: '🇮🇳',
    badge: 'Native',
    badgeColor: 'green',
    description: 'தூய தமிழ் குரல் & உரை கட்டளைகள் (Unicode)'
  }
];

const LanguageSelector = ({ selectedLanguage = 'auto', onSelectLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const activeOption =
    LANGUAGE_OPTIONS.find((opt) => opt.id === selectedLanguage) || LANGUAGE_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (langId) => {
    if (onSelectLanguage) {
      onSelectLanguage(langId);
    }
    setIsOpen(false);
  };

  return (
    <div className="lang-selector-container" ref={containerRef}>
      {/* Sleek Trigger Button */}
      <button
        type="button"
        className={`lang-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Select AI Transcription & Command Language"
      >
        <div className="lang-trigger-icon-wrap">
          <Globe size={14} />
        </div>

        <div className="lang-trigger-content">
          <span className="lang-flag">{activeOption.flag}</span>
          <span className="lang-label">{activeOption.label}</span>
          <span className="lang-badge-pill">{activeOption.badge}</span>
        </div>

        <ChevronDown size={14} className={`lang-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Floating Modern Modal Popover Dropdown */}
      {isOpen && (
        <div className="lang-dropdown-modal" role="listbox">
          {/* Header */}
          <div className="lang-dropdown-header">
            <div className="lang-dropdown-title-group">
              <div className="lang-dropdown-header-icon">
                <Languages size={16} />
              </div>
              <div>
                <h4 className="lang-dropdown-title">Language Engine</h4>
                <p className="lang-dropdown-subtitle">Voice recognition & prompt dialect</p>
              </div>
            </div>
            <span className="lang-engine-pill">Groq Llama 3.3</span>
          </div>

          {/* Options List */}
          <div className="lang-options-list">
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = opt.id === activeOption.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`lang-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.id)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="lang-option-left">
                    <div className="lang-option-flag-box">{opt.flag}</div>
                    <div className="lang-option-info">
                      <div className="lang-option-name-row">
                        <span className="lang-option-name">{opt.label}</span>
                        <span className={`lang-option-badge ${opt.badgeColor}`}>{opt.badge}</span>
                      </div>
                      <span className="lang-option-desc">{opt.description}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="lang-check-badge">
                      <Check size={14} strokeWidth={2.8} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="lang-dropdown-footer">
            <Sparkles size={13} />
            <span>Instant multilingual transcription and translation</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
