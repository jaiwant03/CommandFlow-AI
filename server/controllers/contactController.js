const Contact = require('../models/Contact');

const createContact = async (req, res) => {
  try {
    const { name, email, phone, telegramId, relationship, category, preferredChannel } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Contact name is required.' });
    }

    const contact = await Contact.create({
      userId: req.user._id,
      name,
      email: email || '',
      phone: phone || '',
      telegramId: telegramId || '',
      relationship: relationship || 'General',
      category: category || 'Personal',
      preferredChannel: preferredChannel || 'gmail'
    });

    res.status(201).json({
      success: true,
      message: 'Contact added successfully.',
      data: contact
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user._id }).sort({ name: 1 });
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }
    res.json({ success: true, message: 'Contact updated successfully.', data: contact });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    await Contact.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Contact deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createContact,
  getContacts,
  updateContact,
  deleteContact
};
