// frontend/src/widget.js
class VoiceWidget {  constructor(options = {}) {
    this.options = {
      debug: false,
      autoInit: true,
      autoSpeak: true, // Автоматическая озвучка ответов
      preferOpenAITTS: false, // Предпочитать OpenAI TTS вместо браузерного
      ...options
    };

    this.isInitialized = false;
    this.isOpen = false;
    this.isRecording = false;
    this.isSpeaking = false;
    this.config = null;
    
    this.apiClient = new window.VoiceApiClient();
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
      window.VoiceUtils.log('Initializing Voice Widget');
      
      // Load configuration
      this.config = await this.apiClient.getConfig();
      window.VoiceUtils.log('Config loaded', this.config);
      
      // Initialize voice services
      this.initVoiceServices();
      
      // Create widget UI
      this.createWidget();
      
      // Bind events
      this.bindEvents();
      
      this.isInitialized = true;
      window.VoiceUtils.log('Voice Widget initialized successfully');
      
    } catch (error) {
      window.VoiceUtils.error('Failed to initialize widget', error);
      window.VoiceUtils.showNotification('Ошибка инициализации виджета', 'error');
    }
  }
  initVoiceServices() {
    this.voiceRecognition = new window.VoiceRecognition({
      language: this.config.language,
      onResult: (audioData) => this.handleVoiceResult(audioData),
      onError: (error) => this.handleVoiceError(error),
      onStart: () => this.handleRecordingStart(),
      onEnd: () => this.handleRecordingEnd(),
      onVolumeChange: (volume) => this.handleVolumeChange(volume)
    });

    this.voiceSynthesis = new window.VoiceSynthesis({
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
  }  async handleSendMessage() {
    const text = this.elements.input.value.trim();
    if (!text) return;
    
    this.elements.input.value = '';
    this.renderMessage(text, 'user');
    
    // Показываем индикатор печати
    this.showTypingIndicator();
    
    try {
      const response = await this.apiClient.sendMessage(text);
      
      // Скрываем индикатор печати
      this.hideTypingIndicator();
      
      this.renderMessage(response.message, 'assistant');
      
      // Автоматическая озвучка ответа ассистента
      window.VoiceUtils.log('Checking autoSpeak option', { autoSpeak: this.options.autoSpeak });
      if (this.options.autoSpeak) {
        window.VoiceUtils.log('Starting automatic speech for assistant response');
        await this.speakAssistantResponse(response.message);
      } else {
        window.VoiceUtils.log('AutoSpeak is disabled, skipping speech');
      }
      
    } catch (error) {
      this.hideTypingIndicator();
      window.VoiceUtils.error('Error in handleSendMessage', error);
      window.VoiceUtils.showNotification('Ошибка отправки сообщения', 'error');
    }
  }

  renderMessage(text, role = 'assistant') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = window.VoiceUtils.sanitizeHtml(text);
    msgDiv.appendChild(content);
    this.elements.messages.appendChild(msgDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  async startVoiceRecording() {
    if (this.isRecording) return;
    try {
      this.setRecordingState(true);
      await this.voiceRecognition.startRecording();
    } catch (error) {
      this.setRecordingState(false);
      window.VoiceUtils.showNotification('Ошибка доступа к микрофону', 'error');
    }
  }

  stopVoiceRecording() {
    if (!this.isRecording) return;
    this.setRecordingState(false);
    this.voiceRecognition.stopRecording();
  }  async handleVoiceResult(audioData) {
    this.renderMessage('...', 'user');
    try {
      const response = await this.apiClient.sendVoiceMessage(audioData);
      
      // Заменяем "..." на реальную транскрипцию
      const messages = this.elements.messages.children;
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.textContent.trim() === '...') {
        lastUserMessage.querySelector('.message-content').textContent = response.transcription;
      }
      
      this.renderMessage(response.message, 'assistant');
      
      // Автоматическая озвучка: используем сначала готовое аудио, потом TTS
      window.VoiceUtils.log('Voice result - checking autoSpeak', { autoSpeak: this.options.autoSpeak });
      if (this.options.autoSpeak) {
        if (response.audioResponse) {
          window.VoiceUtils.log('Playing audio response from server');
          await this.voiceSynthesis.playAudio(response.audioResponse);
        } else {
          window.VoiceUtils.log('No audio response from server, using TTS');
          await this.speakAssistantResponse(response.message);
        }
      } else {
        window.VoiceUtils.log('AutoSpeak disabled for voice input');
      }
      
    } catch (error) {
      window.VoiceUtils.error('Error in handleVoiceResult', error);
      window.VoiceUtils.showNotification('Ошибка голосового запроса', 'error');
    }
  }

  handleVoiceError(error) {
    window.VoiceUtils.showNotification('Ошибка записи голоса', 'error');
  }
  handleRecordingStart() {
    window.VoiceUtils.log('Recording started');
    this.setRecordingState(true);
  }

  handleRecordingEnd() {
    window.VoiceUtils.log('Recording ended');
    this.setRecordingState(false);
  }

  handleVolumeChange(volume) {
    // Можно добавить визуализацию громкости
  }

  handleSpeechStart() {
    window.VoiceUtils.log('Speech synthesis started');
    this.setSpeakingState(true);
  }

  handleSpeechEnd() {
    window.VoiceUtils.log('Speech synthesis ended');
    this.setSpeakingState(false);
  }  handleSpeechError(error) {
    window.VoiceUtils.showNotification('Ошибка синтеза речи', 'error');
  }

  async speakAssistantResponse(text) {
    try {
      window.VoiceUtils.log('Starting to speak assistant response', { text: text.substring(0, 50) + '...' });
      
      // НЕ устанавливаем состояние здесь - это будет делать обработчик событий VoiceSynthesis
      
      // Сначала пытаемся использовать встроенный TTS браузера для коротких текстов
      if ('speechSynthesis' in window && text.length <= 200) {
        window.VoiceUtils.log('Using browser TTS for short text');
        await this.voiceSynthesis.speakText(text);
      } else {
        // Для длинных текстов используем OpenAI TTS
        window.VoiceUtils.log('Using OpenAI TTS for long text');
        try {
          const audioBase64 = await this.apiClient.convertTextToSpeech(text);
          await this.voiceSynthesis.playAudio(audioBase64);
        } catch (error) {
          // Если TTS API не работает, используем браузерный TTS как fallback
          window.VoiceUtils.log('TTS API failed, using browser TTS as fallback', error);
          await this.voiceSynthesis.speakText(text);
        }
      }
      
      window.VoiceUtils.log('Assistant response speech completed');
      
    } catch (error) {
      window.VoiceUtils.error('Failed to speak assistant response', error);
      window.VoiceUtils.showNotification('Ошибка воспроизведения речи', 'warning');
      // При ошибке убираем состояние воспроизведения
      this.setSpeakingState(false);
    }
    // НЕ убираем состояние в finally - это делает обработчик onEnd
  }

  showSpeechIndicator(show) {
    // Добавляем визуальный индикатор, что идет воспроизведение
    let indicator = document.getElementById('speech-indicator');
    if (show) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'speech-indicator';
        indicator.innerHTML = '🔊 Воспроизведение...';
        indicator.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #007bff;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          z-index: 10000;
          animation: pulse 1.5s infinite;
        `;
        document.body.appendChild(indicator);
      }
      indicator.style.display = 'block';
    } else {
      if (indicator) {
        indicator.style.display = 'none';
      }
    }
  }

  // Управление визуальными состояниями и анимациями
  setRecordingState(isRecording) {
    this.isRecording = isRecording;
    
    // Анимация основной кнопки
    this.elements.button.classList.toggle('recording', isRecording);
    
    // Анимация кнопки записи в панели
    if (this.elements.voiceButton) {
      this.elements.voiceButton.classList.toggle('recording', isRecording);
    }
    
    // Показать/скрыть анимацию записи
    if (this.elements.recordingAnimation) {
      this.elements.recordingAnimation.classList.toggle('active', isRecording);
    }
    
    // Визуальная обратная связь
    if (isRecording) {
      this.showRecordingFeedback();
    } else {
      this.hideRecordingFeedback();
    }
  }
  
  setSpeakingState(isSpeaking) {
    this.isSpeaking = isSpeaking;
    
    // Анимация основной кнопки
    this.elements.button.classList.toggle('speaking', isSpeaking);
    
    if (isSpeaking) {
      this.showSpeakingFeedback();
      this.addSoundWaves();
    } else {
      this.hideSpeakingFeedback();
      this.removeSoundWaves();
    }
  }
  
  showRecordingFeedback() {
    // Показываем статус записи
    this.showStatus('🎤 Говорите...', 'recording');
    
    // Добавляем эффект пульсации
    if (navigator.vibrate) {
      navigator.vibrate(50); // Вибрация на мобильных
    }
  }
  
  hideRecordingFeedback() {
    this.hideStatus();
  }
  
  showSpeakingFeedback() {
    this.showStatus('🔊 Воспроизведение...', 'speaking');
  }
  
  hideSpeakingFeedback() {
    this.hideStatus();
  }
  
  addSoundWaves() {
    // Создаем анимацию звуковых волн в основной кнопке
    const soundWaves = document.createElement('div');
    soundWaves.className = 'sound-waves';
    soundWaves.innerHTML = `
      <div class="sound-wave"></div>
      <div class="sound-wave"></div>
      <div class="sound-wave"></div>
      <div class="sound-wave"></div>
      <div class="sound-wave"></div>
    `;
    
    // Скрываем иконку микрофона и показываем волны
    const icon = this.elements.button.querySelector('.voice-widget-icon');
    if (icon) {
      icon.style.opacity = '0';
      this.elements.button.appendChild(soundWaves);
    }
  }
  
  removeSoundWaves() {
    // Убираем волны и показываем иконку
    const soundWaves = this.elements.button.querySelector('.sound-waves');
    if (soundWaves) {
      soundWaves.remove();
    }
    
    const icon = this.elements.button.querySelector('.voice-widget-icon');
    if (icon) {
      icon.style.opacity = '1';
    }
  }
  
  showStatus(message, type = 'info') {
    // Убираем предыдущий статус
    this.hideStatus();
    
    // Создаем новый статус
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.innerHTML = message;
    
    // Добавляем в панель сообщений
    if (this.elements.messages) {
      this.elements.messages.appendChild(statusDiv);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
    
    this.currentStatus = statusDiv;
  }
  
  hideStatus() {
    if (this.currentStatus) {
      this.currentStatus.remove();
      this.currentStatus = null;
    }
  }
  
  showTypingIndicator() {
    // Показываем индикатор печати
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
      <span style="margin-left: 8px; color: #666;">Ассистент печатает...</span>
    `;
    
    this.elements.messages.appendChild(typingDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    this.typingIndicator = typingDiv;
  }
  
  hideTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.remove();
      this.typingIndicator = null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceWidget;
} else {
  window.VoiceWidget = VoiceWidget;
}
