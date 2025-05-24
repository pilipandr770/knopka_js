// backend/services/voice-service.js
const fs = require('fs');
const path = require('path');
const openaiService = require('./openai-service');
const logger = require('../utils/logger');

class VoiceService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async processVoiceMessage(audioData, threadId = null) {
    let tempFilePath = null;
    
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      // Save to temporary file
      tempFilePath = path.join(this.tempDir, `audio_${Date.now()}.webm`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Create file object for OpenAI
      const audioFile = fs.createReadStream(tempFilePath);
      
      // Transcribe audio
      const transcription = await openaiService.transcribeAudio(audioFile);
      logger.info(`Audio transcribed: ${transcription.substring(0, 100)}...`);

      // Send transcription to assistant
      const response = await openaiService.sendMessage(transcription, threadId);

      // Generate speech response
      const speechResponse = await openaiService.generateSpeech(response.message);
      const audioResponseBuffer = Buffer.from(await speechResponse.arrayBuffer());

      return {
        transcription: transcription,
        message: response.message,
        threadId: response.threadId,
        audioResponse: audioResponseBuffer.toString('base64')
      };

    } catch (error) {
      logger.error('Error processing voice message:', error);
      throw error;
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          logger.error('Error cleaning up temp file:', cleanupError);
        }
      }
    }
  }

  async generateSpeechOnly(text) {
    try {
      const speechResponse = await openaiService.generateSpeech(text);
      const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
      return audioBuffer.toString('base64');
    } catch (error) {
      logger.error('Error generating speech:', error);
      throw error;
    }
  }
}

module.exports = new VoiceService();