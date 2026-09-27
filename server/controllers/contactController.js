const Contact = require('../models/Contact');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, telegramId, relationship, category, preferredChannel } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, 'Contact name is required.', 400, 'MISSING_NAME');
    }

    const contact = await Contact.create({
      userId: req.user._id,
      name: name.trim(),
      email: (email || '').trim().toLowerCase(),
      phone: (phone || '').trim(),
      telegramId: (telegramId || '').trim(),
      relationship: relationship || 'General',
      category: category || 'Personal',
      preferredChannel: preferredChannel || 'gmail'
    });

    return sendSuccess(res, 'Contact added successfully.', contact, 201);
  } catch (err) {
    next(err);
  }
};

const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ userId: req.user._id }).sort({ name: 1 });
    return sendSuccess(res, 'Contacts retrieved.', contacts, 200, { count: contacts.length });
  } catch (err) {
    next(err);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!contact) {
      return sendError(res, 'Contact not found.', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, 'Contact updated successfully.', contact);
  } catch (err) {
    next(err);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const result = await Contact.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (result.deletedCount === 0) {
      return sendError(res, 'Contact not found or unauthorized.', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, 'Contact deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createContact,
  getContacts,
  updateContact,
  deleteContact
};
