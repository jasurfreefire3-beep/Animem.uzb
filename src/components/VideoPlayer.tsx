import React, { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

// Custom HLS Loader that proxies all manifest and fragment requests while preserving original base URLs
class CustomHlsLoader extends (Hls.DefaultConfig.loader as any) {
  load(context: any, config: any, callbacks: any) {
    const originalUrl = context ? context.url : '';
    let requestUrl = originalUrl;

    if (requestUrl.startsWith('//')) {
      requestUrl = 'https:' + requestUrl;
    }

    if (requestUrl.startsWith('http://') || requestUrl.startsWith('https://')) {
      try {
        const u = new URL(requestUrl);
        if (u.origin !== window.location.origin && !requestUrl.includes('/api/proxy-video')) {
          requestUrl = `/api/proxy-video?url=${encodeURIComponent(requestUrl)}`;
        }
      } catch (e) {}
    }

    const modifiedContext = { ...context, url: requestUrl };

    const modifiedCallbacks = {
      ...callbacks,
      onSuccess: (response: any, stats: any, contextParam: any, networkDetails: any) => {
        if (response) {
          response.url = originalUrl;
        }
        if (contextParam) {
          contextParam.url = originalUrl;
        }
        if (callbacks && callbacks.onSuccess) {
          callbacks.onSuccess(response, stats, contextParam, networkDetails);
        }
      }
    };

    super.load(modifiedContext, config, modifiedCallbacks);
  }
}

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

  // OK.ru video link: ok.ru/video/123456789 -> ok.ru/videoembed/123456789
  const okMatch = trimmed.match(/ok\.ru\/(?:video|videoembed)\/(\d+)/i);
  if (okMatch && okMatch[1]) {
    return {
      isEmbed: true,
      embedUrl: `https://ok.ru/videoembed/${okMatch[1]}`
    };
  }

  // Mover.uz video link: mover.uz/watch/XXXX -> mover.uz/video/embed/XXXX
  const moverMatch = trimmed.match(/mover\.uz\/(?:watch|video\/embed|video)\/([A-Za-z0-9_-]+)/i);
  if (moverMatch && moverMatch[1]) {
    const cleanId = moverMatch[1].replace(/\.mp4$/i, '');
    return {
      isEmbed: true,
      embedUrl: `https://mover.uz/video/embed/${cleanId}`
    };
  }

  // VK.com video link: vk.com/video-12345_67890 -> vk.com/video_ext.php?oid=-12345&id=67890
  const vkMatch = trimmed.match(/vk\.com\/video(-?\d+)_(\d+)/i);
  if (vkMatch && vkMatch[1] && vkMatch[2]) {
    return {
      isEmbed: true,
      embedUrl: `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}`
    };
  }

  // Rutube video link: rutube.ru/video/123456789 -> rutube.ru/play/embed/123456789
  const rutubeMatch = trimmed.match(/rutube\.ru\/(?:video|play\/embed)\/([A-Za-z0-9_-]+)/i);
  if (rutubeMatch && rutubeMatch[1]) {
    return {
      isEmbed: true,
      embedUrl: `https://rutube.ru/play/embed/${rutubeMatch[1]}`
    };
  }

  // Vimeo video link: vimeo.com/123456789
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      isEmbed: true,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
    };
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
    'ok.ru',
    'vk.com',
    'yandex.ru/video/preview',
    'rutube.ru',
    'drive.google.com',
    'kodik.',
    'allplay.uz/embed',
    'mover.uz'
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

  // Ensure MyBird.io Video Overlay AD Code is initialized for VideoPlayer
  useEffect(() => {
    const scriptId = 'mybird-video-overlay-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://js.mbidadm.com/static/scripts.js';
      script.setAttribute('data-admpid', '450955');
      script.async = true;
      document.body.appendChild(script);
    }
  }, [url]);

  const rawVideoUrl = url || '/assets/sample/video.mp4';
  const effectiveUrl = (useProxy && rawVideoUrl.startsWith('http'))
    ? `/api/proxy-video?url=${encodeURIComponent(rawVideoUrl)}`
    : rawVideoUrl;

  const isHls = rawVideoUrl.toLowerCase().includes('m3u8') || 
                effectiveUrl.toLowerCase().includes('m3u8') || 
                rawVideoUrl.toLowerCase().includes('/hls/') ||
                /\/(hls|m3u8|stream)\b/i.test(rawVideoUrl);

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
              if (artInstance.hls) {
                try {
                  artInstance.hls.destroy();
                } catch (e) {}
              }
              const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                capLevelToPlayerSize: false,
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                maxBufferSize: 128 * 1024 * 1024, // 128MB buffer for 1080p/4K streams
                loader: CustomHlsLoader as any,
                fLoader: CustomHlsLoader as any,
                pLoader: CustomHlsLoader as any,
              });

              // Load from original raw URL so HLS.js base URL resolution computes correct target paths,
              // while CustomHlsLoader routes each request through proxy-video
              hls.loadSource(rawVideoUrl);
              hls.attachMedia(video);
              artInstance.hls = hls;

              // Setup quality selector menu for any resolution (144p, 360p, 480p, 720p, 1080p, 1440p, 4K)
              hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                if (data.levels && data.levels.length > 0) {
                  const levels = data.levels;
                  const qualityOptions = levels.map((level: any, index: number) => {
                    let resName = '';
                    if (level.height) {
                      if (level.height >= 2160) resName = `${level.height}p (4K)`;
                      else if (level.height >= 1440) resName = `${level.height}p (2K)`;
                      else if (level.height >= 1080) resName = `${level.height}p (FHD)`;
                      else if (level.height >= 720) resName = `${level.height}p (HD)`;
                      else resName = `${level.height}p`;
                    } else {
                      resName = level.name || `Sifat ${index + 1}`;
                    }

                    return {
                      default: index === hls.currentLevel,
                      html: resName,
                      value: index,
                    };
                  });

                  if (levels.length > 1) {
                    qualityOptions.unshift({
                      default: true,
                      html: 'Avto',
                      value: -1,
                    });

                    if (artInstance.setting) {
                      try {
                        artInstance.setting.add({
                          html: 'Sifat (Px)',
                          name: 'quality',
                          tooltip: 'Avto',
                          selector: qualityOptions,
                          onSelect: (item: any) => {
                            hls.currentLevel = item.value;
                            return item.html;
                          },
                        });
                      } catch (e) {}
                    }
                  }
                }
              });

              // Update quality tooltip when auto level switches
              hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                if (hls.autoLevelEnabled && hls.levels && hls.levels[data.level]) {
                  const currentLevel = hls.levels[data.level];
                  if (currentLevel && artInstance.setting) {
                    const resName = currentLevel.height ? `Avto (${currentLevel.height}p)` : 'Avto';
                    try {
                      artInstance.setting.update({
                        name: 'quality',
                        tooltip: resName,
                      });
                    } catch (e) {}
                  }
                }
              });

              let retryCount = 0;
              hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      retryCount++;
                      if (retryCount <= 3) {
                        console.warn(`[HLS] Network error, retrying (${retryCount}/3)...`);
                        hls.startLoad();
                      } else {
                        setHasError(true);
                      }
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      console.warn('[HLS] Media error, attempting recovery...');
                      hls.recoverMediaError();
                      break;
                    default:
                      console.error('[HLS] Fatal unrecoverable error:', data);
                      setHasError(true);
                      break;
                  }
                }
              });

              artInstance.on('destroy', () => {
                try {
                  hls.destroy();
                } catch (e) {}
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
            } else {
              if (artInstance.notice) {
                artInstance.notice.show = "HLS video formatini brauzer qo'llab-quvvatlamadi";
              }
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
                <div className="flex justify-center">
                  <button
                    onClick={() => { setHasError(false); setUseProxy(!useProxy); }}
                    className="px-5 py-2.5 bg-[#ff006a] hover:bg-[#e0005d] text-white text-xs font-semibold rounded-lg transition shadow-lg cursor-pointer active:scale-95"
                  >
                    Qayta yuklash
                  </button>
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

