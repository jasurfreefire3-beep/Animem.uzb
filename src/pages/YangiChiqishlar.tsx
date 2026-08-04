import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anime, toSlug } from '../types';
import { Clock, Star, Play, PlayCircle, Calendar, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import AnimeCard from '../components/AnimeCard';

export default function YangiChiqishlar() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
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
          >
            <AnimeCard anime={anime} showBadge="Yangi" />
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
