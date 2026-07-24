import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  Volume1, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  Gauge, 
  PictureInPicture, 
  Maximize, 
  Minimize,
  Loader2
} from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  animeTitle?: string;
}

function getEmbedUrl(url: string): { isEmbed: boolean; embedUrl: string } {
  if (!url) return { isEmbed: false, embedUrl: '' };

  const trimmed = url.trim();
  const lowerUrl = trimmed.toLowerCase();

  // If it is an HTML iframe tag, extract the src URL
  if (lowerUrl.includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      let finalUrl = srcMatch[1];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return { isEmbed: true, embedUrl: finalUrl };
    }
  }

  // If it's an .m3u8 stream, treat it as direct HLS stream for custom player (not iframe embed)
  const isM3U8 = lowerUrl.includes('.m3u8') || lowerUrl.includes('format=m3u8') || lowerUrl.includes('/m3u8');
  if (isM3U8) {
    return { isEmbed: false, embedUrl: '' };
  }

  // YouTube checks
  let youtubeId = '';
  const ytMatch1 = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\s\?]+)/i);
  if (ytMatch1) {
    youtubeId = ytMatch1[1];
  } else {
    const ytMatch2 = trimmed.match(/youtube\.com\/shorts\/([^&\s\?]+)/i);
    if (ytMatch2) {
      youtubeId = ytMatch2[1];
    }
  }

  if (youtubeId) {
    return {
      isEmbed: true,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`
    };
  }

  // Check if it's already an embed link or a known third-party host
  const hasEmbedPattern = (lowerUrl.includes('embed') || 
                           lowerUrl.includes('iframe') || 
                           lowerUrl.includes('player.vimeo.com') ||
                           lowerUrl.includes('sibnet.ru') || 
                           lowerUrl.includes('myvi.tv') ||
                           lowerUrl.includes('yandex.ru/video/preview') ||
                           lowerUrl.includes('rutube.ru/play/embed') ||
                           lowerUrl.includes('mover.uz/video')) &&
                           !lowerUrl.endsWith('.mp4') &&
                           !lowerUrl.endsWith('.webm');

  if (hasEmbedPattern) {
    let finalUrl = trimmed;
    if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
    return { isEmbed: true, embedUrl: finalUrl };
  }

  // Treat all other web links as direct video/stream URLs in our custom player
  return { isEmbed: false, embedUrl: '' };
}

const PUBLIC_ADS = [
  '/ANIMEM_UZ_UZS_CASINO_103.mp4',
  '/ANIMEM_UZ_UZS_CASINO_105.mp4',
  '/ANIMEM_UZ_UZS_SPORT_137.mp4',
  '/ANIMEM_UZ_UZS_SPORT_54.mp4',
  '/ANIMEM_UZ_UZS_SPORT_61.mp4',
  '/ANIMEM_UZ_UZS_SPORT_67.mp4',
  '/ANIMEM_UZ_UZS_SPORT_82.mp4',
  '/ANIMEM_UZ_UZS_UNIVERSAL_15.mp4',
];
const AD_TARGET_URL = 'https://velzom.com/323v?p=%2Fregistration%2F';

export default function VideoPlayer({ url, poster, animeTitle }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const { isEmbed, embedUrl } = getEmbedUrl(url);

  // Ad states
  const [showAd, setShowAd] = useState(true);
  const [currentAdUrl, setCurrentAdUrl] = useState('');
  const [adTimeLeft, setAdTimeLeft] = useState(15);
  const [canSkipAd, setCanSkipAd] = useState(false);
  const [isAdMuted, setIsAdMuted] = useState(false);
  const [adErrorIndex, setAdErrorIndex] = useState(0);
  const adVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize random ad when URL changes
  useEffect(() => {
    if (!url) return;
    const randomAd = PUBLIC_ADS[Math.floor(Math.random() * PUBLIC_ADS.length)];
    setCurrentAdUrl(randomAd);
    setShowAd(true);
    setAdTimeLeft(15);
    setCanSkipAd(false);
    setAdErrorIndex(0);
  }, [url]);

  // Guaranteed 1-second interval timer for 15s countdown
  useEffect(() => {
    if (!showAd) return;

    const timer = setInterval(() => {
      setAdTimeLeft((prev) => {
        if (prev <= 1) {
          setCanSkipAd(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showAd]);

  // Handle ad time update synchronized with video playback
  const handleAdTimeUpdate = () => {
    if (adVideoRef.current && adVideoRef.current.duration > 0) {
      const current = adVideoRef.current.currentTime;
      const remaining = Math.max(0, Math.ceil(15 - current));
      setAdTimeLeft((prev) => (remaining < prev ? remaining : prev));
      if (current >= 15 || remaining === 0) {
        setCanSkipAd(true);
      }
    }
  };

  // Try to play ad video automatically
  useEffect(() => {
    if (showAd && currentAdUrl && adVideoRef.current) {
      adVideoRef.current.play().catch(() => {
        if (adVideoRef.current) {
          adVideoRef.current.muted = true;
          setIsAdMuted(true);
          adVideoRef.current.play().catch(() => {});
        }
      });
    }
  }, [showAd, currentAdUrl]);

  // When ad finishes or gets skipped, start main video
  useEffect(() => {
    if (!showAd && !isEmbed && videoRef.current) {
      const isAutoplay = localStorage.getItem('anime_settings_autoplay') !== 'false';
      if (isAutoplay) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [showAd, isEmbed]);

  const handleAdClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(AD_TARGET_URL, '_blank', 'noopener,noreferrer');
  };

  const handleSkipAd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canSkipAd) return;
    setShowAd(false);
  };

  const handleAdEnded = () => {
    if (adTimeLeft > 0 && adVideoRef.current) {
      adVideoRef.current.currentTime = 0;
      adVideoRef.current.play().catch(() => {});
    } else {
      setCanSkipAd(true);
    }
  };

  const handleAdError = () => {
    console.warn("Ad video load error, switching fallback ad...");
    setAdErrorIndex((prev) => {
      const nextIdx = prev + 1;
      if (nextIdx < PUBLIC_ADS.length) {
        const nextAd = PUBLIC_ADS[(PUBLIC_ADS.indexOf(currentAdUrl) + 1) % PUBLIC_ADS.length];
        setCurrentAdUrl(nextAd);
      } else {
        // Fallback to static banner ad mode so ad overlay stays active for full 15s
        setCurrentAdUrl('');
      }
      return nextIdx;
    });
  };

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Controls UI visibility
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Progress Bar Hover/Drag states
  const [hoverLeft, setHoverLeft] = useState(0);
  const [hoverTime, setHoverTime] = useState('00:00');
  const [showHoverTime, setShowHoverTime] = useState(false);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);

  // Reset controls visibility timer
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (videoRef.current && !videoRef.current.paused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // Keyboard controls handler
  useEffect(() => {
    if (isEmbed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute('contenteditable') === 'true')) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'j':
        case 'arrowleft':
          e.preventDefault();
          skipBackward();
          break;
        case 'l':
        case 'arrowright':
          e.preventDefault();
          skipForward();
          break;
        case 'arrowup':
          e.preventDefault();
          if (videoRef.current) {
            const nv = Math.min(1, videoRef.current.volume + 0.05);
            videoRef.current.volume = nv;
            setVolume(nv);
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          if (videoRef.current) {
            const nv = Math.max(0, videoRef.current.volume - 0.05);
            videoRef.current.volume = nv;
            setVolume(nv);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, isMuted, volume, isFullscreen, isEmbed]);

  // Handle source changes, settings, and HLS support
  useEffect(() => {
    if (isEmbed) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }
    
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1);

    const video = videoRef.current;
    if (!video) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Always clear src attribute first so React/browser doesn't interfere with HLS media attachment
    video.removeAttribute('src');

    let streamUrl = (url || '').trim();
    if (window.location.protocol === 'https:' && streamUrl.startsWith('http://')) {
      streamUrl = streamUrl.replace('http://', 'https://');
    }

    const lowerUrl = streamUrl.toLowerCase();
    const isM3U8 = lowerUrl.includes('.m3u8') || lowerUrl.includes('format=m3u8') || lowerUrl.includes('/m3u8');

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 60,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        const isAutoplay = localStorage.getItem('anime_settings_autoplay') !== 'false';
        if (isAutoplay && !showAd) {
          video.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.log("Autoplay blocked:", err);
              setIsPlaying(false);
            });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS network error, attempting recovery...", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS media error, attempting recovery...", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal HLS error, destroying and falling back:", data);
              hls.destroy();
              hlsRef.current = null;
              video.src = streamUrl;
              video.load();
              break;
          }
        }
      });
    } else if (isM3U8 && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari / iOS HLS
      video.src = streamUrl;
      video.load();
      const isAutoplay = localStorage.getItem('anime_settings_autoplay') !== 'false';
      if (isAutoplay && !showAd) {
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Autoplay blocked:", err);
            setIsPlaying(false);
          });
      }
    } else {
      // Standard video direct play
      video.src = streamUrl;
      video.load();
      const isAutoplay = localStorage.getItem('anime_settings_autoplay') !== 'false';
      if (isAutoplay && !showAd) {
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Autoplay blocked:", err);
            setIsPlaying(false);
          });
      }
    }

    // sync volume & muted & speed states
    video.volume = volume;
    video.muted = isMuted;
    video.playbackRate = 1; // Start at normal speed when url changes

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, isEmbed]);

  // Click outside speed options menu to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.playback-content')) {
        setShowSpeedOptions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Fullscreen sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const isTelegram = url && (url.toLowerCase().includes('t.me') || url.toLowerCase().includes('telegram'));

  if (isTelegram) {
    return (
      <div className="w-full relative rounded-2xl overflow-hidden min-h-[320px] sm:aspect-video bg-gradient-to-br from-[#f4f7fa] to-[#e8edf4] dark:from-[#0a1120] dark:to-[#03060c] border border-gray-200 dark:border-white/5 shadow-2xl flex flex-col justify-center items-center text-center p-4 sm:p-8 md:p-12 group transition-all duration-300">
        
        {/* Glow effect in background */}
        <div className="absolute inset-0 bg-radial-gradient from-blue-500/10 via-transparent to-transparent pointer-events-none transition-transform duration-1000 group-hover:scale-110" />

        {/* Floating background dots or icons */}
        <div className="absolute top-6 left-6 w-20 h-20 sm:w-32 sm:h-32 bg-blue-500/5 rounded-full blur-2xl sm:blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-6 right-6 w-20 h-20 sm:w-32 sm:h-32 bg-pink-500/5 rounded-full blur-2xl sm:blur-3xl pointer-events-none animate-pulse delay-700" />

        <div className="max-w-md w-full relative z-10 flex flex-col items-center space-y-4 sm:space-y-6">
          {/* Circular Pulse Logo Container */}
          <div className="relative">
            {/* Pulsing ring 1 */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-1000" />
            {/* Pulsing ring 2 */}
            <div className="absolute -inset-2 sm:-inset-3 rounded-full bg-blue-400/10 animate-pulse duration-2000" />
            
            {/* Actual Icon Wrapper */}
            <div className="relative w-12 h-12 sm:w-16 md:w-20 sm:h-16 md:h-20 bg-gradient-to-tr from-blue-500 to-sky-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transform transition-transform duration-500 group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 md:w-10 text-white fill-current transform -translate-x-0.5 translate-y-0.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.34.52-.41-.01-1.21-.23-1.8-.42-.73-.24-1.32-.37-1.27-.78.02-.21.31-.43.87-.67 3.42-1.49 5.71-2.48 6.86-2.96 3.27-1.37 3.95-1.61 4.4-.1.01.03.02.05.02.08.01.12.01.25-.01.37z" />
              </svg>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2 sm:space-y-3 px-2">
            <span className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              TELEGRAM BOT
            </span>
            <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-snug">
              {animeTitle || 'Anime'} Telegram Botda!
            </h2>
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 dark:text-white/60 leading-relaxed max-w-[280px] sm:max-w-sm mx-auto">
              Ushbu qismni telegram botimiz orqali bepul, yuqori tezlikda va HD sifatda tomosha qiling!
            </p>
          </div>

          {/* CTA Action */}
          <div className="w-full pt-1 sm:pt-2 px-4">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-6 py-2.5 sm:px-8 sm:py-3.5 bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 text-white font-bold text-[11px] sm:text-xs md:text-sm rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 cursor-pointer uppercase tracking-wider w-full sm:w-auto"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current">
                <path d="M1.101,21.757L23.899,12L1.101,2.243C0.373,1.932-0.347,2.584-0.12,3.313L3,12L-0.12,20.687C-0.347,21.416,0.373,22.068,1.101,21.757z" />
              </svg>
              Telegram Botga Kirish
            </a>
            
            <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-white/30 mt-2 sm:mt-3 select-none">
              Botga o'tgandan so'ng pastdagi <strong className="text-blue-500 dark:text-blue-400 font-bold">"Start" (Boshlash)</strong> tugmasini bosing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Time formatting helper
  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '00:00';
    let seconds = Math.floor(time % 60);
    let minutes = Math.floor(time / 60) % 60;
    let hours = Math.floor(time / 3600);

    const secStr = seconds < 10 ? `0${seconds}` : seconds.toString();
    const minStr = minutes < 10 ? `0${minutes}` : minutes.toString();
    const hrStr = hours < 10 ? `0${hours}` : hours.toString();

    if (hours === 0) {
      return `${minStr}:${secStr}`;
    }
    return `${hrStr}:${minStr}:${secStr}`;
  };

  // Play Pause controls
  const togglePlay = () => {
    if (!videoRef.current || showAd) return;
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Play error:", err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Mute volume control
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume > 0 ? volume : 0.8;
    }
  };

  // Slider volume action
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    if (val === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  // Skip buttons
  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
    resetControlsTimeout();
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 5);
    resetControlsTimeout();
  };

  // Speed adjust
  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedOptions(false);
    resetControlsTimeout();
  };

  // Picture in picture
  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP not supported or error:", err);
    }
  };

  // Fullscreen trigger
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn("Fullscreen error:", err);
    }
  };

  // Timeline Seeker Interactions
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percent = offsetX / rect.width;
    const targetTime = percent * (videoRef.current.duration || 0);

    const timelineWidth = rect.width;
    let hoverPos = offsetX;
    hoverPos = hoverPos < 20 ? 20 : hoverPos > timelineWidth - 20 ? timelineWidth - 20 : hoverPos;

    setHoverLeft(hoverPos);
    setHoverTime(formatTime(targetTime));
    setShowHoverTime(true);
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingTimeline(true);
    scrub(e.clientX);
  };

  const scrub = (clientX: number) => {
    if (!timelineRef.current || !videoRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percent * (videoRef.current.duration || 0);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    if (!isDraggingTimeline) return;

    const handleMouseMove = (e: MouseEvent) => {
      scrub(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDraggingTimeline(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTimeline]);

  // Video Events Sync
  const handleTimeUpdate = () => {
    if (isDraggingTimeline) return;
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.wrapper') || target.closest('.video-controls')) return;
    togglePlay();
  };

  const handleVideoDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.wrapper') || target.closest('.video-controls')) return;
    toggleFullscreen();
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="chirag-player-root w-full flex flex-col gap-3">
      {/* Scope Style Block */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        
        .chirag-player-root {
          font-family: 'Poppins', sans-serif;
        }

        .chirag-player-root .container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          user-select: none;
          overflow: hidden;
          border-radius: 8px;
          background: #000;
          aspect-ratio: 16 / 9;
          position: relative;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
        }

        .chirag-player-root .container.fullscreen {
          max-width: 100% !important;
          width: 100% !important;
          height: 100vh !important;
          border-radius: 0px !important;
          z-index: 99999;
        }

        .chirag-player-root .wrapper {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 10;
          opacity: 0;
          bottom: -15px;
          transition: all 0.08s ease;
          padding: 0;
        }

        .chirag-player-root .container.show-controls .wrapper {
          opacity: 1;
          bottom: 0;
          transition: all 0.13s ease;
        }

        .chirag-player-root .wrapper::before {
          content: "";
          bottom: 0;
          width: 100%;
          z-index: -1;
          position: absolute;
          height: calc(100% + 45px);
          pointer-events: none;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
        }

        .chirag-player-root .video-timeline {
          height: 7px;
          width: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0 10px;
        }

        .chirag-player-root .video-timeline .progress-area {
          height: 3px;
          width: 100%;
          position: relative;
          background: rgba(255, 255, 255, 0.35);
          transition: height 0.1s ease;
        }

        .chirag-player-root .video-timeline:hover .progress-area {
          height: 5px;
        }

        .chirag-player-root .progress-area span {
          position: absolute;
          top: -28px;
          font-size: 12px;
          color: #fff;
          pointer-events: none;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.85);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.15);
          font-family: monospace;
          display: none;
        }

        .chirag-player-root .progress-area .progress-bar {
          width: 0%;
          height: 100%;
          position: relative;
          background: #2289ff;
        }

        .chirag-player-root .progress-bar::before {
          content: "";
          right: -6px;
          top: 50%;
          height: 12px;
          width: 12px;
          position: absolute;
          border-radius: 50%;
          background: #2289ff;
          transform: translateY(-50%);
          box-shadow: 0 0 5px rgba(0,0,0,0.5);
          display: none;
        }

        .chirag-player-root .video-timeline:hover .progress-bar::before,
        .chirag-player-root .video-timeline:hover .progress-area span {
          display: block;
        }

        .chirag-player-root .wrapper .video-controls {
          padding: 5px 20px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          list-style: none;
          margin: 0;
          background: transparent;
        }

        .chirag-player-root .video-controls .options {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chirag-player-root .video-controls .options.left {
          justify-content: flex-start;
          width: 35%;
        }

        .chirag-player-root .video-controls .options.center {
          justify-content: center;
          width: 30%;
        }

        .chirag-player-root .video-controls .options.right {
          justify-content: flex-end;
          width: 35%;
        }

        .chirag-player-root .options button {
          height: 40px;
          width: 40px;
          border: none;
          cursor: pointer;
          background: none;
          color: #efefef;
          border-radius: 3px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          outline: none;
        }

        .chirag-player-root .options button:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .chirag-player-root .options button:active {
          transform: scale(0.9);
        }

        .chirag-player-root .options button svg {
          width: 18px;
          height: 18px;
          transition: color 0.15s ease;
        }

        .chirag-player-root .options input {
          height: 4px;
          margin-left: 5px;
          width: 75px;
          accent-color: #0078FF;
          outline: none;
          cursor: pointer;
        }

        .chirag-player-root .options .video-timer {
          color: #efefef;
          margin-left: 15px;
          font-size: 13px;
          font-family: monospace;
          display: flex;
          align-items: center;
          user-select: none;
        }

        .chirag-player-root .video-timer .separator {
          margin: 0 4px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        .chirag-player-root .playback-content {
          display: flex;
          position: relative;
        }

        .chirag-player-root .playback-content .speed-options {
          position: absolute;
          list-style: none;
          left: -20px;
          bottom: 45px;
          width: 95px;
          overflow: hidden;
          opacity: 0;
          border-radius: 4px;
          pointer-events: none;
          background: rgba(18, 18, 18, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
          transition: opacity 0.15s ease, transform 0.15s ease;
          transform: translateY(10px);
          z-index: 100;
          padding: 4px 0;
          margin: 0;
        }

        .chirag-player-root .playback-content .speed-options.show {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .chirag-player-root .speed-options li {
          cursor: pointer;
          color: #fff;
          font-size: 13px;
          padding: 6px 14px;
          transition: all 0.15s ease;
          text-align: left;
        }

        .chirag-player-root .speed-options li:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .chirag-player-root .speed-options li.active {
          color: #fff;
          background: #0078FF;
          font-weight: 600;
        }

        .chirag-player-root container video {
          width: 100%;
          height: 100%;
          display: block;
        }

        @media screen and (max-width: 540px) {
          .chirag-player-root .wrapper .video-controls {
            padding: 3px 10px 7px;
          }
          .chirag-player-root .options input, 
          .chirag-player-root .progress-area span {
            display: none !important;
          }
          .chirag-player-root .options button {
            height: 32px;
            width: 32px;
          }
          .chirag-player-root .options button svg {
            width: 15px;
            height: 15px;
          }
          .chirag-player-root .options .video-timer {
            margin-left: 6px;
            font-size: 11px;
          }
          .chirag-player-root .video-timer .separator {
            font-size: 12px;
            margin: 0 2px;
          }
          .chirag-player-root .options .video-timer, 
          .chirag-player-root .progress-area span, 
          .chirag-player-root .speed-options li {
            font-size: 11px;
          }
          .chirag-player-root .playback-content .speed-options {
            width: 80px;
            left: -20px;
            bottom: 38px;
          }
          .chirag-player-root .speed-options li {
            padding: 4px 10px;
          }
          .chirag-player-root .right .pic-in-pic {
            display: none !important;
          }
        }
      `}</style>


      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 group">
        {isEmbed ? (
          <iframe
            src={embedUrl}
            title="Video Player"
            className="w-full h-full absolute inset-0 border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
        ) : (
          <div 
            ref={containerRef}
            className={`container ${showControls ? 'show-controls' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            <div className="wrapper">
              {/* Timeline */}
              <div 
                ref={timelineRef}
                className="video-timeline"
                onMouseMove={handleTimelineMouseMove}
                onMouseLeave={() => setShowHoverTime(false)}
                onMouseDown={handleTimelineMouseDown}
              >
                <div className="progress-area">
                  <span style={{ left: hoverLeft, display: showHoverTime ? 'block' : 'none' }}>
                    {hoverTime}
                  </span>
                  <div 
                    className="progress-bar" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Controls list */}
              <ul className="video-controls">
                <li className="options left">
                  <button className="volume" onClick={toggleMute}>
                    {isMuted || volume === 0 ? (
                      <VolumeX />
                    ) : volume < 0.5 ? (
                      <Volume1 />
                    ) : (
                      <Volume2 />
                    )}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="any"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                  />
                  <div className="video-timer">
                    <p className="current-time">{formatTime(currentTime)}</p>
                    <p className="separator"> / </p>
                    <p className="video-duration">{formatTime(duration)}</p>
                  </div>
                </li>

                <li className="options center">
                  <button className="skip-backward" onClick={skipBackward}>
                    <RotateCcw />
                  </button>
                  <button className="play-pause" onClick={togglePlay}>
                    {isPlaying ? <Pause /> : <Play className="translate-x-0.5" />}
                  </button>
                  <button className="skip-forward" onClick={skipForward}>
                    <RotateCw />
                  </button>
                </li>

                <li className="options right">
                  <div className="playback-content">
                    <button 
                      className="playback-speed"
                      onClick={() => setShowSpeedOptions(!showSpeedOptions)}
                    >
                      <Gauge />
                    </button>
                    <ul className={`speed-options ${showSpeedOptions ? 'show' : ''}`}>
                      {[2, 1.5, 1, 0.75, 0.5].map((rate) => (
                        <li 
                          key={rate}
                          data-speed={rate}
                          className={playbackRate === rate ? 'active' : ''}
                          onClick={() => changePlaybackRate(rate)}
                        >
                          {rate === 1 ? 'Normal' : `${rate}x`}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button className="pic-in-pic" onClick={togglePip}>
                    <PictureInPicture />
                  </button>
                  <button className="fullscreen" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize /> : <Maximize />}
                  </button>
                </li>
              </ul>
            </div>

            {/* Video Tag */}
            <video 
              ref={videoRef}
              poster={poster}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
              onClick={handleVideoClick}
              onDoubleClick={handleVideoDoubleClick}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setIsPlaying(true);
              }}
              onPause={() => setIsPlaying(false)}
              onPlay={() => {
                if (showAd && videoRef.current) {
                  videoRef.current.pause();
                  setIsPlaying(false);
                } else {
                  setIsPlaying(true);
                }
              }}
              onError={(e) => {
                console.error("Video element error:", e);
                setIsBuffering(false);
              }}
            />

            {/* Loading/Buffering feedback */}
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Video Pre-roll Ad Overlay */}
        {showAd && (
          <div 
            className="absolute inset-0 z-50 bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none"
            onClick={handleAdClick}
          >
            {currentAdUrl ? (
              <video
                ref={adVideoRef}
                src={currentAdUrl}
                autoPlay
                muted={isAdMuted}
                playsInline
                className="w-full h-full object-contain pointer-events-none"
                onEnded={handleAdEnded}
                onError={handleAdError}
                onTimeUpdate={handleAdTimeUpdate}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-purple-900/40 via-black to-blue-900/40 w-full h-full pointer-events-none">
                <img src="/logo.png" alt="Animem Uz" className="w-24 h-24 mb-4 object-contain animate-pulse" />
                <p className="text-white font-bold text-lg mb-2">Animem.uz Homiylik Reklamasi</p>
                <p className="text-gray-300 text-sm max-w-md">Eng yaxshi animelar va so'nggi chiqishlarni biz bilan tomosha qiling!</p>
              </div>
            )}

            {/* Top Left Reklama Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/70 text-white text-[11px] sm:text-xs px-2.5 py-1 rounded backdrop-blur border border-white/10 flex items-center gap-1.5 pointer-events-none z-10">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="font-semibold tracking-wider">REKLAMA</span>
            </div>

            {/* Top Right Mute / Unmute Button */}
            {currentAdUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAdMuted((prev) => !prev);
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur border border-white/10 z-20 cursor-pointer pointer-events-auto transition-all"
                title={isAdMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
              >
                {isAdMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
              </button>
            )}

            {/* Skip / Timer Button */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20">
              {canSkipAd ? (
                <button
                  type="button"
                  onClick={handleSkipAd}
                  className="opacity-100 scale-100 bg-[#ff006a] hover:bg-[#e0005d] active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg shadow-2xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer pointer-events-auto"
                >
                  <span>O'tkazib yuborish</span>
                  <span className="text-base">→</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="opacity-50 scale-90 bg-black/60 text-gray-300 text-xs px-3 py-1.5 rounded-md border border-white/10 backdrop-blur cursor-not-allowed flex items-center gap-1.5 transition-all pointer-events-none"
                >
                  <span>O'tkazib yuborish ({adTimeLeft}s)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
