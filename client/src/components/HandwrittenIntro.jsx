import React, { useEffect, useState, useRef } from 'react';
import '../styles/handwrittenIntro.css';

/**
 * HandwrittenIntro Component
 * Authentic Real Human Handwriting Format on Pure White Background
 * Featuring Multicolor: Rama Green + Peacock Blue + Bright Violet Purple
 * with Model Shining Palette.
 * ONLY "CommandFlow AI" with real human penmanship cursive stroke motion.
 */
const HandwrittenIntro = ({ onComplete, duration = 5000 }) => {
  const [isFading, setIsFading] = useState(false);
  const [inkTipPos, setInkTipPos] = useState({ x: -100, y: -100, visible: false, color: '#00C896' });
  const svgRef = useRef(null);

  useEffect(() => {
    // Fade out slightly before complete
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 550);

    const finishTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    // Keyboard bypass
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

  // Synchronized Wet Ink Droplet tracking active stroke tip
  useEffect(() => {
    let animId;
    const startTime = performance.now();

    // Word 1: Command (0.2s - 1.4s) -> Rama Green
    // Word 2: Flow (1.5s - 2.2s) -> Peacock Blue
    // Word 3: AI (2.3s - 2.8s) -> Bright Violet Purple
    // Flourish: (2.9s - 3.7s) -> Multicolor gradient sweep
    const updateTip = (now) => {
      const elapsed = (now - startTime) / 1000;

      if (!svgRef.current) {
        animId = requestAnimationFrame(updateTip);
        return;
      }

      if (elapsed < 0.2) {
        setInkTipPos(prev => ({ ...prev, visible: false }));
      } else if (elapsed >= 0.2 && elapsed < 1.45) {
        // Tracing Command
        const path = svgRef.current.querySelector('.stroke-mask-command');
        if (path) {
          const total = path.getTotalLength();
          const progress = Math.min(Math.max((elapsed - 0.2) / 1.25, 0), 1);
          // Ease in-out cubic
          const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          const pt = path.getPointAtLength(eased * total);
          setInkTipPos({ x: pt.x, y: pt.y, visible: true, color: '#00C896' });
        }
      } else if (elapsed >= 1.45 && elapsed < 1.55) {
        // Pen lift pause
        setInkTipPos(prev => ({ ...prev, visible: false }));
      } else if (elapsed >= 1.55 && elapsed < 2.25) {
        // Tracing Flow
        const path = svgRef.current.querySelector('.stroke-mask-flow');
        if (path) {
          const total = path.getTotalLength();
          const progress = Math.min(Math.max((elapsed - 1.55) / 0.70, 0), 1);
          const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          const pt = path.getPointAtLength(eased * total);
          setInkTipPos({ x: pt.x, y: pt.y, visible: true, color: '#0088CC' });
        }
      } else if (elapsed >= 2.25 && elapsed < 2.35) {
        // Pen lift pause
        setInkTipPos(prev => ({ ...prev, visible: false }));
      } else if (elapsed >= 2.35 && elapsed < 2.85) {
        // Tracing AI
        const path = svgRef.current.querySelector('.stroke-mask-ai');
        if (path) {
          const total = path.getTotalLength();
          const progress = Math.min(Math.max((elapsed - 2.35) / 0.50, 0), 1);
          const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          const pt = path.getPointAtLength(eased * total);
          setInkTipPos({ x: pt.x, y: pt.y, visible: true, color: '#8B5CF6' });
        }
      } else if (elapsed >= 2.85 && elapsed < 2.95) {
        // Pen lift pause before flourish
        setInkTipPos(prev => ({ ...prev, visible: false }));
      } else if (elapsed >= 2.95 && elapsed < 3.75) {
        // Tracing Signature Flourish
        const path = svgRef.current.querySelector('.hw-flourish-path');
        if (path) {
          const total = path.getTotalLength();
          const progress = Math.min(Math.max((elapsed - 2.95) / 0.80, 0), 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const pt = path.getPointAtLength(eased * total);
          // Color shifts from Peacock Blue to Violet
          const tipColor = progress < 0.5 ? '#0284C7' : '#8B5CF6';
          setInkTipPos({ x: pt.x, y: pt.y, visible: true, color: tipColor });
        }
      } else {
        // Writing finished, fade out ink tip
        setInkTipPos(prev => ({ ...prev, visible: false }));
      }

      if (elapsed < 4.5) {
        animId = requestAnimationFrame(updateTip);
      }
    };

    animId = requestAnimationFrame(updateTip);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className={`handwritten-white-stage ${isFading ? 'fading-out' : ''}`}>
      {/* Model Shining Palette: Radiant studio ambient glow on pure white */}
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
        <svg
          ref={svgRef}
          className="real-handwriting-svg"
          viewBox="0 0 1160 300"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Multicolor Gradients for Words */}
            {/* Word 1: Rama Green */}
            <linearGradient id="ramaGreenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C896" />
              <stop offset="50%" stopColor="#00B894" />
              <stop offset="100%" stopColor="#00A884" />
            </linearGradient>

            {/* Word 2: Peacock Blue */}
            <linearGradient id="peacockBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0088CC" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Word 3: Bright Violet Purple */}
            <linearGradient id="violetPurpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>

            {/* Signature Flourish: Multicolor continuous blend */}
            <linearGradient id="flourishMultiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C896" />
              <stop offset="30%" stopColor="#0088CC" />
              <stop offset="65%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            {/* Specular Gloss Sheen Filter */}
            <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00C896" floodOpacity="0.18" />
              <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#8B5CF6" floodOpacity="0.14" />
            </filter>

            {/* =======================================================
                STROKE MASKS: Real handwriting cursive paths that reveal
                the underlying calligraphic letters along the pen stroke
                ======================================================= */}
            
            {/* Mask 1: "Command" Stroke Path */}
            <mask id="maskCommand" maskUnits="userSpaceOnUse" x="0" y="0" width="1160" height="300">
              <rect x="0" y="0" width="1160" height="300" fill="black" />
              <path
                d="M 175,122 C 158,102 135,118 126,145 C 118,172 132,194 158,194 C 178,194 192,176 195,158
                   C 198,140 216,140 224,152 C 234,166 230,192 245,192 C 255,192 258,162 268,154
                   C 278,146 288,176 295,192 C 304,192 308,162 318,154 C 328,146 338,176 345,192
                   C 354,192 358,162 368,154 C 378,146 388,176 395,192 C 404,192 408,162 418,154
                   C 426,148 436,152 440,165 C 445,180 435,192 450,192 C 460,192 468,162 478,154
                   C 488,146 498,176 505,192 C 514,192 518,162 528,154 C 538,146 545,155 548,165
                   C 552,180 540,192 555,192 C 565,192 570,165 572,120 C 573,95 570,192 585,192
                   C 595,192 605,178 615,165"
                fill="none"
                stroke="white"
                strokeWidth="48"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-mask-command"
              />
            </mask>

            {/* Mask 2: "Flow" Stroke Path */}
            <mask id="maskFlow" maskUnits="userSpaceOnUse" x="0" y="0" width="1160" height="300">
              <rect x="0" y="0" width="1160" height="300" fill="black" />
              <path
                d="M 645,108 C 665,96 705,94 725,106
                   M 685,100 C 675,130 668,165 660,192 C 655,200 648,198 654,185 C 662,170 690,162 708,162
                   M 698,172 C 715,120 725,95 732,95 C 738,95 732,145 734,192
                   C 736,192 748,165 758,154 C 768,144 785,152 788,168 C 792,185 782,192 798,192
                   C 808,192 815,168 825,160 C 835,152 842,185 850,192 C 858,192 865,165 875,158
                   C 885,150 895,162 902,170"
                fill="none"
                stroke="white"
                strokeWidth="48"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-mask-flow"
              />
            </mask>

            {/* Mask 3: "AI" Stroke Path */}
            <mask id="maskAI" maskUnits="userSpaceOnUse" x="0" y="0" width="1160" height="300">
              <rect x="0" y="0" width="1160" height="300" fill="black" />
              <path
                d="M 915,192 C 932,150 948,110 960,95 C 970,110 985,155 998,192
                   M 932,152 C 955,148 975,148 990,152
                   M 1008,102 C 1025,100 1045,100 1058,102
                   M 1033,104 L 1033,190
                   M 1012,190 C 1025,192 1045,192 1058,190"
                fill="none"
                stroke="white"
                strokeWidth="48"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-mask-ai"
              />
            </mask>
          </defs>

          {/* =======================================================
              MAIN CALLIGRAPHIC TYPOGRAPHY LAYER
              Rendered in authentic luxury script with multicolor fills
              Masked by the precision stroke masks
              ======================================================= */}
          <g filter="url(#softGlow)" className="hw-rendered-text-group">
            {/* Word 1: Command (Rama Green) */}
            <g mask="url(#maskCommand)">
              <text
                x="120"
                y="184"
                className="hw-svg-text hw-text-command"
                fill="url(#ramaGreenGrad)"
              >
                Command
              </text>
            </g>

            {/* Word 2: Flow (Peacock Blue) */}
            <g mask="url(#maskFlow)">
              <text
                x="650"
                y="184"
                className="hw-svg-text hw-text-flow"
                fill="url(#peacockBlueGrad)"
              >
                Flow
              </text>
            </g>

            {/* Word 3: AI (Bright Violet Purple) */}
            <g mask="url(#maskAI)">
              <text
                x="925"
                y="184"
                className="hw-svg-text hw-text-ai"
                fill="url(#violetPurpleGrad)"
              >
                AI
              </text>
            </g>
          </g>

          {/* =======================================================
              CALLIGRAPHIC SIGNATURE FLOURISH UNDERLINE
              Gracefully sweeps underneath the entire handwritten logo
              ======================================================= */}
          <path
            d="M 105,224 C 280,248 520,242 760,222 C 890,210 990,206 1035,214 C 1060,218 1075,228 1055,234 C 1030,240 995,230 1020,218 C 1038,208 1068,214 1090,220"
            fill="none"
            stroke="url(#flourishMultiGrad)"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hw-flourish-path"
          />

          {/* Luminous Liquid Ink Bead (Active Pen Tip) */}
          {inkTipPos.visible && (
            <g className="hw-ink-tip-group" transform={`translate(${inkTipPos.x}, ${inkTipPos.y})`}>
              {/* Outer soft glow */}
              <circle r="14" fill={inkTipPos.color} opacity="0.25" />
              {/* Mid intensity halo */}
              <circle r="8" fill={inkTipPos.color} opacity="0.5" />
              {/* Bright center bead */}
              <circle r="3.5" fill="#FFFFFF" />
            </g>
          )}

          {/* Model Shining Specular Sheen Sweep */}
          <rect
            x="0"
            y="50"
            width="1160"
            height="210"
            fill="url(#sheenGrad)"
            className="hw-sheen-sweep-rect"
            pointerEvents="none"
          />
        </svg>
      </div>
    </div>
  );
};

export default HandwrittenIntro;
