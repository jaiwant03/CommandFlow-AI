import React, { useState, useRef } from 'react';
import { Sparkles, Loader, Image as ImageIcon, X, Mic, MicOff } from 'lucide-react';
import '../styles/commandInput.css';

const CommandInput = ({ value, onChange, onExecute, isLoading }) => {
  const [attachments, setAttachments] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('');
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const cleanAndCollapseTranscripts = (event) => {
    let finalPhrase = '';

    for (let i = 0; i < event.results.length; i++) {
      const res = event.results[i];
      const current = (res[0]?.transcript || '').trim();
      if (!current) continue;

      if (!finalPhrase) {
        finalPhrase = current;
        continue;
      }

      const lowerCur = current.toLowerCase();
      const lowerFinal = finalPhrase.toLowerCase();

      // If current is an extended version of earlier tokens (standard Android incremental update)
      if (lowerCur.startsWith(lowerFinal)) {
        finalPhrase = current;
      } else if (lowerFinal.startsWith(lowerCur)) {
        // Already contained
      } else {
        // Check for partial boundary overlap
        let merged = false;
        const wordsFinal = finalPhrase.split(/\s+/);
        const wordsCur = current.split(/\s+/);
        const maxOverlap = Math.min(wordsFinal.length, wordsCur.length);

        for (let overlap = maxOverlap; overlap > 0; overlap--) {
          const endSlice = wordsFinal.slice(-overlap).join(' ').toLowerCase();
          const startSlice = wordsCur.slice(0, overlap).join(' ').toLowerCase();
          if (endSlice === startSlice) {
            finalPhrase = wordsFinal.concat(wordsCur.slice(overlap)).join(' ');
            merged = true;
            break;
          }
        }

        if (!merged) {
          finalPhrase += ' ' + current;
        }
      }
    }

    // Clean any stuttered immediate duplicate words (e.g. "send send" -> "send")
    finalPhrase = finalPhrase.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1').trim();
    return finalPhrase;
  };

  const toggleSpeechToText = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Speech recognition is not supported in this browser. Please type your command.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      setSpeechStatus('');
      return;
    }

    setErrorMsg('');
    try {
      const rec = new SpeechRecognition();
      const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      // On mobile / Android, continuous mode causes duplicate cumulative hypotheses; use single-phrase mode
      rec.continuous = !isMobile;
      rec.interimResults = true;
      rec.lang = navigator.language || 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setSpeechStatus('Listening... Speak now');
      };

      rec.onresult = (event) => {
        const combined = cleanAndCollapseTranscripts(event);
        if (combined) {
          onChange(combined);
          setSpeechStatus('Speech converted to text!');
        }
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          if (event.error === 'not-allowed') {
            setErrorMsg('Microphone access denied. Please allow microphone permissions.');
          } else if (event.error === 'audio-capture') {
            setErrorMsg('No microphone detected. Please check microphone.');
          } else {
            setErrorMsg(`Voice input notice (${event.error}).`);
          }
        }
        setIsListening(false);
        setSpeechStatus('');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setErrorMsg('Could not access microphone.');
      setIsListening(false);
      setSpeechStatus('');
    }
  };

  const handleFileChange = (e) => {
    setErrorMsg('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const invalidFile = files.find(f => !allowedTypes.includes(f.type.toLowerCase()) && !f.type.startsWith('image/'));

    if (invalidFile) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WebP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filePromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            file,
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
    "Send bonafide letter to admin@example.com through Gmail",
    "Send Telegram message saying I will be late",
    "Send greetings to team through Gmail tomorrow at 9 AM"
  ];

  return (
    <div className="unified-cmd-container">
      <form onSubmit={handleSubmit} className="unified-cmd-form">
        {/* Main Card Surface */}
        <div className={`unified-cmd-card ${isListening ? 'listening-active' : ''}`}>
          <textarea
            rows={2}
            className="unified-cmd-textarea"
            placeholder="Tell CommandFlow what you want to automate..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          {/* Attachment Preview Chips */}
          {attachments.length > 0 && (
            <div className="unified-cmd-attachments">
              {attachments.map((att, idx) => (
                <div key={idx} className="unified-cmd-chip">
                  <ImageIcon size={14} />
                  <span className="unified-cmd-chip-name">{att.filename}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="unified-cmd-chip-remove"
                    title="Remove attachment"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Integrated Action Bar */}
          <div className="unified-cmd-actions">
            <div className="unified-cmd-left-actions">
              <button
                type="button"
                className={`unified-cmd-btn btn-mic ${isListening ? 'active-pulse' : ''}`}
                onClick={toggleSpeechToText}
                disabled={isLoading}
                title={isListening ? "Stop Listening" : "Voice Input (Speech to Text)"}
              >
                {isListening ? <MicOff size={17} color="#EF4444" /> : <Mic size={17} color="#10B981" />}
                <span>{isListening ? 'Stop' : 'Speak'}</span>
              </button>

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
                className="unified-cmd-btn btn-attach"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={isLoading}
                title="Upload Image Attachment"
              >
                <ImageIcon size={17} color="#2563EB" />
                <span>Image</span>
              </button>
            </div>

            <button
              type="submit"
              className="unified-cmd-submit-btn"
              disabled={!value || !value.trim() || isLoading}
              title="Run Automation Command"
            >
              {isLoading ? (
                <>
                  <Loader size={17} className="spin" />
                  <span className="submit-btn-text">Running...</span>
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  <span className="submit-btn-text">Run</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Speech or error status pills */}
      {speechStatus && (
        <div className="unified-cmd-status-pill status-speech">
          <span className="status-dot-pulse"></span>
          <span>{speechStatus}</span>
        </div>
      )}

      {errorMsg && (
        <div className="unified-cmd-status-pill status-error">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Quick Example Suggestions */}
      <div className="unified-cmd-examples">
        <span className="examples-heading">Try:</span>
        <div className="examples-scroll-track">
          {sampleCommands.map((cmd, idx) => (
            <button
              key={idx}
              type="button"
              className="example-pill-btn"
              onClick={() => onChange(cmd)}
            >
              "{cmd}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandInput;
