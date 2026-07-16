import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  RotateCcw, 
  FastForward, 
  Loader2, 
  Info, 
  PictureInPicture, 
  RefreshCw, 
  Volume1,
  Tv
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerProps {
  key?: string;
  url: string;
  poster?: string;
}

export default function VideoPlayer({ url, poster }: VideoPlayerProps) {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('anime_player_volume');
    return saved ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('anime_player_muted') === 'true';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlayerJSReady, setIsPlayerJSReady] = useState(false);
  const [bufferedEnd, setBufferedEnd] = useState(0);

  // Resume progress features


  // Keyboard shortcut guide modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Error handling
  const [playerError, setPlayerError] = useState<string | null>(null);

  // HUD (Heads-Up Display) and Gesture states
  const [hud, setHud] = useState<{
    visible: boolean;
    icon: 'play' | 'pause' | 'volume' | 'mute' | 'speed' | 'seek-forward' | 'seek-backward' | 'pip';
    value?: string;
  }>({ visible: false, icon: 'play' });

  const [feedbackRipple, setFeedbackRipple] = useState<{
    side: 'left' | 'right' | null;
    id: number;
  }>({ side: null, id: 0 });

  // Timeline hover preview state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  // Ref hooks
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const hudTimeoutRef = useRef<number | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const playerJSRef = useRef<any>(null);

  // Check URL type
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isDirectVideo = !!url.match(/\.(mp4|webm|ogg|m3u8|mkv)(\?.*)?$/i);
  const isEmbed = !isYouTube && !isDirectVideo && (url.includes('embed') || url.includes('iframe') || url.includes('sibnet.ru') || url.includes('ok.ru') || url.includes('myvi') || !url.match(/\.(mp4|webm|ogg|m3u8|mkv)(\?.*)?$/i));

  // Auto-load PlayerJS if needed (only for non-direct, non-youtube, non-embed fallback URLs)
  useEffect(() => {
    if (isYouTube || isDirectVideo || isEmbed) {
      setIsPlayerJSReady(false);
      return;
    }

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
  }, [url, isYouTube, isDirectVideo, isEmbed]);

  // Instantiate or update PlayerJS
  useEffect(() => {
    if (isPlayerJSReady && !isYouTube && !isEmbed) {
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

      try {
        const container = document.getElementById('playerjs-container');
        if (container) {
          container.innerHTML = '';
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

  // Sync volume with local storage and video ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
    localStorage.setItem('anime_player_volume', String(volume));
    localStorage.setItem('anime_player_muted', String(isMuted));
  }, [volume, isMuted]);

  // Watch progress saving & loading features
  useEffect(() => {
    if (isYouTube || isEmbed || !url) return;
    setPlayerError(null);
  }, [url, isYouTube, isEmbed]);

  // Periodically save watched progress
  useEffect(() => {
    if (isYouTube || isEmbed || !url) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && isPlaying && video.currentTime > 5 && video.duration > 0) {
        if (video.duration - video.currentTime < 20) {
          // Finished, remove saved progress
          localStorage.removeItem(`anime_player_progress:${url}`);
        } else {
          localStorage.setItem(`anime_player_progress:${url}`, String(video.currentTime));
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [url, isPlaying, isYouTube, isEmbed]);

  // Helper to format time (e.g. 02:35)
  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Convert YouTube links
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

  // HUD display trigger helper
  const triggerHud = (icon: typeof hud['icon'], value?: string) => {
    setHud({ visible: true, icon, value });
    if (hudTimeoutRef.current) window.clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = window.setTimeout(() => {
      setHud(prev => ({ ...prev, visible: false }));
    }, 1000);
  };

  // HTML5 Player Controls Handlers
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current || playerError) return;
    if (isPlaying) {
      videoRef.current.pause();
      triggerHud('pause');
    } else {
      videoRef.current.play()
        .then(() => {
          triggerHud('play');
        })
        .catch(err => {
          console.error("Playback failed:", err);
        });
    }
  }, [isPlaying, playerError]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const nextMuted = val === 0;
    setIsMuted(nextMuted);
    triggerHud(nextMuted ? 'mute' : 'volume', `${Math.round(val * 100)}%`);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (!nextMute && volume === 0) {
      setVolume(0.5);
    }
    triggerHud(nextMute ? 'mute' : 'volume', nextMute ? 'Ovozsiz' : `${Math.round((volume || 0.5) * 100)}%`);
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
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Fullscreen error", err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
    triggerHud('speed', `${rate}x`);
  };

  const handleSkip = useCallback((amount: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + amount));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  // Controls Idle timer
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !showSettings && !showShortcutsModal) {
        setShowControls(false);
      }
    }, 2500);
  }, [isPlaying, showSettings, showShortcutsModal]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isYouTube || isEmbed || playerError) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercent = clickX / width;

    // Double click/tap handler
    if (e.detail === 2) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      
      if (clickPercent < 0.35) {
        // Double tap left
        handleSkip(-10);
        setFeedbackRipple({ side: 'left', id: Date.now() });
        triggerHud('seek-backward', '-10 soniya');
      } else if (clickPercent > 0.65) {
        // Double tap right
        handleSkip(10);
        setFeedbackRipple({ side: 'right', id: Date.now() });
        triggerHud('seek-forward', '+10 soniya');
      } else {
        // Double click center toggles fullscreen
        handleToggleFullscreen();
      }
    } else if (e.detail === 1) {
      // Single click delayed
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = window.setTimeout(() => {
        handlePlayPause();
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  // Keyboard and Wheel event bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
        return;
      }

      if (isYouTube || isEmbed) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
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
        case 'j':
          e.preventDefault();
          handleSkip(-10);
          triggerHud('seek-backward', '-10 soniya');
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          handleSkip(10);
          triggerHud('seek-forward', '+10 soniya');
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.min(1, prev + 0.05);
            triggerHud('volume', `${Math.round(next * 100)}%`);
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.max(0, prev - 0.05);
            triggerHud(next === 0 ? 'mute' : 'volume', `${Math.round(next * 100)}%`);
            return next;
          });
          break;
        case 'p':
          e.preventDefault();
          handleTogglePip();
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

  // Sync fullscreen exit via escape key
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

    const onPlay = () => {
      setIsPlaying(true);
      setPlayerError(null);
    };
    const onPause = () => setIsPlaying(false);
    
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Track buffer End
      if (video.buffered.length > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.currentTime >= video.buffered.start(i) && video.currentTime <= video.buffered.end(i)) {
            setBufferedEnd(video.buffered.end(i));
            break;
          }
        }
      }
    };

    const onDurationChange = () => setDuration(video.duration);
    const onLoadStart = () => {
      setIsLoading(true);
      setPlayerError(null);
    };
    const onCanPlay = () => setIsLoading(false);
    const onWaiting = () => setIsLoading(true);
    
    const onError = () => {
      setIsLoading(false);
      setPlayerError("Ushbu video formati yuklanmadi yoki havola eskirgan bo'lishi mumkin. Qayta yuklab ko'ring.");
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);

    // Load source
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

  // Picture-in-Picture check
  const [isPipSupported, setIsPipSupported] = useState(false);
  useEffect(() => {
    setIsPipSupported(
      !!document.pictureInPictureEnabled &&
      typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function'
    );
  }, []);

  const handleTogglePip = async () => {
    if (!videoRef.current || isYouTube || isEmbed) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        triggerHud('pip', 'Asosiy ekran');
      } else {
        await videoRef.current.requestPictureInPicture();
        triggerHud('pip', 'Kichik ekran');
      }
    } catch (err) {
      console.error("PiP toggling error:", err);
    }
  };

  const handleSeekBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || duration === 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(percent * duration);
    setHoverPosition(percent * 100);
  };

  const handleSeekBarMouseLeave = () => {
    setHoverTime(null);
  };

  // --- YouTube Frame Fallback ---
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

  // --- Embed Frame Fallback ---
  if (isEmbed) {
    let embedUrl = url;
    // Extract src if it's a full iframe tag
    if (url.trim().toLowerCase().startsWith('<iframe')) {
        const match = url.match(/src\s*=\s*["']([^"']+)["']/i);
        if (match) {
            embedUrl = match[1];
        } else {
            console.error("Failed to extract src from iframe tag", url);
            embedUrl = 'about:blank'; // Avoid setting it to the invalid iframe string
        }
    }
    
    console.log("DEBUG EMBED URL:", embedUrl);
    return (
      <div className="relative aspect-video bg-black rounded-sm overflow-hidden border border-[#222] shadow-2xl">
        <iframe
          src={embedUrl}
          title="Video Player"
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      </div>
    );
  }

  // --- PlayerJS Custom Flash/HTML5 Player Fallback ---
  if (isPlayerJSReady) {
    return (
      <div className="relative aspect-video bg-black rounded-sm overflow-hidden border border-[#222] shadow-2xl">
        <div id="playerjs-container" className="w-full h-full"></div>
      </div>
    );
  }

  // Played & Buffered percentages for timeline
  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  // --- ELITE CUSTOM HTML5 VIDEO PLAYER ---
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
      className={`relative aspect-video bg-black rounded-sm overflow-hidden border border-white/5 shadow-2xl group select-none transition-all duration-300 ${
        isFullscreen ? 'w-full h-full' : ''
      } ${!showControls && isPlaying ? 'cursor-none' : 'cursor-default'}`}
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        onClick={handleVideoClick}
        className="w-full h-full object-contain bg-black"
        playsInline
        preload="auto"
      />

      {/* Double Tap Seek Feedback Ripple animation */}
      <AnimatePresence>
        {feedbackRipple.side && (
          <motion.div
            key={feedbackRipple.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.8, scale: 1.1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.4 }}
            className={`absolute top-0 bottom-0 w-1/3 flex flex-col items-center justify-center bg-white/5 pointer-events-none z-10 ${
              feedbackRipple.side === 'left' ? 'left-0 rounded-r-full' : 'right-0 rounded-l-full'
            }`}
          >
            <div className="p-4 rounded-full bg-black/55 backdrop-blur-md border border-white/10 flex flex-col items-center gap-1">
              {feedbackRipple.side === 'left' ? (
                <>
                  <RotateCcw className="w-6 h-6 text-[#ff006a] animate-pulse" />
                  <span className="text-xs font-black text-white">-10s</span>
                </>
              ) : (
                <>
                  <FastForward className="w-6 h-6 text-[#ff006a] animate-pulse" />
                  <span className="text-xs font-black text-white">+10s</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-xs z-25">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-[#ff006a] animate-spin" />
            <span className="text-xs font-bold tracking-widest text-white/50 uppercase">Yuklanmoqda...</span>
          </div>
        </div>
      )}

      {/* Custom Error HUD Recovery panel */}
      {playerError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f] z-30 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-4 animate-pulse">
            <VolumeX size={24} />
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-wider mb-2">Video havola muammosi</h3>
          <p className="text-white/60 text-xs max-w-sm mb-6 leading-relaxed">{playerError}</p>
          <button
            onClick={() => {
              setPlayerError(null);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="px-5 py-2.5 bg-[#ff006a] hover:bg-[#d40058] text-white text-[11px] font-black rounded-sm uppercase tracking-widest transition-all shadow-lg shadow-[#ff006a]/20 flex items-center gap-2"
          >
            <RefreshCw size={14} /> Qayta yuklash
          </button>
        </div>
      )}

      {/* HUD central popup for events (Shortcuts / Clicks) */}
      <AnimatePresence>
        {hud.visible && !isLoading && !playerError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 backdrop-blur-md border border-white/15 px-4 py-3 rounded-sm flex items-center gap-2.5 shadow-2xl z-20 pointer-events-none"
          >
            {hud.icon === 'play' && <Play className="w-5 h-5 text-[#ff006a] fill-current" />}
            {hud.icon === 'pause' && <Pause className="w-5 h-5 text-white fill-current" />}
            {hud.icon === 'volume' && <Volume2 className="w-5 h-5 text-[#ff006a]" />}
            {hud.icon === 'mute' && <VolumeX className="w-5 h-5 text-red-500" />}
            {hud.icon === 'speed' && <Settings className="w-5 h-5 text-[#ff006a] animate-spin" style={{ animationDuration: '4s' }} />}
            {hud.icon === 'seek-forward' && <FastForward className="w-5 h-5 text-[#ff006a]" />}
            {hud.icon === 'seek-backward' && <RotateCcw className="w-5 h-5 text-[#ff006a]" />}
            {hud.icon === 'pip' && <PictureInPicture className="w-5 h-5 text-[#ff006a]" />}
            {hud.value && <span className="text-xs font-black text-white font-mono">{hud.value}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Controls Hud overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 pb-4 pt-10 flex flex-col gap-3 transition-all duration-350 z-20 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        {/* Seekbar Container with hover preview & loading buffer */}
        <div 
          ref={seekBarRef}
          onMouseMove={handleSeekBarMouseMove}
          onMouseLeave={handleSeekBarMouseLeave}
          className="relative group/timeline h-4 flex items-center cursor-pointer"
        >
          {/* Time Hover preview tooltip */}
          <AnimatePresence>
            {hoverTime !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="absolute bg-black/90 border border-[#27272a] text-[10px] font-mono font-bold px-2 py-1 text-white rounded-xs shadow-xl pointer-events-none z-30"
                style={{ left: `calc(${hoverPosition}% - 24px)`, top: '-28px' }}
              >
                {formatTime(hoverTime)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Underlay tracks */}
          <div className="relative w-full h-1 group-hover/timeline:h-1.5 bg-white/10 rounded-full overflow-hidden transition-all duration-200">
            {/* Loading Buffering progress */}
            <div 
              className="absolute top-0 bottom-0 left-0 bg-white/20 transition-all duration-300"
              style={{ width: `${bufferedPercent}%` }}
            />
            
            {/* Active Played progress */}
            <div 
              className="absolute top-0 bottom-0 left-0 bg-[#ff006a] shadow-[0_0_8px_#ff006a]"
              style={{ width: `${playedPercent}%` }}
            />
          </div>

          {/* Invisible Range Input Slider on top for robust cross-browser drag interaction */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleScrub}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          {/* Custom Glow Red Thumb indicator */}
          <div 
            className="absolute w-3 h-3 rounded-full bg-white border border-[#ff006a] shadow-[0_0_10px_#ff006a] pointer-events-none -translate-x-1.5 transition-transform duration-100 scale-0 group-hover/timeline:scale-100"
            style={{ left: `${playedPercent}%` }}
          />
        </div>

        {/* Action Controls Panel */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              disabled={isLoading || !!playerError}
              className="text-white hover:text-[#ff006a] transition-all transform hover:scale-110 disabled:opacity-50"
              title={isPlaying ? "Tanaffus" : "Ko'rish"}
            >
              {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
            </button>

            {/* Seek Back 10s */}
            <button
              onClick={() => handleSkip(-10)}
              disabled={isLoading || !!playerError}
              className="text-white/80 hover:text-[#ff006a] transition-all transform active:scale-95 disabled:opacity-50 hidden sm:block"
              title="10 soniya orqaga"
            >
              <RotateCcw size={16} />
            </button>

            {/* Seek Forward 10s */}
            <button
              onClick={() => handleSkip(10)}
              disabled={isLoading || !!playerError}
              className="text-white/80 hover:text-[#ff006a] transition-all transform active:scale-95 disabled:opacity-50 hidden sm:block"
              title="10 soniya oldinga"
            >
              <FastForward size={16} />
            </button>

            {/* Volume Control Combo */}
            <div className="flex items-center gap-1.5 group/volume relative">
              <button
                onClick={handleToggleMute}
                className="text-white hover:text-[#ff006a] transition-colors"
                title={isMuted ? "Ovozni yoqish" : "Ovozsiz qilish"}
              >
                {isMuted ? (
                  <VolumeX size={18} className="text-red-500" />
                ) : volume > 0.6 ? (
                  <Volume2 size={18} />
                ) : volume > 0 ? (
                  <Volume1 size={18} />
                ) : (
                  <VolumeX size={18} />
                )}
              </button>

              <div className="w-0 overflow-hidden md:group-hover/volume:w-16 transition-all duration-300 flex items-center h-4">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 h-1 rounded-full bg-white/20 appearance-none cursor-pointer accent-[#ff006a]"
                />
              </div>
            </div>

            {/* Time Stamp label */}
            <span className="text-[11px] font-mono font-black text-white/80 flex items-center gap-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/30">/</span>
              <span className="text-white/50">{formatTime(duration)}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Playback speed menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowShortcutsModal(false);
                }}
                className={`text-white hover:text-[#ff006a] transition-colors flex items-center gap-1 text-[11px] font-bold ${
                  showSettings ? 'text-[#ff006a]' : ''
                }`}
                title="Tezlik sozlamalari"
              >
                <Settings size={16} className={showSettings ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
                <span className="hidden sm:inline font-mono">{playbackRate}x</span>
              </button>

              {/* Speed Settings dropdown */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-8 right-0 bg-[#0d0d12]/95 backdrop-blur-md border border-white/10 rounded-sm py-1 shadow-2xl z-40 min-w-[120px]"
                  >
                    <div className="px-3 py-1.5 text-[9px] font-black text-white/40 tracking-wider uppercase border-b border-white/5 mb-1">
                      Tezlikni tanlang
                    </div>
                    {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-[#ff006a]/15 flex items-center justify-between ${
                          playbackRate === rate ? 'text-[#ff006a] font-black bg-[#ff006a]/5' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <span>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                        {playbackRate === rate && <div className="w-1.5 h-1.5 rounded-full bg-[#ff006a] shadow-[0_0_6px_#ff006a]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Picture-in-Picture Button */}
            {isPipSupported && (
              <button
                onClick={handleTogglePip}
                className="text-white hover:text-[#ff006a] transition-all transform hover:scale-105"
                title="Kichik ekran (PiP)"
              >
                <PictureInPicture size={16} />
              </button>
            )}

            {/* Shortcuts Guide Button */}
            <button
              onClick={() => {
                setShowShortcutsModal(!showShortcutsModal);
                setShowSettings(false);
              }}
              className={`text-white hover:text-[#ff006a] transition-all transform hover:scale-105 ${
                showShortcutsModal ? 'text-[#ff006a]' : ''
              }`}
              title="Tugmalar ro'yxati"
            >
              <Info size={16} />
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={handleToggleFullscreen}
              className="text-white hover:text-[#ff006a] transition-all transform hover:scale-110"
              title={isFullscreen ? "Kichik ekran" : "To'liq ekran"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm z-35 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#0b0b0f] border border-white/10 rounded-sm p-5 max-w-sm w-full relative"
            >
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors font-black text-xs uppercase"
              >
                yopish
              </button>

              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2.5">
                <Info size={16} className="text-[#ff006a]" />
                <h3 className="text-white font-black text-xs uppercase tracking-wider">Tezkor Tugmalar</h3>
              </div>

              <div className="flex flex-col gap-2.5 text-[11px]">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-white/60">Ijro / Tanaffus</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 text-white rounded font-mono font-bold text-[9px]">Space / K</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-white/60">To'liq ekran</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 text-white rounded font-mono font-bold text-[9px]">F</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-white/60">Ovozsiz rejim</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 text-white rounded font-mono font-bold text-[9px]">M</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-white/60">Picture-in-Picture</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 text-white rounded font-mono font-bold text-[9px]">P</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-white/60">10s Orqaga / Oldinga</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 text-white rounded font-mono font-bold text-[9px]">← / →</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-white/60">Ovoz balandligi</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 text-white rounded font-mono font-bold text-[9px]">↑ / ↓</kbd>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/60">Tezkor burash (Sichqoncha)</span>
                  <span className="text-white/50 font-bold text-[9px]">Scroll (g'ildirak)</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
