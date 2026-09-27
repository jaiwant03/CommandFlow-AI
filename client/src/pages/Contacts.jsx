import React, { useState, useEffect } from 'react';
import { fetchContacts, createContact, deleteContact } from '../services/automationService';
import HandwrittenHeading from '../components/HandwrittenHeading';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  Phone, 
  Send, 
  Tag, 
  Search, 
  X, 
  Sparkles, 
  Check, 
  CheckCircle2,
  Copy
} from 'lucide-react';
import '../styles/contacts.css';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [relationship, setRelationship] = useState('Class Advisor');
  const [category, setCategory] = useState('Academic');
  const [preferredChannel, setPreferredChannel] = useState('gmail');
  const [loading, setLoading] = useState(false);

  const loadContacts = async () => {
    try {
      const res = await fetchContacts();
      if (res.success) setContacts(res.data || []);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Keyboard shortcut to close modal with ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showAddModal) {
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createContact({
        name,
        email,
        phone,
        telegramId,
        relationship,
        category,
        preferredChannel
      });
      if (res.success) {
        setShowAddModal(false);
        setName('');
        setEmail('');
        setPhone('');
        setTelegramId('');
        loadContacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, contactName) => {
    if (window.confirm(`Delete contact "${contactName || 'this contact'}"?`)) {
      await deleteContact(id);
      loadContacts();
    }
  };

  const handleCopyEmail = (emailText, id) => {
    if (!emailText) return;
    navigator.clipboard.writeText(emailText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter contacts based on search & category chip
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.relationship || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm) ||
      (c.telegramId || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'academic') {
      const rel = (c.relationship || '').toLowerCase();
      return rel.includes('advisor') || rel.includes('hod') || rel.includes('faculty') || rel.includes('office');
    }
    if (activeFilter === 'work') {
      const rel = (c.relationship || '').toLowerCase();
      return rel.includes('hr') || rel.includes('recruiter') || rel.includes('team');
    }
    if (activeFilter === 'personal') {
      const rel = (c.relationship || '').toLowerCase();
      return rel.includes('friend') || rel.includes('family');
    }
    if (activeFilter === 'gmail') {
      return (c.preferredChannel || '').toLowerCase() === 'gmail';
    }
    if (activeFilter === 'telegram') {
      return (c.preferredChannel || '').toLowerCase() === 'telegram';
    }

    return true;
  });

  return (
    <div className="contacts-container">
      {/* Page Header */}
      <div className="contacts-header-bar">
        <div className="contacts-title-area">
          <HandwrittenHeading text="Saved Contacts" size="normal" withFlourish={true} />
          <p className="contacts-subtitle">Manage recipients for natural language AI recipient resolution.</p>
        </div>

        <div className="contacts-header-actions">
          <div className="contacts-count-badge">
            <span className="status-dot"></span>
            <span>{contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'}</span>
          </div>

          <button className="btn-add-contact" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="contacts-tip-banner">
        <div className="contacts-tip-icon">
          <Sparkles size={16} />
        </div>
        <div>
          <strong>AI Auto-Resolution Active:</strong> Simply say <em>"Send email to [Name]"</em> in Command Center, and CommandFlow AI automatically matches their saved email address.
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="contacts-toolbar">
        <div className="contacts-search-wrapper">
          <Search size={16} className="contacts-search-icon" />
          <input
            type="text"
            className="contacts-search-input"
            placeholder="Search by name, role, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="contacts-filter-chips">
          <button 
            className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Contacts ({contacts.length})
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveFilter('academic')}
          >
            Academic
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'work' ? 'active' : ''}`}
            onClick={() => setActiveFilter('work')}
          >
            Work & Team
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveFilter('personal')}
          >
            Friends
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'gmail' ? 'active' : ''}`}
            onClick={() => setActiveFilter('gmail')}
          >
            Gmail
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'telegram' ? 'active' : ''}`}
            onClick={() => setActiveFilter('telegram')}
          >
            Telegram
          </button>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="contacts-grid">
        {filteredContacts.map((contact) => (
          <div key={contact._id} className="contact-card">
            <div>
              {/* Card Top: Avatar, Name, Relationship, Delete */}
              <div className="contact-card-top">
                <div className="contact-profile-group">
                  <div className="contact-avatar">
                    {(contact.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="contact-name-title">
                    <h4 className="contact-name">{contact.name}</h4>
                    <span className="contact-role-badge">
                      {contact.relationship || 'Contact'}
                    </span>
                  </div>
                </div>

                <button
                  className="btn-contact-delete"
                  onClick={() => handleDelete(contact._id, contact.name)}
                  title="Delete Contact"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Card Details */}
              <div className="contact-details-list">
                {contact.email && (
                  <div className="contact-info-row">
                    <div className="contact-info-icon">
                      <Mail size={14} color="#ef4444" />
                    </div>
                    <span style={{ flex: 1 }}>{contact.email}</span>
                    <button
                      onClick={() => handleCopyEmail(contact.email, contact._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 4px' }}
                      title="Copy email"
                    >
                      {copiedId === contact._id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    </button>
                  </div>
                )}

                {contact.phone && (
                  <div className="contact-info-row">
                    <div className="contact-info-icon">
                      <Phone size={14} color="#10b981" />
                    </div>
                    <span>{contact.phone}</span>
                  </div>
                )}

                {contact.telegramId && (
                  <div className="contact-info-row">
                    <div className="contact-info-icon">
                      <Send size={14} color="#0ea5e9" />
                    </div>
                    <span>{contact.telegramId}</span>
                  </div>
                )}

                <div className="contact-info-row">
                  <div className="contact-info-icon">
                    <Tag size={14} color="#64748b" />
                  </div>
                  <span>Pref. Channel:</span>
                  <span className={`contact-channel-pill ${(contact.preferredChannel || 'gmail').toLowerCase()}`}>
                    {contact.preferredChannel || 'Gmail'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer: AI Recognition Preview */}
            <div className="contact-card-footer">
              <span className="contact-ai-hint">
                <CheckCircle2 size={12} />
                Matches: "{contact.name}"
              </span>
              <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                {contact.category || 'General'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="contacts-empty-state">
          <div className="contacts-empty-icon">
            <Users size={32} />
          </div>
          <h3 className="contacts-empty-title">
            {searchTerm || activeFilter !== 'all' ? 'No Matching Contacts Found' : 'No Saved Contacts Yet'}
          </h3>
          <p className="contacts-empty-desc">
            {searchTerm || activeFilter !== 'all'
              ? 'Try adjusting your search query or switching filters to view your contacts.'
              : 'Add your Class Advisor, HOD, HR, or Friends to enable one-click AI recipient resolution in natural language commands.'}
          </p>
          <button className="btn-add-contact" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} />
            <span>Add Your First Contact</span>
          </button>
        </div>
      )}

      {/* Add Contact Modal Dialog */}
      {showAddModal && (
        <div className="contacts-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="contacts-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="contacts-modal-header">
              <div className="contacts-modal-title-wrap">
                <div className="contacts-modal-icon-badge">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="contacts-modal-title">Add New Contact</h3>
                  <p className="contacts-modal-subtitle">Save a recipient for natural language AI recognition</p>
                </div>
              </div>

              <button className="btn-modal-close" onClick={() => setShowAddModal(false)} title="Close">
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddContact}>
              <div className="contacts-modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jaswant / Dr. Ramesh / Class Advisor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="modal-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Relationship / Role</label>
                    <select
                      className="form-select"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                    >
                      <option value="Class Advisor">Class Advisor</option>
                      <option value="HOD">HOD</option>
                      <option value="Faculty">Faculty</option>
                      <option value="College Office">College Office</option>
                      <option value="HR / Recruiter">HR / Recruiter</option>
                      <option value="Project Team">Project Team</option>
                      <option value="Friend">Friend</option>
                      <option value="Mentor">Mentor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Academic">Academic</option>
                      <option value="Professional">Professional</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                </div>

                <div className="modal-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. jksam37@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Telegram Username / ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="@telegram_handle or chat_id"
                      value={telegramId}
                      onChange={(e) => setTelegramId(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred Channel</label>
                    <select
                      className="form-select"
                      value={preferredChannel}
                      onChange={(e) => setPreferredChannel(e.target.value)}
                    >
                      <option value="gmail">Gmail</option>
                      <option value="telegram">Telegram</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="contacts-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save-contact"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
