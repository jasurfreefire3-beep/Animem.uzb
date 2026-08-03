import React, { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  animeTitle?: string;
}

function parseEmbedUrl(rawUrl: string): { isEmbed: boolean; embedUrl: string } {
  if (!rawUrl) return { isEmbed: false, embedUrl: '' };

  const trimmed = rawUrl.trim();
  const lowerUrl = trimmed.toLowerCase();

  if (lowerUrl.includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      let finalUrl = srcMatch[1];
      if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
      return { isEmbed: true, embedUrl: finalUrl };
    }
  }

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
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`
    };
  }

  const embedHosts = [
    'player.vimeo.com',
    'sibnet.ru',
    'myvi.tv',
    'myvi.ru',
    'ok.ru/videoembed',
    'vk.com/video_ext',
    'yandex.ru/video/preview',
    'rutube.ru/play/embed',
    'drive.google.com',
    'kodik.',
    'allplay.uz/embed'
  ];

  if (embedHosts.some(host => lowerUrl.includes(host)) || lowerUrl.includes('/embed/') || lowerUrl.includes('/video/embed/')) {
    let finalUrl = trimmed;
    if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
    return { isEmbed: true, embedUrl: finalUrl };
  }

  return { isEmbed: false, embedUrl: '' };
}

export default function VideoPlayer({ url, poster, animeTitle }: VideoPlayerProps) {
  const artRef = useRef<HTMLDivElement>(null);
  const artInstanceRef = useRef<Artplayer | null>(null);

  const [useProxy, setUseProxy] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { isEmbed, embedUrl } = parseEmbedUrl(url);

  // Reset proxy and error states when URL prop changes
  useEffect(() => {
    setUseProxy(false);
    setHasError(false);
  }, [url]);

  const rawVideoUrl = url || '/assets/sample/video.mp4';
  const effectiveUrl = (useProxy && rawVideoUrl.startsWith('http'))
    ? `/api/proxy-video?url=${encodeURIComponent(rawVideoUrl)}`
    : rawVideoUrl;

  const isHls = effectiveUrl.toLowerCase().includes('.m3u8');

  // Initialize ArtPlayer for native media files
  useEffect(() => {
    if (isEmbed || !artRef.current) return;

    if (artInstanceRef.current) {
      try {
        artInstanceRef.current.destroy(false);
      } catch (e) {}
      artInstanceRef.current = null;
    }

    let art: Artplayer | null = null;

    try {
      art = new Artplayer({
        container: artRef.current,
        url: effectiveUrl,
        poster: poster || '',
        type: isHls ? 'm3u8' : 'mp4',
        volume: 0.8,
        isLive: false,
        muted: false,
        autoplay: false,
        pip: false,
        autoSize: false,
        autoMini: false,
        screenshot: false,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        fullscreenWeb: false,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        airplay: true,
        moreVideoAttr: {
          playsInline: true,
        },
        theme: '#ff006a',
        lang: 'uz',
        customType: {
          m3u8: function (video: HTMLVideoElement, url: string, artInstance: any) {
            if (Hls.isSupported()) {
              if (artInstance.hls) artInstance.hls.destroy();
              const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
              });
              hls.loadSource(url);
              hls.attachMedia(video);
              artInstance.hls = hls;

              hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                  if (!useProxy && rawVideoUrl.startsWith('http')) {
                    setUseProxy(true);
                  } else {
                    setHasError(true);
                  }
                }
              });

              artInstance.on('destroy', () => hls.destroy());
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
            }
          },
        },
      });

      artInstanceRef.current = art;

      art.on('error', (err) => {
        console.warn("Artplayer error event caught:", err);
        if (!useProxy && rawVideoUrl.startsWith('http')) {
          console.warn("Trying video proxy...");
          setUseProxy(true);
        } else {
          setHasError(true);
        }
      });
    } catch (e) {
      console.error("Artplayer initialization error caught:", e);
      if (!useProxy && rawVideoUrl.startsWith('http')) {
        setUseProxy(true);
      } else {
        setHasError(true);
      }
    }

    return () => {
      if (artInstanceRef.current) {
        try {
          artInstanceRef.current.destroy(false);
        } catch (e) {}
        artInstanceRef.current = null;
      }
    };
  }, [effectiveUrl, isEmbed, poster, isHls, useProxy, rawVideoUrl]);

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-none sm:rounded-2xl overflow-hidden shadow-2xl bg-[#0a0a0c] border-y sm:border border-white/10 group select-none">
      
      {/* Title bar */}
      {animeTitle && (
        <div className="bg-[#121214] px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs text-white/80">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#ff006a] animate-pulse shrink-0" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px] truncate">
              {animeTitle}
            </span>
          </div>
          <span className="text-[10px] text-white/40 uppercase font-semibold">
            {isEmbed ? 'Embed Player' : 'Animem Player'}
          </span>
        </div>
      )}

      {/* Main Video Display Area */}
      <div className="relative w-full aspect-video min-h-[190px] xs:min-h-[220px] sm:min-h-[360px] md:min-h-[480px] bg-black flex items-center justify-center overflow-hidden">
        {isEmbed ? (
          <iframe
            src={embedUrl}
            title={animeTitle || 'Video Player'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full relative bg-black">
            <div ref={artRef} className="artplayer-app absolute inset-0 w-full h-full" />
            {hasError && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-20">
                <p className="text-white font-semibold text-sm mb-2">Videoni yuklashda muammo yuz berdi</p>
                <p className="text-xs text-white/60 max-w-md mb-4">Video manbasi yoki proxy javob bermadi.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => { setHasError(false); setUseProxy(!useProxy); }}
                    className="px-4 py-2 bg-[#ff006a] hover:bg-[#e0005d] text-white text-xs font-semibold rounded-lg transition shadow-lg"
                  >
                    Qayta yuklash
                  </button>
                  {rawVideoUrl.startsWith('http') && (
                    <a
                      href={rawVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
                    >
                      To'g'ridan-to'g me'yoriy manzilda ochish
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Artplayer Mobile Styles */}
      <style>{`
        .artplayer-app .art-controls {
          padding: 0 8px !important;
        }
        @media (max-width: 640px) {
          .artplayer-app .art-controls {
            padding: 0 4px !important;
            height: 42px !important;
          }
          .artplayer-app .art-control {
            padding: 0 3px !important;
            margin: 0 !important;
          }
          .artplayer-app .art-control-time {
            font-size: 11px !important;
            padding: 0 4px !important;
          }
          .artplayer-app .art-control-volume {
            padding: 0 2px !important;
          }
          .artplayer-app .art-control-pip,
          .artplayer-app .art-control-screenshot {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

