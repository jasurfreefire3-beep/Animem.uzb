import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../types';
import { Star, PlayCircle, Calendar, Play, Clock, Grid, MessageSquare, ChevronLeft, ChevronRight, TrendingUp, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    fetch('/api/animes')
      .then((res) => res.json())
      .then((data) => {
        setAnimes(data);
        setLoading(false);
      });

    fetch('/api/comments/recent')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentComments(data);
        }
        setLoadingComments(false);
      })
      .catch((err) => {
        console.error("Error fetching comments:", err);
        setLoadingComments(false);
      });
  }, []);

  const popularAnimes = animes.slice(0, 4);
  const recentAnimes = animes.slice(0, 8);
  const updateList = animes.slice(0, 10);

  if (loading) {
     return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,0,106,0.5)]" />
        </div>
     );
  }

  const featuredAnime = popularAnimes[0];

  const renderTitle = (title: string) => {
    const upper = title.toUpperCase();
    if (upper.includes(':')) {
      const idx = upper.indexOf(':');
      const first = upper.slice(0, idx + 1);
      const rest = upper.slice(idx + 1);
      return (
        <>
          <span className="text-white">{first}</span>
          <span className="text-[#ff006a]">{rest}</span>
        </>
      );
    } else {
      const words = upper.split(' ');
      if (words.length > 1) {
        return (
          <>
            <span className="text-white">{words[0]} </span>
            <span className="text-[#ff006a]">{words.slice(1).join(' ')}</span>
          </>
        );
      }
      return <span className="text-white">{upper}</span>;
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Featured Hero Banner */}
      {featuredAnime && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full rounded-lg overflow-hidden border border-white/10 bg-[#09090b] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        >
          {/* Background Blurred Image */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img 
              src={featuredAnime.banner_url || featuredAnime.image_url} 
              alt={featuredAnime.title} 
              className="w-full h-full object-cover scale-105 blur-[3px] opacity-40 md:opacity-30 transition-all duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/60 to-transparent" />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-6 sm:p-8 md:p-12">
            {/* Left Content */}
            <div className="md:col-span-8 space-y-6">
              {/* Row 1: Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-[#ff006a] text-white text-[11px] font-black uppercase tracking-widest rounded-sm shadow-md">
                  TAVSIYA
                </span>
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-white">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                  <span>{featuredAnime.rating || '4.9'}</span>
                  <span className="text-white/30">|</span>
                  <span className="text-white/70 uppercase">ANIME</span>
                </div>
              </div>

              {/* Row 2: Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-none uppercase tracking-tight text-white max-w-3xl font-sans">
                {renderTitle(featuredAnime.title)}
              </h1>

              {/* Row 3: Meta metadata */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-white/70">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#ff006a]" />
                  <span>{featuredAnime.yil || '2024'}</span>
                </div>
                {featuredAnime.studiyasi && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#ff006a]" />
                    <span className="uppercase tracking-wider">{featuredAnime.studiyasi}</span>
                  </div>
                )}
                <span className="px-2.5 py-0.5 bg-white/10 rounded-sm text-[10px] font-black uppercase tracking-wide border border-white/5">
                  {featuredAnime.holati || 'TUGALLANGAN'}
                </span>
                <span className="text-[#ff006a] font-black text-[10px] tracking-wider uppercase">
                  TARJIMA
                </span>
              </div>

              {/* Row 4: Thick Left Border Description */}
              <div className="border-l-[3.5px] border-[#ff006a] pl-4 py-1.5">
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-2xl italic font-medium line-clamp-3">
                  {featuredAnime.description}
                </p>
              </div>

              {/* Row 5: Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link 
                  to={`/anime/${featuredAnime.id}`}
                  className="bg-[#ff006a] hover:bg-[#d40058] text-white px-6 py-3 rounded-sm font-black flex items-center gap-2 shadow-lg shadow-[#ff006a]/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current text-white" /> 
                  TOMOSHA QILISH
                </Link>
                <Link 
                  to={`/anime/${featuredAnime.id}`}
                  className="bg-black/40 hover:bg-black/60 border border-white/10 text-white px-6 py-3 rounded-sm font-bold flex items-center gap-2 transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Info className="w-4 h-4" /> 
                  MA'LUMOT
                </Link>
              </div>
            </div>

            {/* Right Side: Large Rounded Poster */}
            <div className="hidden md:flex md:col-span-4 justify-center">
              <motion.div 
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-56 lg:w-64 aspect-[3/4] rounded-lg overflow-hidden border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] bg-black"
              >
                <img 
                  src={featuredAnime.image_url} 
                  alt={featuredAnime.title} 
                  className="w-full h-full object-cover" 
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column (Main) */}
        <div className="flex-1 space-y-12 min-w-0">
          
          {/* Trending Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#ff006a]" />
                Trending Now
              </h2>
              <Link to="/animelar" className="text-xs font-medium text-white/50 hover:text-[#ff006a] transition-colors">Barchasini ko'rish</Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {recentAnimes.map((anime, idx) => (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link to={`/anime/${anime.id}`} className="group block relative">
                    <div className="relative aspect-[3/4] overflow-hidden mb-2 rounded-sm bg-[#111]">
                      <img 
                        src={anime.image_url} 
                        alt={anime.title} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 bg-[#ff006a] rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_15px_rgba(255,0,106,0.5)]">
                          <Play className="w-5 h-5 text-white fill-current ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-[#ff006a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow">
                        EP {anime.qismlar_soni || 12}
                      </div>
                      <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                        {anime.rating?.toFixed(1) || '8.5'}
                      </div>
                    </div>
                    <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-[#ff006a] transition-colors">
                      {anime.title}
                    </h3>
                    <p className="text-white/40 text-[11px] truncate">TV Series • {anime.yil || '2026'}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Just Updated */}
          <section>
            <div className="flex items-center justify-between mb-4 mt-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-white/50" />
                Just Updated
              </h2>
            </div>
            <div className="bg-[#111111] border border-[#222] rounded-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {updateList.map((anime, idx) => (
                  <Link 
                    to={`/anime/${anime.id}`} 
                    key={anime.id} 
                    className="flex items-center gap-3 p-2 rounded hover:bg-[#222] transition-colors group"
                  >
                    <div className="w-12 h-16 rounded-sm overflow-hidden shrink-0 bg-[#000]">
                      <img src={anime.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm truncate group-hover:text-[#ff006a] transition-colors">
                        {anime.title}
                      </h4>
                      <p className="text-white/40 text-[11px] mt-0.5 truncate">Episode {anime.qismlar_soni || 1}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-6">
          
          {/* Community Chat Preview */}
          <div className="bg-[#111] border border-[#222] rounded-sm p-4">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
              <MessageSquare className="w-4 h-4 text-white/50"/> Eng So'nggi Fikrlar
            </h3>
            <div className="space-y-4">
               {loadingComments ? (
                 [
                   { anime_title: 'Yuklanmoqda...', user_name: 'tizim', content: 'Yuklanmoqda...', anime_id: '' }
                 ].map((c, i) => (
                   <div key={i} className="block bg-[#000] p-3 rounded-sm border border-[#222] opacity-50">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded bg-[#333] flex items-center justify-center text-[9px] font-bold text-white uppercase">
                          L
                        </div>
                        <span className="text-white/30 text-[11px] font-medium">Yuklanmoqda...</span>
                     </div>
                   </div>
                 ))
               ) : recentComments.length === 0 ? (
                 <div className="text-center py-8 text-white/40 text-xs border border-[#222] bg-black/20 rounded-sm">
                   Fikrlar hozircha yo'q
                 </div>
               ) : (
                 recentComments.map((c, i) => (
                   <Link 
                     to={`/anime/${c.anime_id}`} 
                     key={i} 
                     className="block group bg-[#000] p-3 rounded-sm border border-[#222] hover:border-[#ff006a]/30 transition-colors"
                   >
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded bg-[#333] flex items-center justify-center text-[9px] font-bold text-white uppercase">
                          {(c.user_name || 'U').charAt(0)}
                        </div>
                        <span className="text-white/50 text-[11px] font-medium">{c.user_name}</span>
                     </div>
                     <div>
                       <p className="text-white/80 text-xs leading-relaxed group-hover:text-white transition-colors line-clamp-2">{c.content}</p>
                       <span className="text-[#ff006a]/70 text-[10px] uppercase font-bold mt-2 block">{c.anime_title}</span>
                     </div>
                   </Link>
                 ))
               )}
            </div>
            <Link to="/chat" className="mt-4 block w-full py-2.5 text-center text-xs font-bold text-white bg-[#222] hover:bg-[#333] rounded-sm transition-colors">
              Chatga qo'shilish
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
