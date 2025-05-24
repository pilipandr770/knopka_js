// frontend/src/voice-synthesis.js
class VoiceSynthesis {
  constructor(options = {}) {
    this.isSupported = this.checkSupport();
    this.isPlaying = false;
    this.currentAudio = null;
    this.queue = [];
    
    this.options = {
      volume: options.volume || 1,
      rate: options.rate || 1,
      pitch: options.pitch || 1,
      voice: options.voice || null,
      language: options.language || 'ru-RU',
      ...options
    };

    this.onStart = options.onStart || (() => {});
    this.onEnd = options.onEnd || (() => {});
    this.onError = options.onError || (() => {});

    // Initialize speech synthesis if available
    if (this.isSupported && 'speechSynthesis' in window) {
      this.initializeSpeechSynthesis();
    }
  }
  checkSupport() {
    return !!(window.Audio && window.speechSynthesis);
  }

  initializeSpeechSynthesis() {
    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.availableVoices = speechSynthesis.getVoices();
        window.VoiceUtils.log('Speech synthesis voices loaded', this.availableVoices.length);
      };
    }
  }

  async playAudio(base64Data, format = 'mp3') {
    return new Promise((resolve, reject) => {
      try {
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
        }

        const audio = window.VoiceUtils.createAudioElement(base64Data, format);
        audio.volume = this.options.volume;
        
        audio.oncanplaythrough = () => {
          this.isPlaying = true;
          this.currentAudio = audio;
          this.onStart();
          
          audio.play().catch(error => {
            window.VoiceUtils.error('Audio play failed', error);
            this.onError(error);
            reject(error);
          });
        };

        audio.onended = () => {
          this.isPlaying = false;
          this.currentAudio = null;
          this.onEnd();
          resolve();
        };

        audio.onerror = (error) => {
          this.isPlaying = false;
          this.currentAudio = null;
          window.VoiceUtils.error('Audio error', error);
          this.onError(error);
          reject(error);
        };

        // Handle cases where audio can't be loaded
        setTimeout(() => {
          if (audio.readyState === 0) {
            reject(new Error('Audio failed to load'));
          }
        }, 5000);

      } catch (error) {
        window.VoiceUtils.error('Error creating audio', error);
        this.onError(error);
        reject(error);
      }
    });
  }

  async speakText(text) {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported');
    }

    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set properties
        utterance.volume = this.options.volume;
        utterance.rate = this.options.rate;
        utterance.pitch = this.options.pitch;
        utterance.lang = this.options.language;

        // Select voice if available
        if (this.options.voice && this.availableVoices) {
          const selectedVoice = this.availableVoices.find(voice => 
            voice.name === this.options.voice || voice.lang === this.options.language
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        utterance.onstart = () => {
          this.isPlaying = true;
          this.onStart();
          window.VoiceUtils.log('Speech synthesis started');
        };

        utterance.onend = () => {
          this.isPlaying = false;
          this.onEnd();
          window.VoiceUtils.log('Speech synthesis ended');
          resolve();
        };

        utterance.onerror = (error) => {
          this.isPlaying = false;
          window.VoiceUtils.error('Speech synthesis error', error);
          this.onError(error);
          reject(error);
        };

        speechSynthesis.speak(utterance);

      } catch (error) {
        window.VoiceUtils.error('Error in speech synthesis', error);
        this.onError(error);
        reject(error);
      }
    });
  }

  stop() {
    try {
      // Stop current audio
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      }

      // Stop speech synthesis
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }

      this.isPlaying = false;
      this.queue = [];
      
      window.VoiceUtils.log('Voice synthesis stopped');
      
    } catch (error) {
      window.VoiceUtils.error('Error stopping voice synthesis', error);
    }
  }

  pause() {
    try {
      if (this.currentAudio && !this.currentAudio.paused) {
        this.currentAudio.pause();
      }

      if ('speechSynthesis' in window && speechSynthesis.speaking) {
        speechSynthesis.pause();
      }

      window.VoiceUtils.log('Voice synthesis paused');
      
    } catch (error) {
      window.VoiceUtils.error('Error pausing voice synthesis', error);
    }
  }

  resume() {
    try {
      if (this.currentAudio && this.currentAudio.paused) {
        this.currentAudio.play();
      }

      if ('speechSynthesis' in window && speechSynthesis.paused) {
        speechSynthesis.resume();
      }

      window.VoiceUtils.log('Voice synthesis resumed');
      
    } catch (error) {
      window.VoiceUtils.error('Error resuming voice synthesis', error);
    }
  }

  setVolume(volume) {
    this.options.volume = Math.max(0, Math.min(1, volume));
    
    if (this.currentAudio) {
      this.currentAudio.volume = this.options.volume;
    }
  }

  getAvailableVoices() {
    if ('speechSynthesis' in window) {
      return speechSynthesis.getVoices();
    }
    return [];
  }

  isCurrentlyPlaying() {
    return this.isPlaying;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceSynthesis;
} else {
  window.VoiceSynthesis = VoiceSynthesis;
}