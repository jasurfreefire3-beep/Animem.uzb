import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Film, BookOpen, Search, User, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Anime, toSlug } from '../types';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allAnimes, setAllAnimes] = useState<Anime[]>([]);

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const res = await fetch('/api/animes');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAllAnimes(data);
          }
        }
      } catch (err) {}
    };
    fetchAnimes();
  }, []);

  const searchResults = searchQuery.trim()
    ? allAnimes.filter(a => {
        const q = searchQuery.trim().toLowerCase();
        return (
          (a.title || '').toLowerCase().includes(q) ||
          (a.janrlar || '').toLowerCase().includes(q) ||
          (a.tags || '').toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchModal(false);
      navigate(`/animelar?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    {
      id: 'home',
      label: 'Bosh sahifa',
      path: '/',
      icon: Home,
      isActive: location.pathname === '/'
    },
    {
      id: 'animelar',
      label: 'Animelar',
      path: '/animelar',
      icon: Film,
      isActive: location.pathname.startsWith('/animelar') || location.pathname.startsWith('/anime/')
    },
    {
      id: 'mangalar',
      label: 'Mangalar',
      path: '/manga',
      icon: BookOpen,
      isActive: location.pathname.startsWith('/manga')
    },
    {
      id: 'qidiruv',
      label: 'Qidiruv',
      icon: Search,
      isAction: true,
      onClick: () => setShowSearchModal(true),
      isActive: showSearchModal
    },
    {
      id: 'profil',
      label: 'Profil',
      path: user ? '/profil' : '/login',
      icon: User,
      isActive: location.pathname === '/profil' || location.pathname === '/login' || location.pathname === '/register'
    }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#09090b]/95 backdrop-blur-xl border-t border-[#1c1c20] px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            const content = (
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 select-none ${
                  active ? 'text-[#ff006a]' : 'text-white/45 hover:text-white/80'
                }`}
              >
                {/* Active Neon Background Indicator */}
                {active && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute inset-0 bg-gradient-to-t from-[#ff006a]/20 via-[#ff006a]/10 to-transparent rounded-xl border-t-2 border-[#ff006a]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <div className="relative">
                    <Icon size={20} className={active ? 'drop-shadow-[0_0_8px_rgba(255,0,106,0.8)] stroke-[2.5]' : 'stroke-[1.8]'} />
                    {active && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#ff006a] rounded-full shadow-[0_0_6px_#ff006a]" />
                    )}
                  </div>
                  <span className={`text-[10px] tracking-tight font-bold ${active ? 'text-white' : 'text-white/50'}`}>
                    {item.label}
                  </span>
                </div>
              </motion.div>
            );

            if (item.isAction) {
              return (
                <button key={item.id} onClick={item.onClick} className="focus:outline-none">
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.id} to={item.path!}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Animated Search Full-screen Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#09090b]/98 backdrop-blur-2xl flex flex-col md:hidden p-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[#222]">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Anime, manga yoki janr qidiring..."
                  className="w-full bg-[#121215] border border-[#ff006a]/50 text-white text-sm rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-[#ff006a] focus:ring-1 focus:ring-[#ff006a] transition-all font-bold placeholder:text-white/30"
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff006a]" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </form>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="p-2 bg-[#18181c] border border-[#333] text-white rounded-xl font-bold text-xs hover:bg-[#222] transition-colors shrink-0"
              >
                Yopish
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
              {searchQuery.trim() ? (
                searchResults.length === 0 ? (
                  <div className="text-center py-12 text-white/40 text-sm">
                    "{searchQuery}" bo'yicha hech narsa topilmadi
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {searchResults.map((anime) => (
                      <Link
                        key={anime.id}
                        to={`/anime/${toSlug(anime.title)}`}
                        onClick={() => setShowSearchModal(false)}
                        className="flex items-center gap-3 p-2.5 bg-[#121215] border border-[#222] rounded-xl hover:border-[#ff006a]/50 transition-all active:scale-[0.98]"
                      >
                        <img
                          src={anime.image_url}
                          alt={anime.title}
                          className="w-12 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-xs truncate">{anime.title}</h4>
                          <p className="text-[11px] text-white/50 truncate mt-0.5">{anime.janrlar}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {anime.rating && (
                              <span className="flex items-center gap-0.5 text-yellow-400 font-bold text-[10px]">
                                <Star size={10} className="fill-current" /> {Number(anime.rating).toFixed(1)}
                              </span>
                            )}
                            <span className="text-[10px] text-[#ff006a] font-bold uppercase">{anime.holati}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full py-3 bg-[#ff006a] text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center shadow-lg shadow-[#ff006a]/20 active:scale-95 transition-all mt-2"
                    >
                      Barcha natijalarni ko'rish →
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-4 pt-2">
                  <p className="text-xs font-bold uppercase text-white/40 tracking-wider">Ommabop qidiruvlar</p>
                  <div className="flex flex-wrap gap-2">
                    {['Solo Leveling', 'Jujutsu Kaisen', 'Naruto', 'Demon Slayer', 'Attack on Titan', 'One Piece'].map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="px-3 py-1.5 bg-[#18181c] border border-[#2a2a30] text-white/80 hover:text-white hover:border-[#ff006a] rounded-lg text-xs font-semibold transition-all active:scale-95"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
