// backend/server.js
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Import middleware
const corsMiddleware = require('./middleware/cors');
const rateLimiter = require('./middleware/rate-limit');

// Import routes
const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health');

// Import utilities
const config = require('./utils/config');
const logger = require('./utils/logger');

const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(corsMiddleware);

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Serve static files (widget files)
app.use(express.static(path.join(__dirname, '../frontend/public'), {
  maxAge: '1h',
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// API routes
app.use('/api', chatRoutes);
app.use('/', healthRoutes);

// Widget embed endpoint
app.get('/embed', (req, res) => {
  const embedScript = `
(function() {
  const script = document.createElement('script');
  script.src = '${req.protocol}://${req.get('host')}/widget.js';
  script.async = true;
  document.head.appendChild(script);
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '${req.protocol}://${req.get('host')}/widget.css';
  document.head.appendChild(link);
})();
  `.trim();

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.send(embedScript);
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Voice widget server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Widget config: ${JSON.stringify(config.widget)}`);
});

module.exports = app;