const Document = require('../models/Document');
const documentService = require('../services/documentService');

const generateDocument = async (req, res) => {
  try {
    const { type, title, content, recipientName, dateStr } = req.body;
    const automationId = `DOC-${Date.now()}`;

    const pdfResult = await documentService.generatePDFDocument({
      automationId,
      type: type || 'custom_document',
      title: title || 'Custom Document',
      content: content || '',
      recipientName,
      dateStr
    });

    const docRecord = await Document.create({
      userId: req.user._id,
      automationId,
      type: type || 'custom_document',
      title: title || 'Custom Document',
      content: content || '',
      language: 'english',
      pdfPath: pdfResult.relativePath
    });

    res.status(201).json({
      success: true,
      message: 'Document generated successfully.',
      data: docRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: documents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  generateDocument,
  getDocuments,
  getDocumentById
};
