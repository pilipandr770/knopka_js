// frontend/src/voice-recognition.js
class VoiceRecognition {
  constructor(options = {}) {
    this.isSupported = this.checkSupport();
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    
    this.options = {
      language: options.language || 'ru-RU',
      mimeType: 'audio/webm',
      ...options
    };

    this.onResult = options.onResult || (() => {});
    this.onError = options.onError || (() => {});
    this.onStart = options.onStart || (() => {});
    this.onEnd = options.onEnd || (() => {});
    this.onVolumeChange = options.onVolumeChange || (() => {});

    this.volumeAnalyzer = null;
    this.animationFrame = null;
  }

  checkSupport() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  }

  async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      window.VoiceUtils.error('Microphone permission denied', error);
      return false;
    }
  }

  async startRecording() {
    if (!this.isSupported) {
      throw new Error('Voice recording is not supported in this browser');
    }

    if (this.isRecording) {
      window.VoiceUtils.log('Already recording');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.setupVolumeAnalyzer();
      this.setupMediaRecorder();
      
      this.audioChunks = [];
      this.mediaRecorder.start();
      this.isRecording = true;
      
      window.VoiceUtils.log('Recording started');
      this.onStart();

    } catch (error) {
      window.VoiceUtils.error('Failed to start recording', error);
      this.onError(error);
      throw error;
    }
  }

  setupVolumeAnalyzer() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(this.stream);
    
    analyser.fftSize = 256;
    microphone.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkVolume = () => {
      if (!this.isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const volume = average / 255;
      
      this.onVolumeChange(volume);
      this.animationFrame = requestAnimationFrame(checkVolume);
    };
    
    this.volumeAnalyzer = { audioContext, analyser };
    checkVolume();
  }

  setupMediaRecorder() {
    // Try different MIME types for compatibility
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    let mimeType = this.options.mimeType;
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.processRecording();
    };

    this.mediaRecorder.onerror = (error) => {
      window.VoiceUtils.error('MediaRecorder error', error);
      this.onError(error);
    };
  }

  stopRecording() {
    if (!this.isRecording) {
      window.VoiceUtils.log('Not currently recording');
      return;
    }

    try {
      this.isRecording = false;
      
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      if (this.volumeAnalyzer) {
        this.volumeAnalyzer.audioContext.close();
        this.volumeAnalyzer = null;
      }

      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      window.VoiceUtils.log('Recording stopped');
      this.onEnd();

    } catch (error) {
      window.VoiceUtils.error('Error stopping recording', error);
      this.onError(error);
    }
  }

  async processRecording() {
    try {
      if (this.audioChunks.length === 0) {
        throw new Error('No audio data recorded');
      }

      const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
      const audioBase64 = await this.blobToBase64(audioBlob);
      
      window.VoiceUtils.log(`Audio recorded: ${audioBlob.size} bytes, ${audioBlob.type}`);
      
      this.onResult(audioBase64);
      
    } catch (error) {
      window.VoiceUtils.error('Error processing recording', error);
      this.onError(error);
    }
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }

  cleanup() {
    this.stopRecording();
    this.onResult = () => {};
    this.onError = () => {};
    this.onStart = () => {};
    this.onEnd = () => {};
    this.onVolumeChange = () => {};
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceRecognition;
} else {
  window.VoiceRecognition = VoiceRecognition;
}
