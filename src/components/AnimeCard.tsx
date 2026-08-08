import { Link } from 'react-router-dom';
import { Anime, toSlug } from '../types';
import { Star, Play, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AnimeCardProps {
  anime: Anime;
  showBadge?: string; // Optional badge e.g. "Yangi", "TOP 1"
}

export default function AnimeCard({ anime, showBadge }: AnimeCardProps) {
  const { user } = useAuth();
  const episodeCount = Number(anime.qismlar_soni) || 1;
  const isMultiEpisode = episodeCount >= 2;
  const targetPath = user ? `/anime/${toSlug(anime.title)}` : '/register';
  const targetUrl = `https://animem.uz/anime/${toSlug(anime.title)}`;

  return (
    <Link
      to={targetPath}
      title={`${anime.title} - O'zbek tilida ko'rish`}
      className="group relative block"
    >
      {/* Outer container with padding if multi-episode so stacked layers don't overflow layout */}
      <div className={`relative ${isMultiEpisode ? 'pt-1 pr-1.5' : ''}`}>
        
        {/* Layer 2 (Bottom layer behind) */}
        {isMultiEpisode && (
          <div className="absolute inset-0 aspect-[3/4] rounded-sm bg-[#18181b] border border-white/10 shadow-md transform translate-x-2.5 -translate-y-1.5 -rotate-2 overflow-hidden pointer-events-none opacity-50 group-hover:translate-x-3 group-hover:-translate-y-2 group-hover:-rotate-3 transition-transform duration-300">
            <img
              src={anime.image_url}
              alt={`${anime.title} - ${targetUrl}`}
              title={`${anime.title} - Animem.uz`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover opacity-40 blur-[0.5px]"
            />
          </div>
        )}

        {/* Layer 1 (Middle layer behind) */}
        {isMultiEpisode && (
          <div className="absolute inset-0 aspect-[3/4] rounded-sm bg-[#27272a] border border-white/20 shadow-md transform translate-x-1.5 -translate-y-0.5 rotate-1 overflow-hidden pointer-events-none opacity-80 group-hover:translate-x-2 group-hover:-translate-y-1 group-hover:rotate-2 transition-transform duration-300">
            <img
              src={anime.image_url}
              alt={`${anime.title} - ${targetUrl}`}
              title={`${anime.title} - Animem.uz`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover opacity-65"
            />
          </div>
        )}

        {/* Top/Main Poster Card */}
        <div className="relative aspect-[3/4] overflow-hidden mb-2 rounded-sm bg-[#111] border border-[#222] z-10 shadow-xl">
          <img
            src={anime.image_url}
            alt={`${anime.title} - ${targetUrl}`}
            title={`${anime.title} - Animem.uz`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />

          {/* Hover Play Button Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-11 h-11 bg-[#ff006a] rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_15px_rgba(255,0,106,0.5)]">
              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
            </div>
          </div>

          {/* Episode Count Badge */}
          <div className="absolute bottom-2 left-2 bg-[#ff006a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow">
            {isMultiEpisode ? `EP ${episodeCount}` : 'FILM / 1 QISM'}
          </div>

          {/* Rating Badge */}
          {anime.rating && (
            <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 border border-white/10 shadow backdrop-blur-xs">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
              {Number(anime.rating).toFixed(1)}
            </div>
          )}

          {/* Custom Tag Badge if provided */}
          {showBadge && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm shadow">
              {showBadge}
            </div>
          )}
        </div>
      </div>

      {/* Anime Title */}
      <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#ff006a] transition-colors mt-0.5">
        {anime.title}
      </h3>

      {/* Footer metadata */}
      <div className="flex justify-between items-center text-[10px] text-white/40 mt-1 font-mono">
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-[#ff006a]/85" /> {anime.korishlar || 0}
        </span>
        <span>{anime.yil || 'Noma\'lum'}</span>
      </div>
    </Link>
  );
}
