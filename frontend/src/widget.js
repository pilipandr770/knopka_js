// frontend/src/widget.js
class VoiceWidget {
  constructor(options = {}) {
    this.options = {
      debug: false,
      autoInit: true,
      ...options
    };

    this.isInitialized = false;
    this.isOpen = false;
    this.isRecording = false;
    this.config = null;
    
    this.apiClient = new VoiceApiClient();
    this.voiceRecognition = null;
    this.voiceSynthesis = null;
    
    this.elements = {};
    this.messages = [];
    
    if (this.options.autoInit) {
      this.init();
    }
  }

  async init() {
    if (this.isInitialized) return;

    try {
      VoiceUtils.log('Initializing Voice Widget');
      
      // Load configuration
      this.config = await this.apiClient.getConfig();
      VoiceUtils.log('Config loaded', this.config);
      
      // Initialize voice services
      this.initVoiceServices();
      
      // Create widget UI
      this.createWidget();
      
      // Bind events
      this.bindEvents();
      
      this.isInitialized = true;
      VoiceUtils.log('Voice Widget initialized successfully');
      
    } catch (error) {
      VoiceUtils.error('Failed to initialize widget', error);
      VoiceUtils.showNotification('Ошибка инициализации виджета', 'error');
    }
  }

  initVoiceServices() {
    this.voiceRecognition = new VoiceRecognition({
      language: this.config.language,
      onResult: (audioData) => this.handleVoiceResult(audioData),
      onError: (error) => this.handleVoiceError(error),
      onStart: () => this.handleRecordingStart(),
      onEnd: () => this.handleRecordingEnd(),
      onVolumeChange: (volume) => this.handleVolumeChange(volume)
    });

    this.voiceSynthesis = new VoiceSynthesis({
      language: this.config.language,
      onStart: () => this.handleSpeechStart(),
      onEnd: () => this.handleSpeechEnd(),
      onError: (error) => this.handleSpeechError(error)
    });
  }

  createWidget() {
    // Create main container
    const container = document.createElement('div');
    container.id = 'voice-widget-container';
    container.className = `voice-widget-container ${this.config.position}`;
    
    // Create widget button
    const button = document.createElement('div');
    button.className = 'voice-widget-button';
    button.innerHTML = `
      <div class="voice-widget-icon">
        <svg class="mic-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm6 6c0 4.4-3.5 8-7.9 8-.2 0-.4 0-.6-.1-3.5-.5-6.5-3.5-6.5-7.9 0-.6.4-1 1-1s1 .4 1 1c0 3.3 2.7 6 6 6s6-2.7 6-6c0-.6.4-1 1-1s1 .4 1 1zm-7 8c0 .6-.4 1-1 1s-1-.4-1-1v-2c0-.6.4-1 1-1s1 .4 1 1v2z"/>
        </svg>
        <div class="recording-animation">
          <div class="pulse"></div>
          <div class="pulse"></div>
          <div class="pulse"></div>
        </div>
      </div>
    `;

    // Create chat panel
    const panel = document.createElement('div');
    panel.className = 'voice-widget-panel';
    panel.innerHTML = `
      <div class="voice-widget-header">
        <h3>${this.config.title}</h3>
        <button class="close-button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="voice-widget-messages">
        <div class="welcome-message">
          <div class="message assistant">
            <div class="message-content">${this.config.welcomeMessage}</div>
          </div>
        </div>
      </div>
      <div class="voice-widget-input">
        <textarea placeholder="Введите сообщение..." rows="1"></textarea>
        <button class="send-button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
        <button class="voice-button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2z"/>
          </svg>
      </button>
    </div>
    `;

    container.appendChild(button);
    container.appendChild(panel);
    document.body.appendChild(container);

    this.elements = { container, button, panel };
    this.elements.messages = panel.querySelector('.voice-widget-messages');
    this.elements.input = panel.querySelector('textarea');
    this.elements.sendButton = panel.querySelector('.send-button');
    this.elements.voiceButton = panel.querySelector('.voice-button');
    this.elements.closeButton = panel.querySelector('.close-button');
    this.elements.recordingAnimation = button.querySelector('.recording-animation');

    // Set primary color
    container.style.setProperty('--primary-color', this.config.primaryColor);
  }

  bindEvents() {
    this.elements.button.addEventListener('click', () => this.togglePanel());
    this.elements.closeButton.addEventListener('click', () => this.closePanel());
    this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());
    this.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });
    this.elements.voiceButton.addEventListener('mousedown', () => this.startVoiceRecording());
    this.elements.voiceButton.addEventListener('touchstart', (e) => { e.preventDefault(); this.startVoiceRecording(); });
    this.elements.voiceButton.addEventListener('mouseup', () => this.stopVoiceRecording());
    this.elements.voiceButton.addEventListener('mouseleave', () => this.stopVoiceRecording());
    this.elements.voiceButton.addEventListener('touchend', () => this.stopVoiceRecording());
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    this.elements.panel.classList.toggle('open', this.isOpen);
    if (this.isOpen) {
      this.elements.input.focus();
    }
  }

  closePanel() {
    this.isOpen = false;
    this.elements.panel.classList.remove('open');
  }

  async handleSendMessage() {
    const text = this.elements.input.value.trim();
    if (!text) return;
    this.elements.input.value = '';
    this.renderMessage(text, 'user');
    try {
      const response = await this.apiClient.sendMessage(text);
      this.renderMessage(response.message, 'assistant');
      this.voiceSynthesis.speakText(response.message);
    } catch (error) {
      VoiceUtils.showNotification('Ошибка отправки сообщения', 'error');
    }
  }

  renderMessage(text, role = 'assistant') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = VoiceUtils.sanitizeHtml(text);
    msgDiv.appendChild(content);
    this.elements.messages.appendChild(msgDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  async startVoiceRecording() {
    if (this.isRecording) return;
    try {
      this.isRecording = true;
      this.elements.recordingAnimation.style.display = 'flex';
      await this.voiceRecognition.startRecording();
    } catch (error) {
      this.isRecording = false;
      this.elements.recordingAnimation.style.display = 'none';
      VoiceUtils.showNotification('Ошибка доступа к микрофону', 'error');
    }
  }

  stopVoiceRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.elements.recordingAnimation.style.display = 'none';
    this.voiceRecognition.stopRecording();
  }

  async handleVoiceResult(audioData) {
    this.renderMessage('...', 'user');
    try {
      const response = await this.apiClient.sendVoiceMessage(audioData);
      this.renderMessage(response.transcription, 'user');
      this.renderMessage(response.message, 'assistant');
      if (response.audioResponse) {
        this.voiceSynthesis.playAudio(response.audioResponse);
      }
    } catch (error) {
      VoiceUtils.showNotification('Ошибка голосового запроса', 'error');
    }
  }

  handleVoiceError(error) {
    VoiceUtils.showNotification('Ошибка записи голоса', 'error');
  }

  handleRecordingStart() {
    this.elements.recordingAnimation.style.display = 'flex';
  }

  handleRecordingEnd() {
    this.elements.recordingAnimation.style.display = 'none';
  }

  handleVolumeChange(volume) {
    // Можно добавить визуализацию громкости
  }

  handleSpeechStart() {
    // Можно добавить индикатор воспроизведения
  }

  handleSpeechEnd() {
    // Можно скрыть индикатор воспроизведения
  }

  handleSpeechError(error) {
    VoiceUtils.showNotification('Ошибка синтеза речи', 'error');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceWidget;
} else {
  window.VoiceWidget = VoiceWidget;
}
