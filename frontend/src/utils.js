// frontend/src/utils.js
class Utils {
  static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  static isChrome() {
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  static copyToClipboard(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return Promise.resolve();
      } catch (err) {
        document.body.removeChild(textArea);
        return Promise.reject(err);
      }
    }
  }

  static getBaseUrl() {
    const scripts = document.getElementsByTagName('script');
    for (let script of scripts) {
      if (script.src && script.src.includes('widget.js')) {
        return script.src.replace('/widget.js', '');
      }
    }
    // Fallback - try to detect from current location
    return window.location.origin;
  }

  static createAudioElement(base64Data, format = 'mp3') {
    const audio = document.createElement('audio');
    audio.src = `data:audio/${format};base64,${base64Data}`;
    audio.preload = 'auto';
    return audio;
  }

  static base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return window.btoa(binary);
  }

  static showNotification(message, type = 'info', duration = 3000) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('voice-widget-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'voice-widget-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10001;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
      `;
      document.body.appendChild(notification);
    }

    // Set color based on type
    const colors = {
      info: '#007bff',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545'
    };

    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;

    // Show notification
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';

    // Hide after duration
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
    }, duration);
  }

  static log(message, data = null) {
    if (window.VoiceWidget && window.VoiceWidget.debug) {
      console.log(`[VoiceWidget] ${message}`, data || '');
    }
  }

  static error(message, error = null) {
    console.error(`[VoiceWidget] ${message}`, error || '');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
} else {
  window.VoiceUtils = Utils;
}