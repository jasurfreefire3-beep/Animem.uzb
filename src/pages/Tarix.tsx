import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anime, toSlug } from '../types';
import { History, Trash2, Calendar, Star, Play, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface HistoryItem {
  animeId: string;
  viewedAt: string;
  lastEpisode?: number;
}

export default function Tarix() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${API_BASE}/api/animes`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const animeData = await res.json();
          setAnimes(animeData);
        }

        const savedHistory = localStorage.getItem('anime_history');
        if (savedHistory) {
          setHistoryItems(JSON.parse(savedHistory));
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [user]);

  const clearHistory = async () => {
    try {
      localStorage.removeItem('anime_history');
      setHistoryItems([]);
    } catch (e) {
      console.error(e);
    }
  };

  const removeHistoryItem = async (animeId: string | number) => {
    try {
      const updated = historyItems.filter(item => String(item.animeId) !== String(animeId));
      setHistoryItems(updated);
      localStorage.setItem('anime_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Find corresponding anime records for history items
  const historyList = historyItems
    .map(hist => {
      const anime = animes.find(a => String(a.id) === String(hist.animeId));
      if (!anime) return null;
      return {
        ...anime,
        viewedAt: hist.viewedAt,
        lastEpisode: hist.lastEpisode || 1,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    // Sort recently viewed first
    .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide flex items-center gap-3">
            <History className="w-6 h-6 text-[#ff006a]" /> Ko'rish Tarixi (History)
          </h1>
          <p className="text-white/50 text-xs mt-1">Siz yaqinda tomosha qilgan va ko'rib chiqqan animelar ro'yxati</p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={clearHistory}
            className="bg-[#222] hover:bg-red-950/20 hover:text-red-400 border border-[#333] hover:border-red-900/30 text-white/70 font-bold text-xs px-4 py-2 rounded-sm transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            <Trash2 size={14} /> Tarixni tozalash
          </button>
        )}
      </div>

      {/* History Items */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {historyList.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.02 }}
              className="bg-[#111] border border-[#222] p-4 rounded-sm flex items-center justify-between hover:border-[#ff006a]/30 transition-colors group"
            >
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                {/* Thumbnail */}
                <Link to={`/anime/${toSlug(item.title)}`} title={item.title} className="w-12 h-16 bg-[#000] rounded-sm overflow-hidden border border-[#222] shrink-0 block">
                  <img loading="lazy" decoding="async" 
                    src={item.image_url} 
                    alt={item.title} 
                    title={item.title} 
                    className="w-full h-full object-cover" 
                  />
                </Link>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <Link to={`/anime/${toSlug(item.title)}`} className="text-white font-bold text-sm hover:text-[#ff006a] transition-colors truncate block">
                    {item.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/40 mt-1 font-mono">
                    <span className="text-[#ff006a]">Oxirgi ko'rilgan: {item.lastEpisode}-qism</span>
                    <span>•</span>
                    <span>{new Date(item.viewedAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 ml-4 shrink-0">
                <button
                  onClick={() => removeHistoryItem(item.id)}
                  className="p-2 bg-transparent text-white/30 hover:text-red-400 rounded-sm hover:bg-[#222] transition-colors"
                  title="Tarixdan o'chirish"
                >
                  <Trash2 size={14} />
                </button>
                <Link
                  to={`/anime/${toSlug(item.title)}`}
                  className="bg-[#ff006a] hover:bg-[#d40058] text-white font-bold text-xs px-4 py-2.5 rounded-sm transition-colors flex items-center gap-1.5"
                >
                  <Play size={11} className="fill-current" /> Davom ettirish
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {historyList.length === 0 && (
          <div className="text-center py-20 bg-[#111] border border-[#222] rounded-sm space-y-4">
            <History className="w-12 h-12 text-white/20 mx-auto" />
            <h3 className="text-base font-bold text-white">Ko'rish tarixi bo'sh</h3>
            <p className="text-white/40 text-xs max-w-xs mx-auto">Siz yaqinda tomosha qilgan hech qanday anime topilmadi. Seanslaringiz shu yerda saqlanadi.</p>
            <Link
              to="/"
              className="inline-block bg-[#ff006a] hover:bg-[#d40058] text-white text-xs font-bold px-5 py-2.5 rounded-sm transition-colors"
            >
              Bosh sahifaga qaytish
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
