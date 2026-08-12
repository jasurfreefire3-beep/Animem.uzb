import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anime, toSlug } from '../types';
import { Star, PlayCircle, Calendar, Play, Clock, Grid, MessageSquare, ChevronLeft, ChevronRight, TrendingUp, Info, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AnimeCard from '../components/AnimeCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  useEffect(() => {
    document.title = "Animem Uz - O'zbekistondagi eng yirik anime portali";
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      let retries = 3;
      let delay = 1000;

      while (retries > 0) {
        try {
          const animeRes = await fetch(`${API_BASE}/api/animes`);
          if (!animeRes.ok) {
            throw new Error(`HTTP error ${animeRes.status}`);
          }
          const animeType = animeRes.headers.get("content-type");
          if (animeType && animeType.includes("application/json")) {
            const animeData = await animeRes.json();
            setAnimes(animeData);
          }
          setLoading(false);

          const commentsRes = await fetch(`${API_BASE}/api/comments/recent`);
          if (commentsRes.ok) {
            const commentsType = commentsRes.headers.get("content-type");
            if (commentsType && commentsType.includes("application/json")) {
              const commentsData = await commentsRes.json();
              setRecentComments(commentsData);
            }
          }
          setLoadingComments(false);
          return; // Exit on successful fetch
        } catch (err) {
          retries--;
          console.warn(`Fetch home data failed. Retries remaining: ${retries}`, err);
          if (retries === 0) {
            console.error("Error loading homepage data after retries:", err);
            setLoading(false);
            setLoadingComments(false);
          } else {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
          }
        }
      }
    };
    fetchHomeData();
  }, []);

  const bannerAnimes = animes.filter(a => a.is_banner);

  useEffect(() => {
    if (bannerAnimes.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % bannerAnimes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerAnimes.length]);

  const newAnimes = [...animes].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 10);
  const mostViewedAnimes = [...animes].sort((a, b) => (b.korishlar || 0) - (a.korishlar || 0)).slice(0, 10);
  const mostRatedAnimes = [...animes].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);

  if (loading) {
     return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,0,106,0.5)]" />
        </div>
     );
  }

  const featuredAnime = bannerAnimes[bannerIndex] || bannerAnimes[0];

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
      <AnimatePresence mode="wait">
        {featuredAnime && (
          <motion.div 
            key={featuredAnime.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative w-full rounded-lg overflow-hidden border border-white/10 bg-[#09090b] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            {/* Background Blurred Image */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img loading="eager" fetchPriority="high" decoding="async" 
                src={featuredAnime.banner_url || featuredAnime.image_url} 
                alt={featuredAnime.title} 
                title={featuredAnime.title}
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
                  {featuredAnime.tavsiya === 1 && (
                    <span className="px-3 py-1 bg-[#ff006a] text-white text-[11px] font-black uppercase tracking-widest rounded-sm shadow-md">
                      TAVSIYA
                    </span>
                  )}
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
                  to={user ? `/anime/${toSlug(featuredAnime.title)}` : '/register'}
                  className="bg-[#ff006a] hover:bg-[#d40058] text-white px-6 py-3 rounded-sm font-black flex items-center gap-2 shadow-lg shadow-[#ff006a]/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current text-white" /> 
                  TOMOSHA QILISH
                </Link>
                <Link 
                  to={user ? `/anime/${toSlug(featuredAnime.title)}` : '/register'}
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
                <img loading="eager" fetchPriority="high" decoding="async" 
                  src={featuredAnime.image_url} 
                  alt={featuredAnime.title} 
                  title={featuredAnime.title}
                  className="w-full h-full object-cover" 
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Layout */}
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Left Column (Main) */}
        <div className="flex-1 space-y-12 min-w-0">
          
          {/* Yangi qo'shilganlar */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#ff006a]" />
                Yangi qo'shilganlar
              </h2>
              <Link to="/animelar" className="text-xs font-medium text-white/50 hover:text-[#ff006a] transition-colors">Barchasini ko'rish</Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {newAnimes.map((anime, idx) => (
                <motion.div
                  key={`new-${anime.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <AnimeCard anime={anime} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Eng ko'p ko'rilganlar */}
          <section>
            <div className="flex items-center justify-between mb-4 mt-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#ff006a]" />
                Eng ko'p ko'rilganlar
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mostViewedAnimes.map((anime, idx) => (
                <motion.div
                  key={`viewed-${anime.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <AnimeCard anime={anime} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Eng ko'p baholanganlar */}
          <section>
            <div className="flex items-center justify-between mb-4 mt-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-[#ff006a]" />
                Eng ko'p baholanganlar
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mostRatedAnimes.map((anime, idx) => (
                <motion.div
                  key={`rated-${anime.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <AnimeCard anime={anime} />
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-6">
          
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
                 recentComments.map((c, i) => {
                   const avatarSrc = c.user_avatar || c.avatar_url;
                   return (
                     <Link 
                       to={`/anime/${toSlug(c.anime_title)}`}
                       key={i} 
                       className="block group bg-[#000] p-3 rounded-sm border border-[#222] hover:border-[#ff006a]/30 transition-colors"
                     >
                       <div className="flex items-center gap-2 mb-2">
                          {avatarSrc ? (
                            <img loading="lazy" decoding="async"
                              src={avatarSrc}
                              alt={c.user_name}
                              className="w-5 h-5 rounded-full object-cover border border-[#ff006a]/30 shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded bg-[#333] flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0">
                              {(c.user_name || 'U').charAt(0)}
                            </div>
                          )}
                          <span className="text-white/50 text-[11px] font-medium">{c.user_name}</span>
                       </div>
                       <div>
                         <p className="text-white/80 text-xs leading-relaxed group-hover:text-white transition-colors line-clamp-2">{c.content}</p>
                         <span className="text-[#ff006a]/70 text-[10px] uppercase font-bold mt-2 block">{c.anime_title}</span>
                       </div>
                     </Link>
                   );
                 })
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
