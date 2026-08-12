import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anime, toSlug } from '../types';
import { Star, Award, Eye, Play } from 'lucide-react';
import { motion } from 'motion/react';

export default function Top100() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopAnimes = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${API_BASE}/api/animes`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          const sorted = [...data].sort((a, b) => (b.rating || 0) - (a.rating || 0));
          setAnimes(sorted);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching animes:", err);
        setLoading(false);
      }
    };
    fetchTopAnimes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff006a]/5 blur-3xl rounded-full pointer-events-none" />
        <h1 className="text-2xl font-bold uppercase tracking-wide flex items-center gap-3">
          <Award className="w-6 h-6 text-[#ff006a]" /> Top 100 Animelar
        </h1>
        <p className="text-white/50 text-xs mt-1">Foydalanuvchilar baholashlari va ko'rishlar asosida reyting</p>
      </div>

      {/* Top 3 Featured Bento Row */}
      {animes.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {animes.slice(0, 3).map((anime, index) => {
            const rank = index + 1;
            const colors = [
              'border-[#ffd700]/30 shadow-[0_0_20px_rgba(255,215,0,0.1)]', // Gold
              'border-[#c0c0c0]/30 shadow-[0_0_20px_rgba(192,192,192,0.1)]', // Silver
              'border-[#cd7f32]/30 shadow-[0_0_20px_rgba(205,127,50,0.1)]', // Bronze
            ];
            const textColors = ['text-[#ffd700]', 'text-[#c0c0c0]', 'text-[#cd7f32]'];
            
            return (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-[#111] border rounded-sm p-4 relative flex flex-col justify-between overflow-hidden group ${colors[index]}`}
              >
                {/* Large Rank Background Number */}
                <div className={`absolute -right-2 -bottom-8 text-9xl font-black opacity-10 select-none pointer-events-none font-mono ${textColors[index]}`}>
                  {rank}
                </div>

                <div className="flex gap-4">
                  {/* Poster */}
                  <Link to={`/anime/${toSlug(anime.title)}`} title={anime.title} className="w-20 h-28 bg-[#000] rounded-sm overflow-hidden border border-[#222] shrink-0 relative block">
                    <img loading="lazy" decoding="async" 
                      src={anime.image_url} 
                      alt={anime.title} 
                      title={anime.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black bg-black/80 border ${textColors[index]}`}>
                      {rank}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#ff006a] uppercase tracking-widest block mb-1">
                      {rank === 1 ? 'OLTIN REYTING' : rank === 2 ? 'KUMUSH REYTING' : 'BRONZA REYTING'}
                    </span>
                    <Link to={`/anime/${toSlug(anime.title)}`} className="text-white font-bold text-sm hover:text-[#ff006a] transition-colors line-clamp-2">
                      {anime.title}
                    </Link>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                      <span className="text-white text-xs font-bold">{Number(anime.rating || 9.5).toFixed(1)}</span>
                      <span className="text-white/30 text-[10px]">({anime.rating_count || 120} ovoz)</span>
                    </div>
                    <div className="text-[10px] text-white/40 font-mono mt-1">
                      STUDIYA: {anime.studiyasi || 'Mappa'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222] flex items-center justify-between z-10">
                  <span className="text-white/40 text-[11px] font-mono">Series • {anime.yil || '2024'}</span>
                  <Link
                    to={`/anime/${toSlug(anime.title)}`}
                    className="bg-[#ff006a] hover:bg-[#d40058] text-white text-xs font-bold px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1"
                  >
                    <Play size={10} className="fill-current" /> Watch Now
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Ranks 4 to 100 List */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-4 space-y-2">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest px-2 mb-4">
          Qolgan Reyting O'rinlari
        </h3>

        {animes.slice(3).map((anime, index) => {
          const rank = index + 4;
          return (
            <motion.div
              key={anime.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.3) }}
              className="flex items-center justify-between p-2.5 rounded-sm bg-[#000] border border-[#111] hover:border-[#ff006a]/20 hover:bg-[#111]/30 transition-all group"
            >
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                {/* Rank Number */}
                <span className="w-8 text-center text-sm font-mono font-black text-white/30 group-hover:text-[#ff006a] transition-colors">
                  #{rank}
                </span>

                {/* Thumbnail */}
                <Link to={`/anime/${toSlug(anime.title)}`} title={anime.title} className="w-9 h-12 rounded-sm overflow-hidden border border-[#222] shrink-0 block">
                  <img loading="lazy" decoding="async" 
                    src={anime.image_url} 
                    alt={anime.title} 
                    title={anime.title} 
                    className="w-full h-full object-cover" 
                  />
                </Link>

                {/* Title */}
                <div className="min-w-0 flex-1">
                  <Link to={`/anime/${toSlug(anime.title)}`} className="text-white text-sm font-bold truncate hover:text-[#ff006a] transition-colors block">
                    {anime.title}
                  </Link>
                  <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono mt-0.5">
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-400 fill-current" /> {Number(anime.rating || 8.2).toFixed(1)}</span>
                    <span>•</span>
                    <span>{anime.yil || '2025'}</span>
                    <span>•</span>
                    <span>{anime.qismlar_soni || 12} ta qism</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="ml-4 shrink-0">
                <Link
                  to={`/anime/${toSlug(anime.title)}`}
                  className="bg-[#222] hover:bg-[#333] border border-[#333] text-white font-bold text-xs px-3.5 py-1.5 rounded-sm transition-colors"
                >
                  Ko'rish
                </Link>
              </div>
            </motion.div>
          );
        })}

        {animes.length === 0 && (
          <div className="text-center py-12 text-white/40 text-sm">
            Hozircha reyting ma'lumotlari yuklanmadi.
          </div>
        )}
      </div>
    </div>
  );
}
