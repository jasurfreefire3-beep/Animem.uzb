import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anime, toSlug } from '../types';
import { Clock, Star, Play, PlayCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function YangiChiqishlar() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const API_BASE = '';
        const res = await fetch(`${API_BASE}/api/animes`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setAnimes(sorted);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching animes:", err);
        setLoading(false);
      }
    };
    fetchNewReleases();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff006a]/5 blur-3xl rounded-full pointer-events-none" />
        <h1 className="text-2xl font-bold uppercase tracking-wide flex items-center gap-3">
          <Clock className="w-6 h-6 text-[#ff006a]" /> Yangi Chiqishlar (New Releases)
        </h1>
        <p className="text-white/50 text-xs mt-1">Platformaga so'nggi yuklangan va yangilangan anime qismlari feed-i</p>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {animes.map((anime, idx) => (
          <motion.div
            key={anime.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.02 }}
            className="group relative"
          >
            <Link to={`/anime/${toSlug(anime.title)}`} className="block">
              <div className="relative aspect-[3/4] overflow-hidden mb-2 rounded-sm bg-[#111] border border-[#222]">
                <img
                  src={anime.image_url}
                  alt={anime.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Visual hover overlays */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-11 h-11 bg-[#ff006a] rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_15px_rgba(255,0,106,0.5)]">
                    <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute bottom-2 left-2 bg-[#ff006a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                  EP {anime.qismlar_soni || 12}
                </div>
                
                <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 border border-white/5">
                  <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                  {Number(anime.rating || 8.5).toFixed(1)}
                </div>

                {/* Newly Added tag */}
                <div className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                  Yangi
                </div>
              </div>

              {/* Title & metadata */}
              <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#ff006a] transition-colors">
                {anime.title}
              </h3>
              <div className="flex justify-between items-center text-[10px] text-white/40 mt-1 font-mono">
                <span>TV Series</span>
                <span>{anime.yil || '2026'}</span>
              </div>
            </Link>
          </motion.div>
        ))}

        {animes.length === 0 && (
          <div className="col-span-full text-center py-12 text-white/40 text-sm">
            Hech qanday yangi chiqishlar topilmadi.
          </div>
        )}
      </div>
    </div>
  );
}
