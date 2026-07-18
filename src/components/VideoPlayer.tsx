import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
}

function getEmbedUrl(url: string): { isEmbed: boolean; embedUrl: string } {
  if (!url) return { isEmbed: false, embedUrl: '' };

  const trimmed = url.trim();

  // If it is an HTML iframe tag, extract the src URL
  if (trimmed.toLowerCase().includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      return { isEmbed: true, embedUrl: srcMatch[1] };
    }
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
  const lowerUrl = trimmed.toLowerCase();
  const hasEmbedPattern = lowerUrl.includes('embed') || 
                           lowerUrl.includes('iframe') || 
                           lowerUrl.includes('player.vimeo.com') ||
                           lowerUrl.includes('sibnet.ru') || 
                           lowerUrl.includes('myvi.tv') ||
                           lowerUrl.includes('yandex.ru/video/preview') ||
                           lowerUrl.includes('rutube.ru/play/embed') ||
                           lowerUrl.includes('mover.uz/video');

  if (hasEmbedPattern) {
    return { isEmbed: true, embedUrl: trimmed };
  }

  // Check if it has a direct video extension
  const hasVideoExtension = lowerUrl.endsWith('.mp4') || 
                            lowerUrl.endsWith('.m3u8') || 
                            lowerUrl.endsWith('.webm') || 
                            lowerUrl.endsWith('.ogg') || 
                            lowerUrl.endsWith('.mov') ||
                            lowerUrl.includes('.mp4?') ||
                            lowerUrl.includes('.m3u8?') ||
                            lowerUrl.includes('.webm?');

  if (!hasVideoExtension) {
    // Treat other web links as player embed/iframes
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { isEmbed: true, embedUrl: trimmed };
    }
  }

  return { isEmbed: false, embedUrl: '' };
}

export default function VideoPlayer({ url, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isEmbed, embedUrl } = getEmbedUrl(url);

  // Use capital-letter variables with 'as any' to bypass TypeScript JSX constraints safely 
  // without overriding the global IntrinsicElements namespace.
  const VideoPlayerElement = 'video-player' as any;
  const VideoSkinElement = 'video-skin' as any;

  useEffect(() => {
    // Autoplay if enabled in settings
    const isAutoplay = localStorage.getItem('anime_settings_autoplay') !== 'false';
    if (!isEmbed && isAutoplay && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Catch and ignore the interrupted play() warning or auto-play restriction
          console.log("Autoplay check:", err.message || err);
        });
      }
    }
  }, [url, isEmbed]);

  if (isEmbed) {
    return (
      <div className="w-full h-full min-h-[300px] md:min-h-[450px] lg:min-h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 relative">
        <iframe
          src={embedUrl}
          title="Video Player"
          className="w-full h-full absolute inset-0"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[450px] lg:min-h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 flex items-center justify-center relative">
      <VideoPlayerElement class="w-full h-full block" className="w-full h-full block">
        <VideoSkinElement class="w-full h-full block media-default-skin media-default-skin--video" className="w-full h-full block media-default-skin media-default-skin--video">
          <video 
            ref={videoRef}
            src={url} 
            poster={poster} 
            playsInline 
            controls
            className="w-full h-full object-contain"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </VideoSkinElement>
      </VideoPlayerElement>
    </div>
  );
}
