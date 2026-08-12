import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anime, toSlug } from '../types';
import { Heart, Grid, Star, Play, Archive, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Sevimlilar() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'barchasi' | 'animelar' | 'qismlar'>('barchasi');
  const { user } = useAuth();

  useEffect(() => {
    const fetchFavoritesData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${API_BASE}/api/animes`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const animeData = await res.json();
          setAnimes(animeData);
        }

        const savedFavs = localStorage.getItem('anime_favorites');
        if (savedFavs) {
          setFavoriteIds(JSON.parse(savedFavs));
        }
      } catch (err) {
        console.error("Error loading favorites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritesData();
  }, [user]);

  const handleUnfavorite = async (id: string | number) => {
    try {
      const updated = favoriteIds.filter((favId) => String(favId) !== String(id));
      setFavoriteIds(updated);
      localStorage.setItem('anime_favorites', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const favoriteAnimes = animes.filter((anime) => 
    favoriteIds.some(favId => String(favId) === String(anime.id))
  );

  // For high-fidelity visual tab simulation
  const filteredFavorites = favoriteAnimes.filter((anime) => {
    if (activeTab === 'animelar') {
      return anime.qismlar_soni > 1; // simulation
    }
    if (activeTab === 'qismlar') {
      return anime.qismlar_soni <= 1; // single episode movies
    }
    return true; // barchasi
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6 relative overflow-hidden">
        <h1 className="text-2xl font-bold uppercase tracking-wide flex items-center gap-3">
          <Heart className="w-6 h-6 text-[#ff006a] fill-current" /> Sevimlilar (Favorites)
        </h1>
        <p className="text-white/50 text-xs mt-1">Sizga yoqqan va kuzatib borayotgan barcha animelar ro'yxati</p>
      </div>

      {/* Tabs */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-1.5 flex space-x-1">
        {(['barchasi', 'animelar', 'qismlar'] as const).map((tab) => {
          const labels = { barchasi: 'Barchasi', animelar: 'Animelar', qismlar: 'Qismlar / Filmlar' };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-sm text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-[#ff006a] text-white shadow-[0_0_10px_rgba(255,0,106,0.3)]' 
                  : 'text-white/50 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Favorites List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredFavorites.map((anime, idx) => (
            <motion.div
              key={anime.id}
              layout
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ delay: idx * 0.02 }}
              className="bg-[#111] border border-[#222] p-4 rounded-sm flex items-center justify-between hover:border-[#ff006a]/30 transition-colors group"
            >
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                {/* Poster Thumbnail */}
                <Link to={`/anime/${toSlug(anime.title)}`} title={anime.title} className="w-12 h-16 bg-[#000] rounded-sm overflow-hidden border border-[#222] shrink-0 block">
                  <img loading="lazy" decoding="async" 
                    src={anime.image_url} 
                    alt={anime.title} 
                    title={anime.title} 
                    className="w-full h-full object-cover" 
                  />
                </Link>

                {/* Info details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/anime/${toSlug(anime.title)}`} className="text-white font-bold text-sm hover:text-[#ff006a] transition-colors truncate block">
                      {anime.title}
                    </Link>
                    {anime.rating && (
                      <span className="flex items-center gap-0.5 text-yellow-400 font-black text-[10px] px-1 bg-[#222] rounded-sm">
                        <Star className="w-2.5 h-2.5 fill-current" /> {Number(anime.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-[11px] font-mono mt-1">
                    {anime.qismlar_soni || 12}-qismgacha yuklangan • {anime.yil || '2026'}
                  </p>
                </div>
              </div>

              {/* Heart and View Controls */}
              <div className="flex items-center space-x-3 ml-4">
                <button
                  onClick={() => handleUnfavorite(anime.id)}
                  className="p-2.5 bg-[#ff006a]/10 border border-[#ff006a]/30 text-[#ff006a] hover:bg-red-900/10 rounded-sm transition-colors"
                  title="Sevimlilardan o'chirish"
                >
                  <Heart size={16} className="fill-current" />
                </button>
                <Link
                  to={`/anime/${toSlug(anime.title)}`}
                  className="bg-[#222] hover:bg-[#333] border border-[#333] text-white font-bold text-xs px-4 py-2.5 rounded-sm transition-colors"
                >
                  Tomosha qilish
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredFavorites.length === 0 && (
          <div className="text-center py-20 bg-[#111] border border-[#222] rounded-sm space-y-4">
            <Archive className="w-12 h-12 text-white/20 mx-auto" />
            <h3 className="text-base font-bold text-white">Hech narsa topilmadi</h3>
            <p className="text-white/40 text-xs max-w-xs mx-auto">Sevimlilar ro'yxatingizda hozircha birorta ham anime mavjud emas. Sevimli animelaringiz yonidagi yurakcha tugmasini bosing!</p>
            <Link
              to="/animelar"
              className="inline-block bg-[#ff006a] hover:bg-[#d40058] text-white text-xs font-bold px-5 py-2.5 rounded-sm transition-colors"
            >
              Katalogni ko'rish
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
