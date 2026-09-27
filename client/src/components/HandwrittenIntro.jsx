import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Bot,
  Cpu,
  Zap,
  Activity,
  Sparkles,
  Radio,
  Layers,
  ShieldCheck,
  ChevronRight,
  Terminal as TerminalIcon
} from 'lucide-react';
import '../styles/handwrittenIntro.css';

/**
 * HandwrittenIntro Component
 * Multi-color cursive handwriting motion with Next-Gen Robotics + Agentic System Animation.
 * Wording: "CommandFlow" (single word in continuous multicolor: Rama Green -> Peacock Blue -> Violet Purple)
 * Followed by "AI" (electric violet accent).
 */
const HandwrittenIntro = ({ onComplete, duration = 5000 }) => {
  const [isFading, setIsFading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [inkTip, setInkTip] = useState({
    x: -100,
    y: -100,
    visible: false,
    color: '#00E5AA',
    char: '',
    isStandby: false
  });
  const containerRef = useRef(null);
  const charRefs = useRef({});

  // Keyboard and timer controls
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 550);

    const finishTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        clearTimeout(fadeTimer);
        clearTimeout(finishTimer);
        setIsFading(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 280);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, onComplete]);

  // Cursive handwriting letter configuration:
  // Word 1: CommandFlow (ONE SINGLE WORD - Continuous Multicolor Rama Green -> Peacock Blue -> Violet Purple)
  // Word 2: AI (Electric Violet)
  const letters = useMemo(() => [
    // Word 1: CommandFlow (11 letters in single word span)
    { id: 'cf-0', char: 'C', word: 1, delay: 0.22, dur: 0.24, color: '#00E5AA', fontClass: 'font-gv', colorClass: 'gv-color-0' },
    { id: 'cf-1', char: 'o', word: 1, delay: 0.42, dur: 0.16, color: '#00D29E', fontClass: 'font-gv', colorClass: 'gv-color-1' },
    { id: 'cf-2', char: 'm', word: 1, delay: 0.56, dur: 0.18, color: '#00C4A4', fontClass: 'font-gv', colorClass: 'gv-color-2' },
    { id: 'cf-3', char: 'm', word: 1, delay: 0.72, dur: 0.18, color: '#00BFA9', fontClass: 'font-gv', colorClass: 'gv-color-3' },
    { id: 'cf-4', char: 'a', word: 1, delay: 0.88, dur: 0.16, color: '#00B5B6', fontClass: 'font-gv', colorClass: 'gv-color-4' },
    { id: 'cf-5', char: 'n', word: 1, delay: 1.02, dur: 0.16, color: '#00AAC4', fontClass: 'font-gv', colorClass: 'gv-color-5' },
    // Letter 'd' styled with tall elegant ascender
    { id: 'cf-6', char: 'd', word: 1, delay: 1.16, dur: 0.20, color: '#009ED6', fontClass: 'font-pinyon-d', colorClass: 'gv-color-6' },
    // Seamless cursive connection into 'Flow' (capital F)
    { id: 'cf-7', char: 'F', word: 1, delay: 1.36, dur: 0.22, color: '#0090E2', fontClass: 'font-gv font-cf-capital-f', colorClass: 'gv-color-7' },
    { id: 'cf-8', char: 'l', word: 1, delay: 1.56, dur: 0.16, color: '#0284C7', fontClass: 'font-gv', colorClass: 'gv-color-8' },
    { id: 'cf-9', char: 'o', word: 1, delay: 1.70, dur: 0.16, color: '#2563EB', fontClass: 'font-gv', colorClass: 'gv-color-9' },
    { id: 'cf-10', char: 'w', word: 1, delay: 1.84, dur: 0.20, color: '#7C3AED', fontClass: 'font-gv', colorClass: 'gv-color-10' },

    // Word 2: AI (Electric Violet)
    { id: 'ai-0', char: 'A', word: 2, delay: 2.18, dur: 0.24, color: '#8B5CF6', fontClass: 'font-capital-a', colorClass: 'gv-color-ai-a' },
    { id: 'ai-1', char: 'I', word: 2, delay: 2.42, dur: 0.24, color: '#7C3AED', fontClass: 'font-capital-i', colorClass: 'gv-color-ai-i' },
  ], []);

  // Synchronize liquid ink tip & robotic stylus with the active writing motion
  useEffect(() => {
    let animId;
    const startTime = performance.now();

    const updateTipPosition = (now) => {
      const elapsed = (now - startTime) / 1000;
      setElapsedTime(elapsed);

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

        setInkTip({
          x,
          y,
          visible: true,
          color: activeChar.color,
          char: activeChar.char,
          isStandby: false
        });
      } else if (elapsed >= 2.76 && elapsed < 3.60) {
        // Flourish underline active
        const progress = Math.min((elapsed - 2.76) / 0.84, 1);
        const x = containerRect.width * (0.08 + progress * 0.84);
        const y = containerRect.height * 0.88;
        const tipColor = progress < 0.35 ? '#00D29E' : progress < 0.7 ? '#0284C7' : '#8B5CF6';
        setInkTip({
          x,
          y,
          visible: true,
          color: tipColor,
          char: 'flourish',
          isStandby: false
        });
      } else if (elapsed >= 3.60 && elapsed < 4.45) {
        // Post-writing: Robotic drone ascends smoothly to standby lock
        const x = containerRect.width * 0.94;
        const y = containerRect.height * 0.82;
        setInkTip({
          x,
          y,
          visible: true,
          color: '#8B5CF6',
          char: 'standby',
          isStandby: true
        });
      } else {
        setInkTip((prev) => ({ ...prev, visible: false }));
      }

      if (elapsed < 4.8) {
        animId = requestAnimationFrame(updateTipPosition);
      }
    };

    animId = requestAnimationFrame(updateTipPosition);
    return () => cancelAnimationFrame(animId);
  }, [letters]);

  // Terminal status feed synced to execution progress
  const terminalMessage = useMemo(() => {
    if (elapsedTime < 1.1) {
      return 'INIT_NEURAL_FABRIC // AGENTIC KERNEL v4.8 ONLINE';
    } else if (elapsedTime < 2.1) {
      return 'CALIBRATING SYNAPSE // CONTINUOUS VECTOR PATHWAY READY';
    } else if (elapsedTime < 3.3) {
      return 'DISPATCH_ORCHESTRATION // 4 AGENT NODES SYNCHRONIZING';
    } else {
      return 'COMMANDFLOW AI ACTIVE // AUTONOMOUS WORKSPACE LAUNCHING';
    }
  }, [elapsedTime]);

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 280);
  };

  return (
    <div className={`handwritten-white-stage ${isFading ? 'fading-out' : ''}`}>
      {/* ================= BACKGROUND STUDIO & CYBERNETIC MESH ================= */}
      <div className="model-shine-backdrop" />
      <div className="model-caustic-beam" />
      <div className="model-prism-glow" />

      {/* Cybernetic Grid Overlay */}
      <div className="cyber-circuit-grid" />
      <div className="cyber-scanning-laser-plane" />

      {/* Floating Micro Diamond Sparkles */}
      <div className="sparkle-flare sparkle-1" />
      <div className="sparkle-flare sparkle-2" />
      <div className="sparkle-flare sparkle-3" />
      <div className="sparkle-flare sparkle-4" />

      {/* ================= ROBOTIC HUD FRAME & TELEMETRY ================= */}
      <header className="robotic-hud-topbar">
        <div className="hud-brand-pill">
          <span className="hud-beacon-dot" />
          <Bot size={15} className="hud-icon-bot" />
          <span className="hud-core-tag">AGENTIC_ORCHESTRATOR // CORE v4.8</span>
          <div className="hud-frequency-equalizer">
            <span className="freq-bar bar-1" />
            <span className="freq-bar bar-2" />
            <span className="freq-bar bar-3" />
            <span className="freq-bar bar-4" />
            <span className="freq-bar bar-5" />
          </div>
        </div>

        <div className="hud-center-status">
          <span className="hud-status-chip">
            <Radio size={12} className="hud-chip-icon" />
            AUTONOMOUS AGENT MESH: ACTIVE
          </span>
        </div>

        <div className="hud-actions-right">
          <div className="hud-metric-badge">
            <Activity size={12} />
            <span>0.8ms LATENCY</span>
          </div>
          <button
            type="button"
            className="hud-skip-button"
            onClick={handleSkip}
            title="Skip intro and enter workspace immediately (Esc)"
          >
            <span>ENTER WORKSPACE</span>
            <ChevronRight size={13} />
            <kbd className="hud-kbd-tag">ESC</kbd>
          </button>
        </div>
      </header>

      {/* Viewport Robotic Corner Calibration Brackets */}
      <div className="cyber-corner-bracket bracket-tl" />
      <div className="cyber-corner-bracket bracket-tr" />
      <div className="cyber-corner-bracket bracket-bl" />
      <div className="cyber-corner-bracket bracket-br" />

      {/* ================= 4 AUTONOMOUS AGENT NODES (CONSTELLATION) ================= */}
      {/* Agent 01: Perception (Top-Left) */}
      <div className="agent-pod agent-pod-topleft">
        <div className="agent-pod-header">
          <div className="agent-avatar avatar-green">
            <Zap size={14} />
          </div>
          <div className="agent-info">
            <span className="agent-callsign">AG-01: PERCEPTION</span>
            <span className="agent-role">Voice & Multimodal Ingest</span>
          </div>
        </div>
        <div className="agent-pod-telemetry">
          <span className="agent-telemetry-pill pill-green">
            <span className="agent-mini-pulse" />
            STREAMING 99.4%
          </span>
        </div>
      </div>

      {/* Agent 02: Reasoning (Top-Right) */}
      <div className="agent-pod agent-pod-topright">
        <div className="agent-pod-header">
          <div className="agent-avatar avatar-blue">
            <Cpu size={14} />
          </div>
          <div className="agent-info">
            <span className="agent-callsign">AG-02: REASONING</span>
            <span className="agent-role">Autonomous LLM Matrix</span>
          </div>
        </div>
        <div className="agent-pod-telemetry">
          <span className="agent-telemetry-pill pill-blue">
            <span className="agent-mini-pulse" />
            INFERENCE ACTIVE
          </span>
        </div>
      </div>

      {/* Agent 03: Dispatcher (Bottom-Left) */}
      <div className="agent-pod agent-pod-bottomleft">
        <div className="agent-pod-header">
          <div className="agent-avatar avatar-cobalt">
            <Layers size={14} />
          </div>
          <div className="agent-info">
            <span className="agent-callsign">AG-03: EXECUTION</span>
            <span className="agent-role">Multi-Channel Routing</span>
          </div>
        </div>
        <div className="agent-pod-telemetry">
          <span className="agent-telemetry-pill pill-cobalt">
            <span className="agent-mini-pulse" />
            CHANNELS LINKED
          </span>
        </div>
      </div>

      {/* Agent 04: Memory & Feedback (Bottom-Right) */}
      <div className="agent-pod agent-pod-bottomright">
        <div className="agent-pod-header">
          <div className="agent-avatar avatar-purple">
            <ShieldCheck size={14} />
          </div>
          <div className="agent-info">
            <span className="agent-callsign">AG-04: FEEDBACK</span>
            <span className="agent-role">Self-Correction Engine</span>
          </div>
        </div>
        <div className="agent-pod-telemetry">
          <span className="agent-telemetry-pill pill-purple">
            <span className="agent-mini-pulse" />
            STATE PERSISTED
          </span>
        </div>
      </div>

      {/* Agentic Vector Synaptic Lines (Connecting Agent Pods to Center) */}
      <svg className="agent-synaptic-grid-svg" viewBox="0 0 1000 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="synapseGradTL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5AA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00D29E" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="synapseGradTR" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0090E2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="synapseGradBL" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00D29E" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="synapseGradBR" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Top-Left to Center */}
        <path d="M 120,90 L 260,90 L 360,240" fill="none" stroke="url(#synapseGradTL)" strokeWidth="1.2" strokeDasharray="6 4" className="synapse-path" />
        {/* Top-Right to Center */}
        <path d="M 880,90 L 740,90 L 640,240" fill="none" stroke="url(#synapseGradTR)" strokeWidth="1.2" strokeDasharray="6 4" className="synapse-path" />
        {/* Bottom-Left to Center */}
        <path d="M 120,510 L 260,510 L 360,360" fill="none" stroke="url(#synapseGradBL)" strokeWidth="1.2" strokeDasharray="6 4" className="synapse-path" />
        {/* Bottom-Right to Center */}
        <path d="M 880,510 L 740,510 L 640,360" fill="none" stroke="url(#synapseGradBR)" strokeWidth="1.2" strokeDasharray="6 4" className="synapse-path" />
      </svg>

      {/* ================= CENTER STAGE: LOGO & ROBOTIC STYLUS ================= */}
      <div className="handwritten-center-box" ref={containerRef}>
        <div className="great-vibes-stage">
          {/* Word 1: CommandFlow (ONE SINGLE WORD - Continuous Multicolor Rama Green -> Peacock Blue -> Violet Purple) */}
          <span className="gv-word gv-word-commandflow">
            {letters
              .filter((l) => l.word === 1)
              .map((l) => (
                <span
                  key={l.id}
                  ref={(el) => (charRefs.current[l.id] = el)}
                  className={`gv-char ${l.fontClass} ${l.colorClass}`}
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

          {/* Word 2: AI (Electric Violet Accent) */}
          <span className="gv-word gv-word-ai">
            {letters
              .filter((l) => l.word === 2)
              .map((l) => (
                <span
                  key={l.id}
                  ref={(el) => (charRefs.current[l.id] = el)}
                  className={`gv-char ${l.fontClass} ${l.colorClass}`}
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

        {/* Calligraphic Signature Flourish Underline with Multicolor Gradient */}
        <svg
          className="gv-flourish-svg"
          viewBox="0 0 1000 60"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="flourishMultiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00E5AA" />
              <stop offset="28%" stopColor="#00D29E" />
              <stop offset="55%" stopColor="#0090E2" />
              <stop offset="80%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <path
            d="M 50,26 C 230,46 470,44 680,28 C 820,16 910,14 945,22 C 970,28 980,36 960,42 C 935,48 905,38 930,26 C 948,16 978,22 995,26"
            fill="none"
            stroke="url(#flourishMultiGrad)"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="gv-flourish-stroke"
          />
        </svg>

        {/* ================= HIGH-TECH ROBOTIC STYLUS & DRONE HEAD ================= */}
        {inkTip.visible && (
          <div
            className={`robotic-stylus-assembly ${inkTip.isStandby ? 'stylus-standby' : ''}`}
            style={{
              transform: `translate(${inkTip.x}px, ${inkTip.y}px)`,
              '--stylus-color': inkTip.color,
            }}
          >
            {/* Holographic Laser Targeting Reticle */}
            <div className="robotic-reticle-gyro">
              <span className="reticle-bracket r-tl" />
              <span className="reticle-bracket r-tr" />
              <span className="reticle-bracket r-bl" />
              <span className="reticle-bracket r-br" />
              <span className="reticle-crosshair-h" />
              <span className="reticle-crosshair-v" />
              <div className="reticle-radar-spin" />
            </div>

            {/* Precision Laser Projection Beam */}
            <div className="robotic-laser-emitter-beam" style={{ backgroundColor: inkTip.color }} />

            {/* Plasma Spark Contact Burst */}
            <div className="robotic-plasma-focal-core" style={{ backgroundColor: inkTip.color }}>
              <div className="plasma-halo" style={{ backgroundColor: inkTip.color }} />
              <div className="plasma-core-white" />
              <span className="plasma-micro-spark spark-a" />
              <span className="plasma-micro-spark spark-b" />
              <span className="plasma-micro-spark spark-c" />
            </div>

            {/* High-Tech Cybernetic Stylus Arm Body */}
            <div className="robotic-stylus-chassis">
              <div className="stylus-carbon-barrel">
                <span className="stylus-neon-strip" style={{ backgroundColor: inkTip.color }} />
                <span className="stylus-joint-ring" />
              </div>
              <div className="stylus-nozzle-tip" />
            </div>

            {/* Micro Live Telemetry HUD Tag */}
            <div className="stylus-telemetry-tag">
              <span className="stylus-telemetry-text">
                {inkTip.isStandby ? (
                  <>SYS_LOCKED ◈ STANDBY</>
                ) : (
                  <>
                    <span className="telemetry-live-dot" />
                    TARGET: [{Math.round(inkTip.x)}, {Math.round(inkTip.y)}] // BEAM 99.8%
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTTOM AGENTIC COMMAND EXECUTION TICKER ================= */}
      <footer className="agentic-terminal-footer">
        <div className="terminal-ticker-box">
          <TerminalIcon size={14} className="terminal-icon" />
          <span className="terminal-prefix">FLOW_AGENT://</span>
          <span className="terminal-stream-msg">{terminalMessage}</span>
          <span className="terminal-cursor-blink" />
        </div>
      </footer>
    </div>
  );
};

export default HandwrittenIntro;
