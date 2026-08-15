import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Zap, Shield, Cpu, Layers, ArrowRight, Play, CheckCircle, Database, Mail, Send } from 'lucide-react';
import '../styles/global.css';

const Landing = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', perspective: 'none', overflowX: 'hidden' }}>
      {/* Sleek Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem'
      }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary)', color: '#FFFFFF', padding: '0.45rem', borderRadius: 'var(--radius-md)', display: 'flex' }}>
              <Bot size={24} />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-primary)' }}>
              CommandFlow <span style={{ color: 'var(--primary-dark)', fontSize: '0.85em' }}>AI</span>
            </span>
          </div>

          <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <a href="#platform" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Platform</a>
            <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Pricing</a>
            <a href="#resources" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Resources</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/login" className="btn btn-secondary">Sign In</Link>
            <Link to="/dashboard" className="btn btn-primary" style={{ boxShadow: '0 4px 14px var(--primary-glow)' }}>
              <span>Get Started</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '5rem 2rem 4rem', maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '3rem', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.825rem', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
            <Sparkles size={16} color="var(--primary)" />
            NEXT-GEN ENTERPRISE AUTOMATION ENGINE
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.15, color: 'var(--text-primary)', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Automate Your Command, Elevate Your Flow with <span style={{ color: 'var(--primary-dark)' }}>AI-Powered Intelligence</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '580px' }}>
            Transform natural language instructions into seamless n8n automation pipelines. Speak or type in English, Tamil, or Tanglish — CommandFlow AI handles execution with zero manual setup.
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 700 }}>
              <span>Explore Platform</span>
              <ArrowRight size={18} />
            </Link>

            <button className="btn btn-secondary" style={{ padding: '0.9rem 1.75rem', fontSize: '1rem' }}>
              <Play size={18} color="var(--primary)" />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Floating 3D Anti-Gravity Flow Graphic */}
        <div style={{ perspective: 'none', position: 'relative' }}>
          <div className="glass-card" style={{
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            transform: 'none',
            rotate: '0deg',
            skew: '0deg',
            boxShadow: '0 30px 60px -12px rgba(0, 200, 150, 0.25), 0 18px 36px -18px rgba(15, 23, 42, 0.12)',
            border: '1px solid var(--border-glow)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
                ⚡ LIVE PIPELINE DISPATCH
              </span>
              <span className="status-badge status-success">Engine Online</span>
            </div>

            {/* Floating Node Diagram Flow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
                  <Zap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>INPUT TRIGGER</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>"Send a leave letter to class advisor"</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>
                ↓ (Groq Llama 3.3 70B AI Engine)
              </div>

              <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: '#FFFFFF' }}>
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 700 }}>AI PARSER & CONTENT GENERATOR</div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>Subject: "Leave Request" | Content: Professional Letter</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>
                ↓ (n8n Webhook Router)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={16} color="#DC2626" />
                  <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>Gmail Action</span>
                </div>
                <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={16} color="#059669" />
                  <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>Telegram Bot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Feature Cards Grid */}
      <section id="features" style={{ padding: '4rem 2rem 6rem', maxWidth: '1300px', margin: '0 auto', perspective: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Designed for Instant Execution & Intelligence
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem' }}>
            High-performance orchestration engine powered by Groq Llama 3.3 and n8n webhooks.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {/* Card 1 */}
          <div className="glass-card floating-1" style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.95)' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Cpu size={26} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Process Automation
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Convert free-form speech or text commands into automated multi-step workflows. Automatically generate emails, letters, and telegram alerts.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card floating-2" style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.95)' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Zap size={26} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Real-Time Insights
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Live execution status tracking and trace logging. MongoDB updates status to SUCCESS only after n8n confirms execution.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card floating-3" style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.95)' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Layers size={26} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Intelligent Routing
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Smart Switch nodes route emails to Gmail API and fast messages to Telegram Bot API with instant background execution.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '2rem', background: '#FFFFFF', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        © 2026 CommandFlow AI — Powered by Groq AI & n8n Orchestration.
      </footer>
    </div>
  );
};

export default Landing;
