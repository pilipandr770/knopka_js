// backend/services/openai-service.js
const OpenAI = require('openai');
const config = require('../utils/config');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey
    });
    this.assistantId = config.assistantId;
    this.threads = new Map(); // Store threads in memory
  }

  async createThread() {
    try {
      const thread = await this.client.beta.threads.create();
      logger.info(`Thread created: ${thread.id}`);
      return thread.id;
    } catch (error) {
      logger.error('Error creating thread:', error);
      throw new Error('Failed to create conversation thread');
    }
  }

  async sendMessage(message, threadId = null) {
    try {
      // Create new thread if not provided
      if (!threadId) {
        threadId = await this.createThread();
      }

      // Add message to thread
      await this.client.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message
      });

      // Run assistant
      const run = await this.client.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId
      });

      // Wait for completion
      const completedRun = await this.waitForRunCompletion(threadId, run.id);
      
      if (completedRun.status === 'completed') {
        // Get messages
        const messages = await this.client.beta.threads.messages.list(threadId);
        const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
        
        if (assistantMessage && assistantMessage.content[0]) {
          const response = {
            message: assistantMessage.content[0].text.value,
            threadId: threadId
          };
          
          logger.info(`Assistant response generated for thread: ${threadId}`);
          return response;
        }
      }

      throw new Error('Failed to get assistant response');
    } catch (error) {
      logger.error('Error in sendMessage:', error);
      throw new Error('Failed to process message');
    }
  }

  async waitForRunCompletion(threadId, runId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const run = await this.client.beta.threads.runs.retrieve(threadId, runId);
        
        if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
          return run;
        }

        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error checking run status (attempt ${i + 1}):`, error);
        if (i === maxAttempts - 1) throw error;
      }
    }
    
    throw new Error('Run completion timeout');
  }

  async transcribeAudio(audioBuffer) {
    try {
      const response = await this.client.audio.transcriptions.create({
        file: audioBuffer,
        model: 'whisper-1',
        language: config.widget.language
      });

      logger.info('Audio transcribed successfully');
      return response.text;
    } catch (error) {
      logger.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async generateSpeech(text) {
    try {
      const response = await this.client.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text.substring(0, 4096), // TTS API limit
        response_format: 'mp3'
      });

      logger.info('Speech generated successfully');
      return response;
    } catch (error) {
      logger.error('Error generating speech:', error);
      throw new Error('Failed to generate speech');
    }
  }
}

module.exports = new OpenAIService();