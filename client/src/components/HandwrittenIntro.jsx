import React, { useEffect, useState, useMemo, useRef } from 'react';
import '../styles/handwrittenIntro.css';

/**
 * HandwrittenIntro Component
 * Great Vibes Cursive Theme with Exact Handwriting Motion
 * Featuring full tall letter 'd' in Command and True Capital 'A' and 'I' in AI
 * Pure White Background with Model Shining Palette
 * Multicolor: Rama Green + Peacock Blue + Bright Violet Purple
 * ONLY "CommandFlow AI" with calligraphic flourish underline
 */
const HandwrittenIntro = ({ onComplete, duration = 5000 }) => {
  const [isFading, setIsFading] = useState(false);
  const [inkTip, setInkTip] = useState({ x: -100, y: -100, visible: false, color: '#00C896' });
  const containerRef = useRef(null);
  const charRefs = useRef({});

  useEffect(() => {
    // Fade out 550ms before complete
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 550);

    const finishTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    // Subtle keyboard bypass
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        clearTimeout(fadeTimer);
        clearTimeout(finishTimer);
        setIsFading(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, onComplete]);

  // Cursive handwriting letters configuration:
  // Word 1: Command (Great Vibes with tall Pinyon 'd' for 100% visibility)
  // Word 2: Flow (Great Vibes cursive)
  // Word 3: AI (True bold Capital 'A' and Capital 'I' with full vertical stem & serifs)
  const letters = useMemo(() => [
    // Word 1: Command (Rama Green)
    { id: 'c-0', char: 'C', word: 1, delay: 0.20, dur: 0.26, color: '#00C896', fontClass: 'font-gv' },
    { id: 'c-1', char: 'o', word: 1, delay: 0.42, dur: 0.16, color: '#00C896', fontClass: 'font-gv' },
    { id: 'c-2', char: 'm', word: 1, delay: 0.56, dur: 0.20, color: '#00B894', fontClass: 'font-gv' },
    { id: 'c-3', char: 'm', word: 1, delay: 0.74, dur: 0.20, color: '#00B894', fontClass: 'font-gv' },
    { id: 'c-4', char: 'a', word: 1, delay: 0.92, dur: 0.16, color: '#00A884', fontClass: 'font-gv' },
    { id: 'c-5', char: 'n', word: 1, delay: 1.06, dur: 0.16, color: '#00A884', fontClass: 'font-gv' },
    // Letter 'd' styled with tall elegant ascender so it is 100% fully visible as a complete 'd'
    { id: 'c-6', char: 'd', word: 1, delay: 1.20, dur: 0.22, color: '#0088CC', fontClass: 'font-pinyon-d' },

    // Pen lift pause (120ms)

    // Word 2: Flow (Peacock Blue)
    { id: 'f-0', char: 'F', word: 2, delay: 1.52, dur: 0.26, color: '#0088CC', fontClass: 'font-gv' },
    { id: 'f-1', char: 'l', word: 2, delay: 1.76, dur: 0.18, color: '#0284C7', fontClass: 'font-gv' },
    { id: 'f-2', char: 'o', word: 2, delay: 1.92, dur: 0.16, color: '#0284C7', fontClass: 'font-gv' },
    { id: 'f-3', char: 'w', word: 2, delay: 2.06, dur: 0.20, color: '#0369A1', fontClass: 'font-gv' },

    // Pen lift pause (120ms)

    // Word 3: AI (Bright Violet Purple) - True Capital A and fully visible Capital I
    { id: 'ai-0', char: 'A', word: 3, delay: 2.38, dur: 0.24, color: '#8B5CF6', fontClass: 'font-capital-a' },
    { id: 'ai-1', char: 'I', word: 3, delay: 2.60, dur: 0.24, color: '#7C3AED', fontClass: 'font-capital-i' },
  ], []);

  // Synchronize liquid ink tip with the active letter being written
  useEffect(() => {
    let animId;
    const startTime = performance.now();

    const updateTipPosition = (now) => {
      const elapsed = (now - startTime) / 1000;

      if (!containerRef.current) {
        animId = requestAnimationFrame(updateTipPosition);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();

      // Find which letter is currently active
      const activeChar = letters.find(
        (l) => elapsed >= l.delay && elapsed < l.delay + l.dur
      );

      if (activeChar && charRefs.current[activeChar.id]) {
        const el = charRefs.current[activeChar.id];
        const rect = el.getBoundingClientRect();
        const progress = Math.min((elapsed - activeChar.delay) / activeChar.dur, 1);

        const x = rect.left + rect.width * progress - containerRect.left;
        const y = rect.top + rect.height * 0.65 - containerRect.top;

        setInkTip({ x, y, visible: true, color: activeChar.color });
      } else if (elapsed >= 2.95 && elapsed < 3.80) {
        // Flourish underline active
        const progress = Math.min((elapsed - 2.95) / 0.85, 1);
        const x = containerRect.width * (0.15 + progress * 0.72);
        const y = containerRect.height * 0.88;
        const tipColor = progress < 0.5 ? '#0284C7' : '#8B5CF6';
        setInkTip({ x, y, visible: true, color: tipColor });
      } else {
        setInkTip((prev) => ({ ...prev, visible: false }));
      }

      if (elapsed < 4.6) {
        animId = requestAnimationFrame(updateTipPosition);
      }
    };

    animId = requestAnimationFrame(updateTipPosition);
    return () => cancelAnimationFrame(animId);
  }, [letters]);

  return (
    <div className={`handwritten-white-stage ${isFading ? 'fading-out' : ''}`}>
      {/* Model Shining Palette: Radiant ambient studio light on pure white */}
      <div className="model-shine-backdrop" />
      <div className="model-caustic-beam" />
      <div className="model-prism-glow" />

      {/* Floating Micro Diamond Sparkles */}
      <div className="sparkle-flare sparkle-1" />
      <div className="sparkle-flare sparkle-2" />
      <div className="sparkle-flare sparkle-3" />
      <div className="sparkle-flare sparkle-4" />

      {/* Center Stage: ONLY the word "CommandFlow AI" */}
      <div className="handwritten-center-box" ref={containerRef}>
        <div className="great-vibes-stage">
          {/* Word 1: Command (Rama Green) with full tall letter 'd' */}
          <span className="gv-word gv-word-command">
            {letters
              .filter((l) => l.word === 1)
              .map((l) => (
                <span
                  key={l.id}
                  ref={(el) => (charRefs.current[l.id] = el)}
                  className={`gv-char ${l.fontClass}`}
                  style={{
                    animationDelay: `${l.delay}s`,
                    animationDuration: `${l.dur}s`,
                  }}
                >
                  {l.char}
                </span>
              ))}
          </span>

          <span className="gv-word-spacer" />

          {/* Word 2: Flow (Peacock Blue) */}
          <span className="gv-word gv-word-flow">
            {letters
              .filter((l) => l.word === 2)
              .map((l) => (
                <span
                  key={l.id}
                  ref={(el) => (charRefs.current[l.id] = el)}
                  className={`gv-char ${l.fontClass}`}
                  style={{
                    animationDelay: `${l.delay}s`,
                    animationDuration: `${l.dur}s`,
                  }}
                >
                  {l.char}
                </span>
              ))}
          </span>

          <span className="gv-word-spacer" />

          {/* Word 3: AI (Bright Violet Purple) - True Capital A and Capital I */}
          <span className="gv-word gv-word-ai">
            {letters
              .filter((l) => l.word === 3)
              .map((l) => (
                <span
                  key={l.id}
                  ref={(el) => (charRefs.current[l.id] = el)}
                  className={`gv-char ${l.fontClass}`}
                  style={{
                    animationDelay: `${l.delay}s`,
                    animationDuration: `${l.dur}s`,
                  }}
                >
                  {l.char}
                </span>
              ))}
          </span>
        </div>

        {/* Calligraphic Signature Flourish Underline */}
        <svg
          className="gv-flourish-svg"
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
            d="M 60,26 C 240,46 480,44 680,28 C 820,16 910,14 945,22 C 970,28 980,36 960,42 C 935,48 905,38 930,26 C 948,16 978,22 995,26"
            fill="none"
            stroke="url(#flourishMultiGrad)"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="gv-flourish-stroke"
          />
        </svg>

        {/* Luminous Liquid Ink Bead (Active Pen Tip) */}
        {inkTip.visible && (
          <div
            className="gv-traveling-ink-bead"
            style={{
              transform: `translate(${inkTip.x}px, ${inkTip.y}px)`,
              color: inkTip.color,
            }}
          >
            <div className="ink-bead-halo" style={{ backgroundColor: inkTip.color }} />
            <div className="ink-bead-core" />
          </div>
        )}
      </div>
    </div>
  );
};

export default HandwrittenIntro;
