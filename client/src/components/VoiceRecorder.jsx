import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader, CheckCircle, AlertCircle, X, ArrowRight, Sparkles } from 'lucide-react';
import '../styles/voice.css';

const VoiceRecorder = ({ onCommandExecute, onTranscriptComplete, selectedLanguage = 'auto', onClose }) => {
  const [status, setStatus] = useState('IDLE'); // IDLE, LISTENING, PROCESSING, SUCCESS, ERROR
  const [transcript, setTranscript] = useState('');
  const [statusText, setStatusText] = useState('Click start to speak...');
  const [recognition, setRecognition] = useState(null);

  const silenceTimerRef = React.useRef(null);
  const hasTriggeredRef = React.useRef(false);
  const latestTranscriptRef = React.useRef('');

  const executeVoiceCommand = React.useCallback(async (textToExecute) => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const finalCmd = textToExecute ? textToExecute.trim() : latestTranscriptRef.current.trim();
    if (!finalCmd) {
      hasTriggeredRef.current = false;
      return;
    }

    setStatus('PROCESSING');
    setStatusText('Analyzing voice command automatically...');

    try {
      if (onCommandExecute) {
        await onCommandExecute(finalCmd, 'voice');
      }
      setStatus('SUCCESS');
      setStatusText('Voice command processed successfully!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      console.error('[Voice Execution Error]:', err);
      setStatus('ERROR');
      setStatusText(err.message || 'Execution error encountered.');
      hasTriggeredRef.current = false;
    }
  }, [onCommandExecute, onClose]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLanguage === 'tamil' ? 'ta-IN' : 'en-US';

      rec.onresult = (event) => {
        let finalText = '';
        let interimText = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript + ' ';
          } else {
            interimText += res[0].transcript;
          }
        }

        const combined = (finalText + interimText).trim();
        setTranscript(combined);
        latestTranscriptRef.current = combined;

        // Auto-silence timer: when user finishes speaking (1.8s silence)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (combined.length > 5 && !hasTriggeredRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            try {
              rec.stop();
            } catch (e) {}
            executeVoiceCommand(combined);
          }, 1800);
        }
      };

      rec.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (!hasTriggeredRef.current && latestTranscriptRef.current.trim().length > 3) {
          executeVoiceCommand(latestTranscriptRef.current);
        }
      };

      rec.onerror = (event) => {
        console.warn('[Speech Rec Error]:', event.error);
        if (event.error !== 'no-speech') {
          setStatus('ERROR');
          setStatusText(`Speech Recognition issue (${event.error}). You can edit or type command.`);
        }
      };

      setRecognition(rec);
    }
  }, [selectedLanguage, executeVoiceCommand]);

  const startListening = () => {
    hasTriggeredRef.current = false;
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
    if (!hasTriggeredRef.current && latestTranscriptRef.current.trim()) {
      executeVoiceCommand(latestTranscriptRef.current);
    } else if (!latestTranscriptRef.current.trim()) {
      setStatus('IDLE');
      setStatusText('Speech captured. Review or execute below.');
    }
  };

  const handleUseTranscript = () => {
    const textToUse = transcript.trim() || latestTranscriptRef.current.trim();
    if (onTranscriptComplete) {
      onTranscriptComplete(textToUse);
    }
    if (onClose) onClose();
  };

  const handleDirectExecute = async () => {
    const textToUse = transcript.trim() || latestTranscriptRef.current.trim();
    executeVoiceCommand(textToUse);
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
            disabled={status === 'PROCESSING'}
          >
            {status === 'PROCESSING' ? (
              <Loader className="spin" size={32} />
            ) : status === 'LISTENING' ? (
              <MicOff size={32} />
            ) : (
              <Mic size={32} />
            )}
          </button>
        </div>

        <div className="voice-status-text">
          {status === 'PROCESSING' && <Loader size={16} className="spin" />}
          {status === 'SUCCESS' && <CheckCircle size={16} color="var(--success)" />}
          {status === 'ERROR' && <AlertCircle size={16} color="var(--danger)" />}
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
          {status !== 'LISTENING' && status !== 'PROCESSING' && (
            <>
              <button className="btn btn-secondary" onClick={startListening}>
                <Mic size={16} />
                <span>{transcript ? 'Re-record' : 'Start Speaking'}</span>
              </button>

              {transcript && (
                <button className="btn btn-secondary" onClick={handleUseTranscript}>
                  <ArrowRight size={16} />
                  <span>Transfer to Input Box</span>
                </button>
              )}

              <button className="btn btn-primary" onClick={handleDirectExecute}>
                <Sparkles size={16} />
                <span>Analyze & Execute</span>
              </button>
            </>
          )}

          {status === 'LISTENING' && (
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
