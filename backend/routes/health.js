// backend/routes/health.js
const express = require('express');
const router = express.Router();
const config = require('../utils/config');

router.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = error;
    res.status(503).json(healthCheck);
  }
});

module.exports = router;