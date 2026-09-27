import React, { useState, useEffect } from 'react';
import { fetchContacts, createContact, deleteContact } from '../services/automationService';
import HandwrittenHeading from '../components/HandwrittenHeading';
import { Users, UserPlus, Trash2, Mail, Phone, MessageSquare, Send, Tag } from 'lucide-react';
import '../styles/contacts.css';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
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
        loadContacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete contact?')) {
      await deleteContact(id);
      loadContacts();
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <HandwrittenHeading text="Saved Contacts" size="normal" withFlourish={true} />
          <p className="page-subtitle">Manage recipients for natural language AI recipient resolution.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} />
          <span>Add Contact</span>
        </button>
      </div>

      <div className="contacts-grid">
        {contacts.map((contact) => (
          <div key={contact._id} className="glass-card contact-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="contact-avatar">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{contact.name}</h4>
                  <span className="status-badge status-processing" style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                    {contact.relationship}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(contact._id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Delete Contact"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {contact.email && (
                <div className="contact-info-row">
                  <Mail size={14} color="#f87171" />
                  <span>{contact.email}</span>
                </div>
              )}

              {contact.phone && (
                <div className="contact-info-row">
                  <Phone size={14} color="#34d399" />
                  <span>{contact.phone}</span>
                </div>
              )}

              {contact.telegramId && (
                <div className="contact-info-row">
                  <Send size={14} color="#38bdf8" />
                  <span>{contact.telegramId}</span>
                </div>
              )}

              <div className="contact-info-row">
                <Tag size={14} color="var(--text-muted)" />
                <span>Pref. Channel: <strong style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{contact.preferredChannel}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {contacts.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No saved contacts yet. Add your Class Advisor, HOD, HR, or Friends to test AI contact resolution!
        </div>
      )}

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '1rem' }}>
              Add New Contact
            </h3>

            <form onSubmit={handleAddContact}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Class Advisor / Dr. Ramesh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Relationship / Role</label>
                <select className="form-select" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  <option value="Class Advisor">Class Advisor</option>
                  <option value="HOD">HOD</option>
                  <option value="College Office">College Office</option>
                  <option value="Faculty">Faculty</option>
                  <option value="HR / Recruiter">HR / Recruiter</option>
                  <option value="Project Team">Project Team</option>
                  <option value="Friend">Friend</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="advisor@example.com"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Telegram Username / ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="@advisor_telegram"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Channel</label>
                  <select className="form-select" value={preferredChannel} onChange={(e) => setPreferredChannel(e.target.value)}>
                    <option value="gmail">Gmail</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
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
