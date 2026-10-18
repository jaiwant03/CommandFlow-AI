import React, { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import '../styles/handwrittenIntro.css';

/**
 * HandwrittenIntro Component (Cinematic 3D Brand Intro)
 * 
 * Minimal Content, Maximum Visual Impact:
 * 1. The CommandFlow AI app logo (rendered as a physical 3D metallic token
 *    rotating smoothly around the Y-axis with realistic depth and lighting)
 * 2. The text "CommandFlow AI" directly below the logo with 3D extrusion,
 *    layered shadows, peacock-blue & Rama-green gradient, and specular shimmer.
 * 
 * Fully responsive across desktop, tablet, and mobile.
 */
const HandwrittenIntro = ({ onComplete, duration = 4300 }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Graceful fade-out before completion
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, Math.max(duration - 480, 1200));

    // Complete intro transition
    const finishTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    // Keyboard navigation (Escape, Space, Enter) for instant access
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        clearTimeout(fadeTimer);
        clearTimeout(finishTimer);
        setIsFading(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 220);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, onComplete]);

  // Tap or click anywhere to seamlessly enter the app immediately
  const handleStageClick = () => {
    setIsFading(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 220);
  };

  return (
    <div
      className={`cf-cinema-intro-stage ${isFading ? 'fading-out' : ''}`}
      onClick={handleStageClick}
      role="button"
      tabIndex={0}
      aria-label="CommandFlow AI 3D Intro"
    >
      {/* Deep-black cinematic background with peacock-blue & Rama-green glows */}
      <div className="cf-cinema-backdrop" aria-hidden="true" />
      <div className="cf-radial-glow cf-glow-primary" aria-hidden="true" />
      <div className="cf-radial-glow cf-glow-secondary" aria-hidden="true" />

      {/* Restrained ambient floating light particles */}
      <div className="cf-ambient-particles" aria-hidden="true">
        <span className="cf-particle p-1" />
        <span className="cf-particle p-2" />
        <span className="cf-particle p-3" />
        <span className="cf-particle p-4" />
        <span className="cf-particle p-5" />
        <span className="cf-particle p-6" />
      </div>

      {/* 3D Perspective Scene Viewport */}
      <div className="cf-scene-viewport">
        {/* Floating Master Composition */}
        <div className="cf-floating-master">
          {/* 3D Rotating Logo Stage */}
          <div className="cf-logo-stage">
            <div className="cf-3d-token-wrap">
              {/* Physical 3D Token with preserve-3d */}
              <div className="cf-3d-token">
                {/* Physical edge thickness slices in Z-space */}
                <div className="token-layer token-slice slice-5" />
                <div className="token-layer token-slice slice-4" />
                <div className="token-layer token-slice slice-3" />
                <div className="token-layer token-slice slice-2" />
                <div className="token-layer token-slice slice-1" />

                {/* Back Face */}
                <div className="token-layer token-face-back">
                  <div className="token-back-metallic" />
                  <div className="token-back-icon">
                    <Bot size={54} strokeWidth={2.2} />
                  </div>
                </div>

                {/* Front Face */}
                <div className="token-layer token-face-front">
                  <div className="token-front-metallic" />
                  <div className="token-front-rim" />
                  <div className="token-gloss-shine" />
                  <div className="token-light-sweep" />
                  <div className="token-bot-icon">
                    <Bot size={62} strokeWidth={2.3} />
                  </div>
                </div>
              </div>

              {/* 3D Atmospheric Ground Shadow */}
              <div className="cf-3d-shadow" />
            </div>
          </div>

          {/* 3D CommandFlow AI Text */}
          <div className="cf-text-stage">
            <h1 className="cf-brand-title">
              <span className="cf-text-commandflow">CommandFlow</span>
              <span className="cf-text-space">&nbsp;</span>
              <span className="cf-text-ai">AI</span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandwrittenIntro;
