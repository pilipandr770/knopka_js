// backend/utils/config.js
require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,
  assistantId: process.env.ASSISTANT_ID,

  // Widget
  widget: {
    title: process.env.WIDGET_TITLE || 'Голосовой помощник',
    welcomeMessage: process.env.WIDGET_WELCOME_MESSAGE || 'Привет! Чем могу помочь?',
    primaryColor: process.env.WIDGET_PRIMARY_COLOR || '#007bff',
    position: process.env.WIDGET_POSITION || 'bottom-right',
    language: process.env.WIDGET_LANGUAGE || 'ru'
  },

  // Security
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
  rateLimit: {
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_REQUESTS) || 100
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'ASSISTANT_ID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

module.exports = config;