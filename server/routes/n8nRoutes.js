const express = require('express');
const router = express.Router();
const { handleN8nCallback } = require('../controllers/n8nController');

router.post('/callback', handleN8nCallback);

module.exports = router;
