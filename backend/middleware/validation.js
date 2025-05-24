// backend/middleware/validation.js
const { body, validationResult } = require('express-validator');

const validateChatMessage = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .trim()
    .escape(),
  
  body('threadId')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) {
        return true; // Allow null/undefined values
      }
      if (typeof value !== 'string') {
        throw new Error('Thread ID must be a string');
      }
      if (value.length < 1 || value.length > 100) {
        throw new Error('Thread ID must be between 1 and 100 characters');
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateVoiceMessage = [
  body('audioData')
    .notEmpty()
    .withMessage('Audio data is required')
    .isBase64()
    .withMessage('Audio data must be base64 encoded'),

  body('threadId')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) {
        return true; // Allow null/undefined values
      }
      if (typeof value !== 'string') {
        throw new Error('Thread ID must be a string');
      }
      if (value.length < 1 || value.length > 100) {
        throw new Error('Thread ID must be between 1 and 100 characters');
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateChatMessage,
  validateVoiceMessage
};