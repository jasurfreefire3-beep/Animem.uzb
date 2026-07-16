import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, RotateCcw, FastForward, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
}

export default function VideoPlayer({ url, poster }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlayerJSReady, setIsPlayerJSReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const playerJSRef = useRef<any>(null);

  // Detect player type
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isEmbed = !isYouTube && (url.includes('embed') || url.includes('iframe') || url.includes('sibnet.ru') || url.includes('ok.ru') || url.includes('myvi') || !url.match(/\.(mp4|webm|ogg|m3u8|mkv)(\?.*)?$/i));

  // Dynamically load PlayerJS script
  useEffect(() => {
    if (isYouTube || isEmbed) return;

    if ((window as any).Playerjs) {
      setIsPlayerJSReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = '/playerjs.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).Playerjs) {
        console.log('PlayerJS successfully loaded!');
        setIsPlayerJSReady(true);
      }
    };
    script.onerror = () => {
      console.log('PlayerJS script not found at /playerjs.js. Falling back to default player.');
      setIsPlayerJSReady(false);
    };
    document.body.appendChild(script);

    return () => {
      // Keep script in body to avoid reloading on remounts
    };
  }, [url, isYouTube, isEmbed]);

  // Instantiate or update PlayerJS
  useEffect(() => {
    if (isPlayerJSReady && !isYouTube && !isEmbed) {
      // Clear previous player instance if any
      if (playerJSRef.current) {
        try {
          if (typeof playerJSRef.current.destroy === 'function') {
            playerJSRef.current.destroy();
          } else {
            const el = document.getElementById('playerjs-container');
            if (el) el.innerHTML = '';
          }
        } catch (e) {
          console.error(e);
        }
        playerJSRef.current = null;
      }

      // Initialize new Playerjs player
      try {
        const container = document.getElementById('playerjs-container');
        if (container) {
          container.innerHTML = ''; // clear any remaining DOM elements
          playerJSRef.current = new (window as any).Playerjs({
            id: 'playerjs-container',
            file: url,
            poster: poster
          });
        }
      } catch (e) {
        console.error('Failed to initialize PlayerJS:', e);
      }
    }

    return () => {
      if (playerJSRef.current) {
        try {
          if (typeof playerJSRef.current.destroy === 'function') {
            playerJSRef.current.destroy();
          }
        } catch (e) {
          console.error(e);
        }
        playerJSRef.current = null;
      }
    };
  }, [isPlayerJSReady, url, poster, isYouTube, isEmbed]);

  // Helper to format time (e.g. 02:35)
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Convert regular YouTube link to Embed
  const getYouTubeEmbedUrl = (ytUrl: string) => {
    let videoId = '';
    if (ytUrl.includes('youtu.be/')) {
      videoId = ytUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (ytUrl.includes('v=')) {
      videoId = ytUrl.split('v=')[1]?.split('&')[0] || '';
    } else if (ytUrl.includes('embed/')) {
      videoId = ytUrl.split('embed/')[1]?.split('?')[0] || '';
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
  };

  // HTML5 Video Handlers
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
    if (!nextMute && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Fullscreen error", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  // Rewind or Forward
  const handleSkip = useCallback((amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += amount;
  }, []);

  // Hide Controls timer
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettings(false);
      }
    }, 2500);
  }, [isPlaying]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in comments/chat input
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
        return;
      }

      if (isYouTube || isEmbed) return; // Only for HTML5 video

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          handleToggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.min(1, prev + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.max(0, prev - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause, handleToggleFullscreen, handleSkip, isYouTube, isEmbed, isMuted, volume]);

  // Sync fullscreen change with Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Sync Video Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onLoadStart = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onWaiting = () => setIsLoading(true);
    const onError = (e: any) => {
      console.warn("Video failed to load/play or format unsupported:", e);
      setIsLoading(false);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);

    // Initial load
    setIsLoading(true);
    video.load();

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('loadstart', onLoadStart);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
    };
  }, [url]);

  // --- YouTube / Embed player ---
  if (isYouTube) {
    return (
      <div className="relative aspect-video bg-black rounded-sm overflow-hidden border border-[#222] shadow-2xl">
        <iframe
          src={getYouTubeEmbedUrl(url)}
          title="YouTube Video Player"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (isEmbed) {
    return (
      <div className="relative aspect-video bg-black rounded-sm overflow-hidden border border-[#222] shadow-2xl">
        <iframe
          src={url}
          title="Video Player"
          className="w-full h-full border-0"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        />
      </div>
    );
  }

  // --- PlayerJS player ---
  if (isPlayerJSReady) {
    return (
      <div className="relative aspect-video bg-black rounded-sm overflow-hidden border border-[#222] shadow-2xl">
        <div id="playerjs-container" className="w-full h-full"></div>
      </div>
    );
  }

  // --- Gorgeous Custom HTML5 Player ---
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSettings(false);
        }
      }}
      onTouchEnd={() => {
        if (isPlaying) {
          // Immediately hide controls after a brief tap release delay or straight away
          setTimeout(() => {
            setShowControls(false);
            setShowSettings(false);
          }, 300);
        }
      }}
      className={`relative aspect-video bg-black rounded-sm overflow-hidden border border-[#222] shadow-2xl group select-none ${
        isFullscreen ? 'w-full h-full' : ''
      }`}
    >
      {/* Video Tag */}
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        onClick={handlePlayPause}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs z-20">
          <Loader2 className="w-12 h-12 text-[#ff006a] animate-spin" />
        </div>
      )}

      {/* Large Center Overlay Controls (Play, Rewind, FastForward) */}
      <div 
        onClick={handlePlayPause}
        className={`absolute inset-0 flex items-center justify-center gap-6 md:gap-10 transition-all duration-300 z-10 cursor-pointer ${
          showControls ? 'opacity-100 bg-black/40 backdrop-blur-xs' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Skip Back 10s */}
        {!isLoading && (
          <button 
            onClick={(e) => { e.stopPropagation(); handleSkip(-10); }}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/50 hover:bg-[#ff006a] border border-white/10 flex items-center justify-center text-white transition-all transform active:scale-90"
            title="10 soniya orqaga"
          >
            <RotateCcw size={20} />
          </button>
        )}

        {/* Large Play/Pause */}
        {!isLoading && (
          <button 
            onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#ff006a] hover:bg-[#d40058] flex items-center justify-center text-white shadow-xl shadow-[#ff006a]/35 transform hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current text-white" />
            ) : (
              <Play className="w-8 h-8 md:w-10 md:h-10 fill-current text-white ml-1.5" />
            )}
          </button>
        )}

        {/* Skip Forward 10s */}
        {!isLoading && (
          <button 
            onClick={(e) => { e.stopPropagation(); handleSkip(10); }}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/50 hover:bg-[#ff006a] border border-white/10 flex items-center justify-center text-white transition-all transform active:scale-90"
            title="10 soniya oldinga"
          >
            <FastForward size={20} />
          </button>
        )}
      </div>

      {/* Custom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 flex flex-col gap-3 transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Progress Bar */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleScrub}
            className="w-full h-2 md:h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ff006a] md:hover:h-2 transition-all"
          />
        </div>

        {/* Buttons and controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Play / Pause button */}
            <button 
              onClick={handlePlayPause} 
              className="text-white hover:text-[#ff006a] transition-colors p-1"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-current" />}
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-1.5 md:gap-2 group/volume">
              <button 
                onClick={handleToggleMute} 
                className="text-white hover:text-[#ff006a] transition-colors p-1"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 md:group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ff006a] hidden md:block"
              />
            </div>

            {/* Time code display */}
            <span className="text-[11px] md:text-xs font-medium font-mono text-white/80">
              {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-4 relative">
            {/* Settings button (playback rate) */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`text-white hover:text-[#ff006a] transition-colors p-1 ${showSettings ? 'text-[#ff006a]' : ''}`}
              title="Tezlik sozlamalari"
            >
              <Settings size={18} />
            </button>

            {/* Settings Dropdown menu */}
            {showSettings && (
              <div className="absolute bottom-10 right-0 bg-[#0d0d12] border border-[#27272a]/80 rounded-sm py-1.5 shadow-2xl z-30 min-w-[120px] text-xs">
                <div className="px-3 py-1 text-[10px] font-bold text-white/40 uppercase border-b border-[#27272a]/50 mb-1">
                  Tezlik
                </div>
                {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleSpeedChange(rate)}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#ff006a]/20 hover:text-white transition-colors flex items-center justify-between ${
                      playbackRate === rate ? 'text-[#ff006a] font-bold' : 'text-white/70'
                    }`}
                  >
                    <span>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                    {playbackRate === rate && <span className="w-1.5 h-1.5 rounded-full bg-[#ff006a]" />}
                  </button>
                ))}
              </div>
            )}

            {/* Fullscreen toggle button */}
            <button
              onClick={handleToggleFullscreen}
              className="text-white hover:text-[#ff006a] transition-colors p-1"
              title={isFullscreen ? 'Kichik ekran' : 'To\'liq ekran'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
