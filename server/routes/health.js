const express = require('express');
const router = express.Router();

/**
 * @desc    Health check endpoint
 * @route   GET /api/health
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'LUZ IA API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

module.exports = router;
