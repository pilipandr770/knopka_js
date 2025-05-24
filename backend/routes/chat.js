// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const openaiService = require('../services/openai-service');
const voiceService = require('../services/voice-service');
const { validateChatMessage, validateVoiceMessage } = require('../middleware/validation');
const logger = require('../utils/logger');
const config = require('../utils/config');

// Text chat endpoint
router.post('/chat', validateChatMessage, async (req, res) => {
  try {
    const { message, threadId } = req.body;
    
    logger.info(`Received chat message: ${message.substring(0, 100)}...`);
    
    const response = await openaiService.sendMessage(message, threadId);
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    logger.error('Error in chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// Voice chat endpoint
router.post('/voice', validateVoiceMessage, async (req, res) => {
  try {
    const { audioData, threadId } = req.body;
    
    logger.info('Received voice message');
    
    const response = await voiceService.processVoiceMessage(audioData, threadId);
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    logger.error('Error in voice endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice message'
    });
  }
});

// Text-to-speech endpoint
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    if (text.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long (max 4000 characters)'
      });
    }
    
    logger.info(`Generating speech for text: ${text.substring(0, 100)}...`);
    
    const audioBase64 = await voiceService.generateSpeechOnly(text);
    
    res.json({
      success: true,
      data: {
        audio: audioBase64
      }
    });
    
  } catch (error) {
    logger.error('Error in TTS endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate speech'
    });
  }
});

// Get widget configuration
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      title: config.widget.title,
      welcomeMessage: config.widget.welcomeMessage,
      primaryColor: config.widget.primaryColor,
      position: config.widget.position,
      language: config.widget.language
    }
  });
});

// Create new thread
router.post('/thread', async (req, res) => {
  try {
    const threadId = await openaiService.createThread();
    
    res.json({
      success: true,
      data: {
        threadId: threadId
      }
    });
    
  } catch (error) {
    logger.error('Error creating thread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create thread'
    });
  }
});

module.exports = router;