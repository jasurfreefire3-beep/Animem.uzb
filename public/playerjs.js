//  Playerjs.com API Wrapper
//  Custom lightweight, high-performance HTML5 and HLS.js implementation
//  Supports play(), pause(), and destroy() methods as expected by VideoPlayer

(function() {
  function Playerjs(config) {
    if (!config) config = {};
    this.config = typeof config === 'string' ? { file: config } : config;
    var containerId = this.config.id || 'player';
    this.container = document.getElementById(containerId);
    
    if (!this.container && this.config.element) {
      this.container = this.config.element;
    }

    if (!this.container) {
      console.warn('Playerjs: Container element not found for id:', containerId);
      return;
    }

    // Create the video element
    const video = document.createElement('video');
    video.id = containerId + '-video';
    if (video && video.style) {
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.backgroundColor = '#000';
    }
    video.controls = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    
    if (this.config.poster) {
      video.poster = this.config.poster;
    }

    // Clear and append
    try {
      this.container.innerHTML = '';
      this.container.appendChild(video);
    } catch (e) {
      console.warn('Playerjs: Could not append video to container:', e);
    }
    this.video = video;

    const fileUrl = this.config.file || '';
    const isHls = fileUrl.includes('.m3u8') || fileUrl.includes('m3u8');

    if (isHls) {
      if (window.Hls) {
        this.initHls(fileUrl);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
        script.onload = () => {
          this.initHls(fileUrl);
        };
        document.head.appendChild(script);
      }
    } else if (fileUrl && video) {
      video.src = fileUrl;
    }
  }

  Playerjs.prototype.initHls = function(url) {
    if (!this.video) return;
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls();
      hls.loadSource(url);
      hls.attachMedia(this.video);
      this.hls = hls;
    } else if (this.video && this.video.canPlayType && this.video.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.src = url;
    }
  };

  Playerjs.prototype.play = function() {
    if (this.video) {
      this.video.play().catch(function(e) {
        console.warn('Playerjs play was blocked or failed:', e);
      });
    }
  };

  Playerjs.prototype.pause = function() {
    if (this.video) {
      this.video.pause();
    }
  };

  Playerjs.prototype.destroy = function() {
    if (this.hls) {
      try { this.hls.destroy(); } catch (e) {}
      this.hls = null;
    }
    if (this.container) {
      try { this.container.innerHTML = ''; } catch (e) {}
    }
    this.video = null;
    this.container = null;
  };

  Playerjs.prototype.api = function(param1, param2) {
    if (!this.video) return null;
    if (param1 === 'play') this.play();
    else if (param1 === 'pause') this.pause();
    else if (param1 === 'seek') this.video.currentTime = Number(param2) || 0;
    else if (param1 === 'volume') this.video.volume = Number(param2) || 1;
  };

  window.Playerjs = Playerjs;
})();

