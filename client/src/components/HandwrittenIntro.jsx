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

  // Letter sequence for authentic human handwriting timing
  // Word 1: Command (Rama Green -> Peacock Blue)
  // Word 2: Flow (Peacock Blue -> Violet)
  // Word 3: AI (Bright Violet Purple)
  const letters = useMemo(() => [
    { char: 'C', word: 1, delay: 0.20, dur: 0.32 },
    { char: 'o', word: 1, delay: 0.48, dur: 0.20 },
    { char: 'm', word: 1, delay: 0.65, dur: 0.26 },
    { char: 'm', word: 1, delay: 0.88, dur: 0.26 },
    { char: 'a', word: 1, delay: 1.11, dur: 0.20 },
    { char: 'n', word: 1, delay: 1.28, dur: 0.20 },
    { char: 'd', word: 1, delay: 1.45, dur: 0.28 },
    // Natural pen lift between words (120ms pause)
    { char: 'F', word: 2, delay: 1.82, dur: 0.32 },
    { char: 'l', word: 2, delay: 2.11, dur: 0.22 },
    { char: 'o', word: 2, delay: 2.30, dur: 0.20 },
    { char: 'w', word: 2, delay: 2.47, dur: 0.25 },
    // Natural pen lift before AI (130ms pause)
    { char: 'A', word: 3, delay: 2.82, dur: 0.32 },
    { char: 'I', word: 3, delay: 3.12, dur: 0.30 },
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
