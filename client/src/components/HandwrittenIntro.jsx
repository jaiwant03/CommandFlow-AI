import React, { useEffect, useState, useMemo } from 'react';
import '../styles/handwrittenIntro.css';

/**
 * HandwrittenIntro Component
 * Authentic Human Handwriting Format on Pure White Background
 * Featuring Multicolor: Rama Green + Peacock Blue + Bright Violet Purple
 * with Model Shining Palette.
 * ONLY "CommandFlow AI" with realistic stroke-by-stroke handwriting cadence.
 */
const HandwrittenIntro = ({ onComplete, duration = 5000 }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTriggerTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 550);

    const finishTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    // Subtle keyboard bypass (Escape/Enter/Space) without rendering any UI buttons
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        clearTimeout(fadeTriggerTimer);
        clearTimeout(finishTimer);
        setIsFading(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(fadeTriggerTimer);
      clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, onComplete]);

  // Confident, fluid human handwriting cadence
  // Word 1: Command (0.2s - 1.3s)
  // Word 2: Flow (1.4s - 2.1s)
  // Word 3: AI (2.2s - 2.7s)
  const letters = useMemo(() => [
    { char: 'C', word: 1, delay: 0.20, dur: 0.26 },
    { char: 'o', word: 1, delay: 0.40, dur: 0.16 },
    { char: 'm', word: 1, delay: 0.54, dur: 0.20 },
    { char: 'm', word: 1, delay: 0.72, dur: 0.20 },
    { char: 'a', word: 1, delay: 0.90, dur: 0.16 },
    { char: 'n', word: 1, delay: 1.04, dur: 0.16 },
    { char: 'd', word: 1, delay: 1.18, dur: 0.22 },
    // Natural pen lift between words (100ms pause)
    { char: 'F', word: 2, delay: 1.48, dur: 0.26 },
    { char: 'l', word: 2, delay: 1.70, dur: 0.18 },
    { char: 'o', word: 2, delay: 1.86, dur: 0.16 },
    { char: 'w', word: 2, delay: 2.00, dur: 0.20 },
    // Natural pen lift before AI (100ms pause)
    { char: 'A', word: 3, delay: 2.28, dur: 0.26 },
    { char: 'I', word: 3, delay: 2.52, dur: 0.24 },
  ], []);

  return (
    <div className={`handwritten-white-stage ${isFading ? 'fading-out' : ''}`}>
      {/* Model Shining Palette: Radiant pearlescent ambient glows on pure white */}
      <div className="model-shine-backdrop" />
      <div className="model-caustic-beam" />
      <div className="model-prism-glow" />

      {/* Floating Micro Diamond Sparkles */}
      <div className="sparkle-flare sparkle-1" />
      <div className="sparkle-flare sparkle-2" />
      <div className="sparkle-flare sparkle-3" />
      <div className="sparkle-flare sparkle-4" />

      {/* Center Stage: ONLY the word "CommandFlow AI" in Real Handwriting Format */}
      <div className="handwritten-center-box">
        {/* Animated Cursive Word Stage */}
        <div className="real-handwriting-word">
          {/* Word 1: Command */}
          <span className="hw-word hw-word-command">
            {letters.filter(l => l.word === 1).map((item, idx) => (
              <span
                key={`c-${idx}`}
                className="hw-char"
                style={{
                  animationDelay: `${item.delay}s`,
                  animationDuration: `${item.dur}s`,
                }}
              >
                {item.char}
              </span>
            ))}
          </span>

          <span className="hw-word-spacer" />

          {/* Word 2: Flow */}
          <span className="hw-word hw-word-flow">
            {letters.filter(l => l.word === 2).map((item, idx) => (
              <span
                key={`f-${idx}`}
                className="hw-char"
                style={{
                  animationDelay: `${item.delay}s`,
                  animationDuration: `${item.dur}s`,
                }}
              >
                {item.char}
              </span>
            ))}
          </span>

          <span className="hw-word-spacer" />

          {/* Word 3: AI */}
          <span className="hw-word hw-word-ai">
            {letters.filter(l => l.word === 3).map((item, idx) => (
              <span
                key={`ai-${idx}`}
                className="hw-char"
                style={{
                  animationDelay: `${item.delay}s`,
                  animationDuration: `${item.dur}s`,
                }}
              >
                {item.char}
              </span>
            ))}
          </span>

          {/* Gloss Sheen Reflection sweeping across completed letters */}
          <span className="hw-model-gloss-shine" />
        </div>

        {/* Real Calligraphic Signature Flourish Underline (Draws smoothly right after AI is written) */}
        <svg
          className="hw-flourish-svg"
          viewBox="0 0 1000 60"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="flourishMultiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C896" />
              <stop offset="35%" stopColor="#0088CC" />
              <stop offset="70%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <path
            d="M 40,24 C 180,44 380,42 560,28 C 720,16 840,12 905,20 C 940,24 960,34 940,40 C 915,46 880,36 905,24 C 925,14 960,20 985,25"
            fill="none"
            stroke="url(#flourishMultiGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hw-flourish-stroke"
          />
        </svg>

        {/* Traveling Liquid Ink Droplet (Luminous Ink Point - Zero Pen Graphics) */}
        <div className="hw-traveling-ink-tip" />
      </div>
    </div>
  );
};

export default HandwrittenIntro;
