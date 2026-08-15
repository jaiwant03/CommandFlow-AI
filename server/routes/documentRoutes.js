const express = require('express');
const router = express.Router();
const { generateDocument, getDocuments, getDocumentById } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateDocument);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocumentById);

module.exports = router;
