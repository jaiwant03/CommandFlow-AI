const Contact = require('../models/Contact');

/**
 * Contact Service for recipient resolution from MongoDB Contact Book
 */
class ContactService {
  /**
   * Search for a contact by name, email, or relationship for a specific user
   */
  async findContact(userId, query) {
    if (!query || typeof query !== 'string' || !query.trim()) return null;
    const cleanQuery = query.trim();
    const userFilter = userId ? { userId } : {};

    // 1. Exact Name match (case-insensitive)
    let contact = await Contact.findOne({
      ...userFilter,
      name: { $regex: new RegExp(`^${this.escapeRegex(cleanQuery)}$`, 'i') }
    });
    if (contact) return contact;

    // 2. Email match
    contact = await Contact.findOne({
      ...userFilter,
      email: cleanQuery.toLowerCase()
    });
    if (contact) return contact;

    // 3. Name starts with or contains query (e.g., "Arun" -> "Arun Kumar")
    contact = await Contact.findOne({
      ...userFilter,
      name: { $regex: new RegExp(`\\b${this.escapeRegex(cleanQuery)}`, 'i') }
    });
    if (contact) return contact;

    // 4. Check if any word in query matches contact name (e.g., query "Jaswant Karun" matches contact "Jaswant")
    const queryTokens = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    for (const token of queryTokens) {
      contact = await Contact.findOne({
        ...userFilter,
        name: { $regex: new RegExp(`^${this.escapeRegex(token)}$`, 'i') }
      });
      if (contact) return contact;
    }

    // 5. Check if any contact's name is contained in the query
    try {
      const allUserContacts = await Contact.find(userFilter);
      for (const c of allUserContacts) {
        if (!c.name) continue;
        const cLower = c.name.toLowerCase().trim();
        const qLower = cleanQuery.toLowerCase().trim();
        if (qLower.includes(cLower) || cLower.includes(qLower)) {
          return c;
        }
      }
    } catch (e) {
      // ignore
    }

    // 6. Role / Relationship match (e.g., "advisor", "class advisor", "mentor", "hod", "friend")
    contact = await Contact.findOne({
      ...userFilter,
      $or: [
        { relationship: { $regex: new RegExp(this.escapeRegex(cleanQuery), 'i') } },
        { category: { $regex: new RegExp(this.escapeRegex(cleanQuery), 'i') } }
      ]
    });
    if (contact) return contact;

    // If userId was provided and nothing found, try global fallback across contacts
    if (userId) {
      return this.findContact(null, query);
    }

    return null;
  }

  /**
   * Resolve recipient name/hint or command text to a verified contact
   */
  async resolveRecipient(userId, { nameHint, commandText, channel = 'gmail' }) {
    // 1. Try resolving using nameHint if provided
    if (nameHint && typeof nameHint === 'string' && nameHint.toLowerCase() !== 'recipient') {
      let matched = await this.findContact(userId, nameHint);
      if (matched) {
        return this.formatContactResult(matched, channel);
      }
    }

    // 2. Scan user contacts against the command text to see if any contact name is mentioned
    try {
      let allUserContacts = userId ? await Contact.find({ userId }) : [];
      if (allUserContacts.length === 0) {
        allUserContacts = await Contact.find({});
      }

      for (const contact of allUserContacts) {
        if (!contact.name) continue;
        const nameRegex = new RegExp(`\\b${this.escapeRegex(contact.name)}\\b`, 'i');
        if (nameRegex.test(commandText)) {
          return this.formatContactResult(contact, channel);
        }

        // Also check first name if multi-word (e.g. "Arun" in "Arun Kumar")
        const firstName = contact.name.split(' ')[0];
        if (firstName && firstName.length > 2) {
          const firstNameRegex = new RegExp(`\\b${this.escapeRegex(firstName)}\\b`, 'i');
          if (firstNameRegex.test(commandText)) {
            return this.formatContactResult(contact, channel);
          }
        }

        // Check relationship (e.g. "advisor")
        if (contact.relationship && contact.relationship.length > 2) {
          const relRegex = new RegExp(`\\b${this.escapeRegex(contact.relationship)}\\b`, 'i');
          if (relRegex.test(commandText)) {
            return this.formatContactResult(contact, channel);
          }
        }
      }
    } catch (err) {
      console.warn('[ContactService] Error scanning user contacts:', err.message);
    }

    return null;
  }

  formatContactResult(contact, channel) {
    return {
      contactId: contact._id,
      name: contact.name,
      email: contact.email || '',
      telegramId: contact.telegramId || '',
      phone: contact.phone || '',
      preferredChannel: contact.preferredChannel || channel,
      relationship: contact.relationship,
      source: 'contacts_database'
    };
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = new ContactService();
