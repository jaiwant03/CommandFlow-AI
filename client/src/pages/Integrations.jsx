import React, { useState } from 'react';
import { Mail, Send, Cpu, Layers, Database, Globe, Search, ShieldCheck, CheckCircle } from 'lucide-react';
import '../styles/global.css';
import '../styles/integrations.css';

const integrationServices = [
  {
    id: 'gmail',
    name: 'Gmail API',
    category: 'Communication',
    icon: Mail,
    color: '#DC2626',
    status: 'ACTIVE',
    desc: 'Automated email dispatch node via n8n production webhook engine.'
  },
  {
    id: 'telegram',
    name: 'Telegram Bot API',
    category: 'Messaging',
    icon: Send,
    color: '#059669',
    status: 'ACTIVE',
    desc: 'Instant text messaging dispatch to Telegram chat channels.'
  },
  {
    id: 'groq',
    name: 'Groq AI Engine',
    category: 'AI Model',
    icon: Cpu,
    color: '#00C896',
    status: 'ACTIVE',
    desc: 'Llama 3.3 70B model parsing commands & generating professional message bodies.'
  },
  {
    id: 'n8n',
    name: 'n8n Pipeline Engine',
    category: 'Orchestration',
    icon: Layers,
    color: '#0B5D34',
    status: 'ACTIVE',
    desc: 'Switch node routing automations to Gmail and Telegram actions.'
  },
  {
    id: 'webhooks',
    name: 'HTTP Webhooks',
    category: 'Developer API',
    icon: Globe,
    color: '#0284C7',
    status: 'ACTIVE',
    desc: 'Secured webhook endpoints with x-n8n-webhook-secret authentication.'
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL / MongoDB',
    category: 'Database',
    icon: Database,
    color: '#059669',
    status: 'ACTIVE',
    desc: 'Stores automation logs, schedules, and execution histories.'
  }
];

const Integrations = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = integrationServices.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container" style={{ perspective: 'none' }}>
      <div className="glass-card floating-1 integration-header-panel">
        <div className="integration-header-row">
          <div>
            <div className="integration-eyebrow">
              🌐 ECOSYSTEM & PLUGINS
            </div>
            <h1 className="page-title integration-page-title">Connected Services & Ecosystem</h1>
            <p className="page-subtitle integration-page-subtitle">
              Multi-channel communication nodes and AI execution infrastructure.
            </p>
          </div>

          <div className="integration-search-wrap">
            <div className="integration-search-field">
              <Search size={18} className="integration-search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search 100+ integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="integrations-grid integrations-grid-professional">
        {filteredServices.map((service, idx) => {
          const Icon = service.icon;
          const floatClass = idx % 3 === 0 ? 'floating-1' : idx % 3 === 1 ? 'floating-2' : 'floating-3';

          return (
            <div
              key={service.id}
              className={`glass-card integration-card ${floatClass}`}
            >
              <div>
                <div className="integration-card-head">
                  <div className="integration-service-meta">
                    <div className="integration-icon" style={{ background: `${service.color}1A`, color: service.color }}>
                      <Icon size={28} />
                    </div>
                    <div>
                      <h3 className="integration-title">{service.name}</h3>
                      <span className="integration-category">{service.category}</span>
                    </div>
                  </div>

                  <span className="status-badge status-success">
                    <CheckCircle size={12} /> {service.status}
                  </span>
                </div>

                <p className="integration-desc">{service.desc}</p>
              </div>

              <div className="integration-card-footer">
                <span className="integration-status-line">
                  <ShieldCheck size={14} /> Production Linked
                </span>

                <button className="btn btn-secondary integration-config-btn">
                  <span>Configure</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Integrations;
