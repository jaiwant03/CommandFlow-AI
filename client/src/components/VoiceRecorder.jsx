import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader, CheckCircle, AlertCircle, X, ArrowRight, Sparkles } from 'lucide-react';
import '../styles/voice.css';

const VoiceRecorder = ({ onCommandExecute, onTranscriptComplete, selectedLanguage = 'auto', onClose }) => {
  const [status, setStatus] = useState('IDLE'); // IDLE, LISTENING, PROCESSING, SUCCESS, ERROR
  const [transcript, setTranscript] = useState('');
  const [statusText, setStatusText] = useState('Click start to speak...');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLanguage === 'tamil' ? 'ta-IN' : 'en-US';

      rec.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      rec.onerror = (event) => {
        console.warn('[Speech Rec Error]:', event.error);
        setStatus('ERROR');
        setStatusText(`Speech Recognition error (${event.error}). You can type your command.`);
      };

      setRecognition(rec);
    }
  }, [selectedLanguage]);

  const startListening = () => {
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
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Recognition stop error:', err);
      }
    }
    setStatus('IDLE');
    setStatusText('Speech captured. Review or execute below.');
  };

  const handleUseTranscript = () => {
    const textToUse = transcript.trim() || "Send a leave letter to my class advisor through Gmail. I need leave tomorrow because of a family function.";
    if (onTranscriptComplete) {
      onTranscriptComplete(textToUse);
    }
    if (onClose) onClose();
  };

  const handleDirectExecute = async () => {
    const textToUse = transcript.trim() || "Send a leave letter to my class advisor through Gmail. I need leave tomorrow because of a family function.";
    setStatus('PROCESSING');
    setStatusText('Analyzing voice command...');

    if (onCommandExecute) {
      await onCommandExecute(textToUse, 'voice');
    }

    setStatus('SUCCESS');
    setStatusText('Voice command processed successfully!');
    setTimeout(() => {
      if (onClose) onClose();
    }, 1000);
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
