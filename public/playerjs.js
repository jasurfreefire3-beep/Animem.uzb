//  Playerjs.com API Wrapper
//  Custom lightweight, high-performance HTML5 and HLS.js implementation
//  Supports play(), pause(), and destroy() methods as expected by VideoPlayer

(function() {
  function Playerjs(config) {
    this.config = config;
    this.container = document.getElementById(config.id);
    if (!this.container) {
      console.warn('Playerjs: Container not found:', config.id);
      return;
    }

    // Create the video element
    const video = document.createElement('video');
    video.id = 'playerjs-video';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.backgroundColor = '#000';
    video.controls = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    
    if (config.poster) {
      video.poster = config.poster;
    }

    // Clear and append
    this.container.innerHTML = '';
    this.container.appendChild(video);
    this.video = video;

    const fileUrl = config.file || '';
    const isHls = fileUrl.includes('.m3u8') || fileUrl.includes('m3u8');

    if (isHls) {
      // Dynamically load Hls.js if not already loaded globally
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
    } else {
      video.src = fileUrl;
    }
  }

  Playerjs.prototype.initHls = function(url) {
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls();
      hls.loadSource(url);
      hls.attachMedia(this.video);
      this.hls = hls;
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
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
      this.hls.destroy();
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  };

  window.Playerjs = Playerjs;
})();
