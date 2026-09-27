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

    // Word 1: Command (0.2s - 1.45s) -> Rama Green
    // Word 2: Flow (1.55s - 2.25s) -> Peacock Blue
    // Word 3: AI (2.35s - 2.85s) -> Bright Violet Purple
    // Flourish: (2.95s - 3.75s) -> Multicolor gradient sweep
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
          const tipColor = progress < 0.5 ? '#0284C7' : '#8B5CF6';
          setInkTipPos({ x: pt.x, y: pt.y, visible: true, color: tipColor });
        }
      } else {
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
              <stop offset="60%" stopColor="#00B894" />
              <stop offset="100%" stopColor="#00A884" />
            </linearGradient>

            {/* Word 2: Peacock Blue */}
            <linearGradient id="peacockBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0088CC" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Word 3: Bright Violet Purple */}
            <linearGradient id="violetPurpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="60%" stopColor="#7C3AED" />
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
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00C896" floodOpacity="0.16" />
              <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#8B5CF6" floodOpacity="0.12" />
            </filter>

            {/* =======================================================
                STROKE MASKS: Real handwriting cursive paths that reveal
                the underlying calligraphic letters along the pen stroke
                ======================================================= */}
            
            {/* Mask 1: "Command" Stroke Path */}
            <mask id="maskCommand" maskUnits="userSpaceOnUse" x="0" y="0" width="1160" height="300">
              <rect x="0" y="0" width="1160" height="300" fill="black" />
              <path
                d="M 260,115 C 235,105 220,135 224,168 C 228,185 248,185 265,165
                   C 275,145 268,160 276,175 C 284,185 296,175 298,155 C 295,140 305,146 308,175
                   C 318,142 326,175 336,142 C 344,175 354,142 362,175 C 370,160 376,175 386,142
                   C 394,175 404,142 412,175 C 422,142 430,175 438,160 C 448,144 438,158 446,175
                   C 456,185 464,170 466,150 C 466,175 475,162 482,175 C 492,142 500,175 510,142
                   C 518,175 528,160 538,144 C 528,158 536,175 550,175 C 554,150 556,95 556,175
                   C 565,185 580,175 595,165"
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
                d="M 615,102 C 640,95 660,95 675,104
                   M 648,100 C 640,135 634,168 626,178 C 620,182 630,176 648,165
                   M 628,138 L 656,136
                   M 658,168 C 670,115 678,96 680,96 C 682,96 676,145 676,175 C 684,180 688,165 694,155
                   C 686,160 692,175 706,175 C 716,170 714,148 718,145 C 722,175 732,148 742,175
                   C 750,180 756,155 765,142 C 772,138 780,148 788,155"
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
                d="M 816,175 C 830,135 842,95 846,92 C 850,95 862,145 870,175
                   M 826,145 L 862,142
                   M 885,100 L 920,100
                   M 902,102 L 902,175
                   M 885,175 L 922,175"
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
                x="220"
                y="175"
                className="hw-svg-text hw-text-command"
                fill="url(#ramaGreenGrad)"
              >
                Command
              </text>
            </g>

            {/* Word 2: Flow (Peacock Blue) */}
            <g mask="url(#maskFlow)">
              <text
                x="620"
                y="175"
                className="hw-svg-text hw-text-flow"
                fill="url(#peacockBlueGrad)"
              >
                Flow
              </text>
            </g>

            {/* Word 3: AI (Bright Violet Purple) */}
            <g mask="url(#maskAI)">
              <text
                x="818"
                y="175"
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
            d="M 180,222 C 340,244 560,240 760,222 C 880,212 940,208 970,214 C 990,218 1000,226 985,232 C 965,236 935,228 955,218 C 970,210 995,214 1015,220"
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
        </svg>
      </div>
    </div>
  );
};

export default HandwrittenIntro;
