import { useEffect, useId, useRef, useState } from 'react';
import './VideoPlayer.css';

declare global {
  interface Window {
    Playerjs?: new (options: Record<string, unknown>) => {
      api?: (command: string, value?: unknown) => unknown;
    };
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
      return { isEmbed: true, embedUrl: srcMatch[1].startsWith('//') ? `https:${srcMatch[1]}` : srcMatch[1] };
    }
  }

  const embedTransforms: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/ok\.ru\/(?:video|videoembed)\/(\d+)/i, match => `https://ok.ru/videoembed/${match[1]}`],
    [/mover\.uz\/(?:watch|video\/embed|video)\/([A-Za-z0-9_-]+)/i, match => `https://mover.uz/video/embed/${match[1].replace(/\.mp4$/i, '')}`],
    [/vk\.com\/video(-?\d+)_(\d+)/i, match => `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}`],
    [/rutube\.ru\/(?:video|play\/embed)\/([A-Za-z0-9_-]+)/i, match => `https://rutube.ru/play/embed/${match[1]}`],
    [/vimeo\.com\/(?:video\/)?(\d+)/i, match => `https://player.vimeo.com/video/${match[1]}`],
  ];

  for (const [pattern, makeUrl] of embedTransforms) {
    const match = trimmed.match(pattern);
    if (match) return { isEmbed: true, embedUrl: makeUrl(match) };
  }

  const youtubeMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([^&\s?]+)/i);
  if (youtubeMatch) {
    return { isEmbed: true, embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=0&rel=0` };
  }

  const embedHosts = ['player.vimeo.com', 'sibnet.ru', 'myvi.tv', 'myvi.ru', 'ok.ru', 'vk.com', 'yandex.ru/video/preview', 'rutube.ru', 'drive.google.com', 'kodik.', 'allplay.uz/embed', 'mover.uz'];
  if (embedHosts.some(host => lowerUrl.includes(host)) || lowerUrl.includes('/embed/') || lowerUrl.includes('/video/embed/')) {
    return { isEmbed: true, embedUrl: trimmed.startsWith('//') ? `https:${trimmed}` : trimmed };
  }

  return { isEmbed: false, embedUrl: '' };
}

function loadPlayerJs(): Promise<void> {
  if (window.Playerjs) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-animem-playerjs]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('PlayerJS yuklanmadi')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}playerjs.js`;
    script.async = true;
    script.dataset.animemPlayerjs = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('PlayerJS yuklanmadi'));
    document.head.appendChild(script);
  });
}

export default function VideoPlayer({ url, poster, animeTitle }: VideoPlayerProps) {
  const reactId = useId();
  const playerId = useRef(`animem-player-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`).current;
  const playerRef = useRef<{ api?: (command: string, value?: unknown) => unknown } | null>(null);
  const [hasError, setHasError] = useState(false);
  const { isEmbed, embedUrl } = parseEmbedUrl(url);
  const source = url || '/assets/sample/video.mp4';

  useEffect(() => {
    if (isEmbed) return;

    let isCurrent = true;
    setHasError(false);

    loadPlayerJs()
      .then(() => {
        if (!isCurrent || !window.Playerjs) return;
        const container = document.getElementById(playerId);
        if (!container) return;

        container.replaceChildren();
        playerRef.current = new window.Playerjs({
          id: playerId,
          file: source,
          poster: poster || '',
          title: animeTitle || 'Animem.uz',
          autoplay: 0,
          loop: 0,
          volume: 80,
          theme: '#ff006a',
        });
      })
      .catch(() => isCurrent && setHasError(true));

    return () => {
      isCurrent = false;
      try {
        playerRef.current?.api?.('stop');
      } catch {
        // PlayerJS may already be disposed while changing an episode.
      }
      playerRef.current = null;
    };
  }, [animeTitle, isEmbed, playerId, poster, source]);

  return (
    <div className="animem-player-shell group">
      <div className="animem-player-stage">
        {isEmbed ? (
          <iframe
            src={embedUrl}
            title={animeTitle || 'Video Player'}
            className="animem-player-embed"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div id={playerId} className="animem-player-instance" />
        )}

        {hasError && (
          <div className="animem-player-error">
            <strong>Player yuklanmadi</strong>
            <span>Internet aloqasini tekshirib, sahifani qayta yuklang.</span>
            <button type="button" onClick={() => window.location.reload()}>Qayta yuklash</button>
          </div>
        )}
      </div>

      <div className="animem-player-footer"><span>{isEmbed ? 'Tashqi player orqali tomosha qilinmoqda' : 'Sifat va tezlik player sozlamalarida'}</span></div>
    </div>
  );
}
