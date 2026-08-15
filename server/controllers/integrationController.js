const Integration = require('../models/Integration');

const defaultServices = [
  { service: 'gmail', connected: true, status: 'Connected', credentials: { email: 'user@gmail.com' } },
  { service: 'telegram', connected: false, status: 'Configuration Required', credentials: { botToken: '' } },
  { service: 'groq', connected: true, status: 'Connected', credentials: { model: 'llama-3.3-70b-versatile' } },
  { service: 'n8n', connected: true, status: 'Connected', credentials: { baseUrl: 'http://localhost:5678' } }
];

const getIntegrations = async (req, res) => {
  try {
    let dbIntegrations = await Integration.find({ userId: req.user._id });

    // Seed default integrations if empty
    if (dbIntegrations.length === 0) {
      const seeded = await Integration.insertMany(
        defaultServices.map(item => ({
          ...item,
          userId: req.user._id,
          lastSync: new Date()
        }))
      );
      return res.json({ success: true, data: seeded });
    }

    res.json({ success: true, data: dbIntegrations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const connectIntegration = async (req, res) => {
  try {
    const { service, credentials } = req.body;
    if (!service) {
      return res.status(400).json({ success: false, message: 'Service name is required.' });
    }

    const updated = await Integration.findOneAndUpdate(
      { userId: req.user._id, service },
      {
        connected: true,
        status: 'Connected',
        credentials: credentials || {},
        lastSync: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: `${service.toUpperCase()} integration connected.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    await Integration.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { connected: false, status: 'Not Connected', credentials: {} }
    );
    res.json({ success: true, message: 'Integration disconnected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getIntegrations,
  connectIntegration,
  deleteIntegration
};
