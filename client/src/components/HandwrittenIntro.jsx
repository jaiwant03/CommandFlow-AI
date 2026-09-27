import React, { useEffect, useState, useMemo } from 'react';
import { Bot, ArrowRight } from 'lucide-react';
import '../styles/handwrittenIntro.css';

/**
 * HandwrittenIntro Component
 * Renders a 5-second ultra-premium handwritten logo animation
 * for "Commandflow AI" before entering the login page.
 */
const HandwrittenIntro = ({ onComplete, duration = 5000 }) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(duration / 1000));
  const [isFading, setIsFading] = useState(false);

  // Generate random particles for atmospheric stardust
  const particles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(i * 5.5 + Math.random() * 4).toFixed(1)}%`,
      size: `${Math.floor(Math.random() * 3 + 2)}px`,
      duration: `${(Math.random() * 4 + 4).toFixed(1)}s`,
      delay: `${(Math.random() * 3).toFixed(1)}s`,
      opacity: (Math.random() * 0.5 + 0.3).toFixed(2),
    }));
  }, []);

  const handleFinish = () => {
    setIsFading(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 550);
  };

  useEffect(() => {
    const startTime = Date.now();
    const fadeTriggerTime = duration - 550; // begin fade 550ms before end

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      const remainingSeconds = Math.max(0, Math.ceil((duration - elapsed) / 1000));

      setProgress(currentProgress);
      setTimeLeft(remainingSeconds);

      if (elapsed >= fadeTriggerTime && !isFading) {
        setIsFading(true);
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 40);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        clearInterval(interval);
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, onComplete]);

  return (
    <div className={`handwritten-splash-container ${isFading ? 'fading-out' : ''}`}>
      {/* Dynamic ambient lighting mesh */}
      <div className="splash-ambient-mesh">
        <div className="splash-ambient-orb splash-orb-emerald" />
        <div className="splash-ambient-orb splash-orb-cyan" />
        <div className="splash-ambient-orb splash-orb-purple" />
      </div>

      {/* Grid overlay */}
      <div className="splash-grid-overlay" />

      {/* Stardust particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="splash-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Skip button for convenience */}
      <button
        type="button"
        className="splash-skip-btn"
        onClick={handleFinish}
        title="Skip intro directly to Login"
      >
        <span>Skip Intro</span>
        <kbd>Esc</kbd>
        <ArrowRight size={14} />
      </button>

      {/* Main Center Stage */}
      <div className="splash-main-content">
        {/* Top Emblem Badge */}
        <div className="splash-badge-container">
          <div className="splash-badge-icon">
            <Bot size={18} />
          </div>
          <span className="splash-badge-text">Autonomous Voice & Action AI</span>
        </div>

        {/* SVG Handwritten Stage */}
        <div className="splash-handwritten-stage">
          <svg
            className="handwritten-svg"
            viewBox="0 0 1050 260"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Main Brand Gradient: Emerald -> Cyan -> Blue */}
              <linearGradient id="introBrandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="40%" stopColor="#06B6D4" />
                <stop offset="85%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>

              {/* Electric AI Accent Gradient: Cyan -> Neon Purple */}
              <linearGradient id="introAIGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="60%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>

              {/* Calligraphy Ribbon Gradient */}
              <linearGradient id="introRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="45%" stopColor="#06B6D4" />
                <stop offset="85%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>

              {/* Gold Pen Nib Gradient */}
              <linearGradient id="goldNibGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>

              {/* Nib Glow Filter */}
              <filter id="nibBloomFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Soft Ink Brush Edge Filter */}
              <filter id="featherBrushFilter" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="4" />
              </filter>

              {/* Progressive Writing Reveal Mask with Feathered Brush Edge */}
              <mask id="inkWritingMask">
                <rect
                  x="0"
                  y="0"
                  width="130"
                  height="260"
                  fill="#FFFFFF"
                  filter="url(#featherBrushFilter)"
                >
                  <animate
                    attributeName="width"
                    from="130"
                    to="1050"
                    dur="2.4s"
                    begin="0.25s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.25 0.1 0.25 1"
                  />
                </rect>
              </mask>
            </defs>

            {/* Handwritten Text revealed progressively by the animated mask */}
            <g mask="url(#inkWritingMask)">
              <text
                x="525"
                y="135"
                textAnchor="middle"
                className="svg-handwritten-text"
              >
                <tspan className="handwritten-gradient-fill">Commandflow </tspan>
                <tspan className="handwritten-ai-fill">AI</tspan>
              </text>
              <text
                x="525"
                y="135"
                textAnchor="middle"
                className="svg-handwritten-text handwritten-stroke-accent"
              >
                Commandflow AI
              </text>
            </g>

            {/* Signature Underline Flourish Ribbon Path */}
            <path
              d="M 110,185 C 240,210 400,208 550,194 C 690,180 790,174 855,184 C 895,190 915,204 890,214 C 860,224 820,208 845,191 C 870,174 915,182 945,188"
              className="calligraphy-ribbon-path"
            />

            {/* Final Sparkle Starburst at flourish tip */}
            <g className="flourish-starburst" transform="translate(945, 188)">
              <path
                d="M 0,-12 L 3,-3 L 12,0 L 3,3 L 0,12 L -3,3 L -12,0 L -3,-3 Z"
                fill="#FDE047"
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            </g>

            {/* Animated In-SVG Fountain Pen Nib Assembly */}
            <g className="svg-pen-assembly">
              {/* Luminous Glow Blooms centered at the writing point */}
              <circle cx="0" cy="0" r="16" fill="#06B6D4" opacity="0.4" filter="url(#nibBloomFilter)" />
              <circle cx="0" cy="0" r="8" fill="#FFFFFF" opacity="0.9" filter="url(#nibBloomFilter)" />

              {/* Angled Luxury Fountain Pen Nib Body */}
              <g transform="translate(-16, -34) rotate(-22 16 34)">
                <path
                  d="M6 4 L26 4 L30 18 L16 34 L2 18 Z"
                  fill="url(#goldNibGrad)"
                  stroke="#FDE047"
                  strokeWidth="1.5"
                />
                {/* Breather hole & ink slit */}
                <circle cx="16" cy="18" r="2.2" fill="#0B132B" />
                <line x1="16" y1="18" x2="16" y2="34" stroke="#0B132B" strokeWidth="1.5" />
                {/* Highlight gleam */}
                <path d="M10 6 L16 16 L14 6 Z" fill="#FFFFFF" opacity="0.5" />
              </g>

              {/* Twinkling Star Particle at the Pen Point */}
              <g className="nib-active-sparkle">
                <path
                  d="M 0,-7 L 2,-2 L 7,0 L 2,2 L 0,7 L -2,2 L -7,0 L -2,-2 Z"
                  fill="#FFFFFF"
                />
              </g>
            </g>
          </svg>
        </div>

        {/* Subtitle & Multilingual Badges */}
        <div className="splash-subtitle-container">
          <div className="splash-subtitle">
            <span className="splash-subtitle-line" />
            <span>Voice-to-Action Automation Platform</span>
            <span className="splash-subtitle-line" />
          </div>

          <div className="splash-feature-pills">
            <div className="splash-pill">
              <span className="splash-pill-dot" />
              <span>English</span>
            </div>
            <div className="splash-pill">
              <span className="splash-pill-dot cyan" />
              <span>தமிழ் (Tamil)</span>
            </div>
            <div className="splash-pill">
              <span className="splash-pill-dot purple" />
              <span>Tanglish</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Second Luxury Progress Bar & Countdown */}
      <div className="splash-bottom-bar">
        <div className="splash-countdown-label">
          <span>Entering Workspace</span>
          <span className="splash-countdown-badge">{timeLeft}s</span>
        </div>
        <div className="splash-progress-track">
          <div
            className="splash-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default HandwrittenIntro;
