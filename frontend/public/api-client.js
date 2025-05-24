// frontend/src/api-client.js
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || window.VoiceUtils.getBaseUrl();
    this.threadId = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/api${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    window.VoiceUtils.log(`API Request: ${config.method} ${url}`);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }

      window.VoiceUtils.log(`API Response:`, data);
      return data.data;

    } catch (error) {
      window.VoiceUtils.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  async getConfig() {
    try {
      return await this.request('/config');
    } catch (error) {
      window.VoiceUtils.error('Failed to get config', error);
      // Return default config if request fails
      return {
        title: 'Голосовой помощник',
        welcomeMessage: 'Привет! Чем могу помочь?',
        primaryColor: '#007bff',
        position: 'bottom-right',
        language: 'ru'
      };
    }
  }

  async sendMessage(message) {
    try {
      const result = await this.request('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: message,
          threadId: this.threadId
        })
      });

      // Update thread ID if it was created by backend
      if (result.threadId && !this.threadId) {
        this.threadId = result.threadId;
      }

      return result;
    } catch (error) {
      window.VoiceUtils.error('Failed to send message', error);
      throw error;
    }
  }

  async sendVoiceMessage(audioData) {
    try {
      const result = await this.request('/voice', {
        method: 'POST',
        body: JSON.stringify({
          audioData: audioData,
          threadId: this.threadId
        })
      });

      // Update thread ID if it was created by backend
      if (result.threadId && !this.threadId) {
        this.threadId = result.threadId;
      }

      return result;
    } catch (error) {
      window.VoiceUtils.error('Failed to send voice message', error);
      throw error;
    }
  }

  async convertTextToSpeech(text) {
    try {
      const result = await this.request('/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: text
        })
      });

      return result.audio;
    } catch (error) {
      window.VoiceUtils.error('Failed to convert text to speech', error);
      throw error;
    }
  }

  getThreadId() {
    return this.threadId;
  }

  resetThread() {
    this.threadId = null;
    window.VoiceUtils.log('Thread reset');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
} else {
  window.VoiceApiClient = ApiClient;
}
