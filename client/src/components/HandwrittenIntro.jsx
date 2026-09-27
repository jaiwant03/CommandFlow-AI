import React, { useEffect, useState } from 'react';
import '../styles/handwrittenIntro.css';

/**
 * HandwrittenIntro Component
 * Renders a pure, white-background model shining palette handwritten animation
 * containing ONLY the word "CommandFlow AI" with multicolor:
 * Rama Green + Peacock Blue + Bright Violet Purple.
 * Exactly handwriting motion without any pen logo image.
 */
const HandwrittenIntro = ({ onComplete, duration = 5000 }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTriggerTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 600);

    const finishTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    // Allow subtle keyboard bypass without rendering any visible UI buttons
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

  return (
    <div className={`handwritten-white-stage ${isFading ? 'fading-out' : ''}`}>
      {/* Model Shining Palette: Luminous pearlescent ambient glows */}
      <div className="model-shine-backdrop" />
      <div className="model-caustic-beam" />
      <div className="model-prism-glow" />

      {/* Floating Diamond Sparkle Flares on the White Canvas */}
      <div className="sparkle-flare sparkle-1" />
      <div className="sparkle-flare sparkle-2" />
      <div className="sparkle-flare sparkle-3" />
      <div className="sparkle-flare sparkle-4" />

      {/* Center Stage: ONLY the word "CommandFlow AI" */}
      <div className="handwritten-center-box">
        <svg
          className="handwritten-canvas-svg"
          viewBox="0 0 1140 340"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Multicolor Gradient: Rama Green -> Peacock Blue -> Bright Violet Purple */}
            <linearGradient id="ramaPeacockVioletGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C896" />
              <stop offset="22%" stopColor="#00B894" />
              <stop offset="42%" stopColor="#0088CC" />
              <stop offset="68%" stopColor="#0284C7" />
              <stop offset="88%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>

            {/* Radiant Model Shining Palette Linear Gradient for Gloss Sweep */}
            <linearGradient id="modelGlossGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C896" stopOpacity="0" />
              <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </linearGradient>

            {/* Underline Flourish Gradient */}
            <linearGradient id="flourishMultiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C896" />
              <stop offset="35%" stopColor="#0088CC" />
              <stop offset="70%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            {/* Soft Feathered Edge for Organic Ink Writing Reveal */}
            <filter id="inkStrokeFeather" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>

            {/* Ink Drop Glowing Bloom */}
            <filter id="inkGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Handwriting Motion Reveal Mask - Full vertical span from y=-40 to height=380 with feathered brush edge */}
            <mask id="exactHandwritingMask">
              <rect
                x="0"
                y="-40"
                width="0"
                height="380"
                fill="#FFFFFF"
                filter="url(#inkStrokeFeather)"
              >
                <animate
                  attributeName="width"
                  from="0"
                  to="1140"
                  dur="2.0s"
                  begin="0.2s"
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.25 0.1 0.25 1"
                />
              </rect>
            </mask>
          </defs>

          {/* Group 1: Main Handwritten Text revealed by exact handwriting motion */}
          <g mask="url(#exactHandwritingMask)">
            {/* Base Multicolor Gradient Calligraphy Text */}
            <text
              x="570"
              y="165"
              textAnchor="middle"
              className="hw-calligraphy-text"
            >
              CommandFlow AI
            </text>

            {/* Secondary Stroke Definition for crisp penmanship sharpness */}
            <text
              x="570"
              y="165"
              textAnchor="middle"
              className="hw-calligraphy-text hw-stroke-contour"
            >
              CommandFlow AI
            </text>

            {/* Model Shining Sheen: Sweeping high-gloss light beam across the text */}
            <text
              x="570"
              y="165"
              textAnchor="middle"
              className="hw-calligraphy-text hw-gloss-sweep"
            >
              CommandFlow AI
            </text>
          </g>

          {/* Group 2: Liquid Ink Droplet Point (NO pen image - just the luminous tip of liquid ink) */}
          <g className="hw-ink-point-group">
            <circle
              cx="0"
              cy="0"
              r="14"
              className="ink-glow-outer"
              filter="url(#inkGlowFilter)"
            />
            <circle
              cx="0"
              cy="0"
              r="6.5"
              className="ink-core-droplet"
            />
            <circle
              cx="-1.5"
              cy="-1.5"
              r="2"
              fill="#FFFFFF"
              opacity="0.9"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default HandwrittenIntro;
