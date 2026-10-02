import React, { useState, useEffect } from 'react';
import { Mic, MicOff, CheckCircle, AlertCircle, X, ArrowRight, Sparkles } from 'lucide-react';
import '../styles/voice.css';

const VoiceRecorder = ({ onTranscriptComplete, selectedLanguage = 'auto', onClose }) => {
  const [status, setStatus] = useState('IDLE'); // IDLE, LISTENING, ERROR
  const [transcript, setTranscript] = useState('');
  const [statusText, setStatusText] = useState('Click start to speak...');
  const [recognition, setRecognition] = useState(null);

  const silenceTimerRef = React.useRef(null);
  const latestTranscriptRef = React.useRef('');

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

      if (lowerCur.startsWith(lowerFinal)) {
        finalPhrase = current;
      } else if (lowerFinal.startsWith(lowerCur)) {
        // Already contained
      } else {
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

    finalPhrase = finalPhrase.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1').trim();
    return finalPhrase;
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      rec.continuous = !isMobile;
      rec.interimResults = true;
      rec.lang = selectedLanguage === 'tamil' ? 'ta-IN' : 'en-US';

      rec.onresult = (event) => {
        const combined = cleanAndCollapseTranscripts(event);
        setTranscript(combined);
        latestTranscriptRef.current = combined;

        // Stream live text to command input box
        if (onTranscriptComplete && combined) {
          onTranscriptComplete(combined);
        }

        // When user pauses speaking (1.8s silence), stop recording without executing
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (combined.length > 2) {
          silenceTimerRef.current = setTimeout(() => {
            try {
              rec.stop();
            } catch (e) {}
            setStatus('IDLE');
            setStatusText('✓ Speech converted to text in command input!');
          }, 1800);
        }
      };

      rec.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setStatus('IDLE');
        if (latestTranscriptRef.current.trim()) {
          setStatusText('✓ Speech converted to text in command input!');
          if (onTranscriptComplete) {
            onTranscriptComplete(latestTranscriptRef.current.trim());
          }
        } else {
          setStatusText('Click start to speak...');
        }
      };

      rec.onerror = (event) => {
        console.warn('[Speech Rec Event]:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          if (event.error === 'not-allowed') {
            setStatus('ERROR');
            setStatusText('Microphone permission denied. Please allow mic access.');
          } else {
            setStatus('ERROR');
            setStatusText(`Speech Recognition issue (${event.error}). You can edit or type command.`);
          }
        }
      };

      setRecognition(rec);
    }
  }, [selectedLanguage, onTranscriptComplete]);

  const startListening = () => {
    latestTranscriptRef.current = '';
    setStatus('LISTENING');
    setTranscript('');
    setStatusText('Listening... Speak your command naturally');
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Recognition stop error:', err);
      }
    }
    setStatus('IDLE');
    if (latestTranscriptRef.current.trim()) {
      setStatusText('✓ Speech converted to text in command input!');
      if (onTranscriptComplete) {
        onTranscriptComplete(latestTranscriptRef.current.trim());
      }
    }
  };

  const handleUseTranscript = () => {
    const textToUse = transcript.trim() || latestTranscriptRef.current.trim();
    if (onTranscriptComplete && textToUse) {
      onTranscriptComplete(textToUse);
    }
    if (onClose) onClose();
  };

  return (
    <div className="voice-modal-overlay" onClick={onClose}>
      <div className="voice-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="voice-close-btn" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        <div className="voice-modal-header">
          <h3 className="voice-modal-title">Voice Command Input</h3>
          <p className="voice-modal-subtitle">
            Speak naturally in English, Tamil, or Tanglish
          </p>
        </div>

        <div className="voice-wave-container">
          {status === 'LISTENING' && (
            <>
              <div className="voice-wave-ring"></div>
              <div className="voice-wave-ring"></div>
            </>
          )}
          <button
            className={`mic-hero-btn ${status === 'LISTENING' ? 'listening' : ''}`}
            onClick={status === 'LISTENING' ? stopListening : startListening}
          >
            {status === 'LISTENING' ? (
              <MicOff size={32} />
            ) : (
              <Mic size={32} />
            )}
          </button>
        </div>

        <div className="voice-status-text">
          {status === 'ERROR' ? (
            <AlertCircle size={16} color="var(--danger)" />
          ) : transcript ? (
            <CheckCircle size={16} color="var(--success)" />
          ) : null}
          <span>{statusText}</span>
        </div>

        <div className="transcript-preview">
          {transcript || (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Sample: "Send my bonafide request letter to official.jaiwantkarrunworks@gmail.com through Gmail tomorrow at 9 AM..."
            </span>
          )}
        </div>

        <div className="voice-modal-actions">
          {status !== 'LISTENING' ? (
            <>
              <button className="btn btn-secondary" onClick={startListening}>
                <Mic size={16} />
                <span>{transcript ? 'Re-record' : 'Start Speaking'}</span>
              </button>

              <button className="btn btn-primary" onClick={handleUseTranscript}>
                <ArrowRight size={16} />
                <span>Use Converted Text</span>
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={stopListening}>
              <MicOff size={16} />
              <span>Stop Recording</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
