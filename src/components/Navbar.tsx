import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Notification, Anime, toSlug } from '../types';
import { Search, LogOut, User, Bell, Menu, PlusCircle, Heart, Settings, X, Shield, Star, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logoImg from '../logo.png';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allAnimes, setAllAnimes] = useState<Anime[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [lastReadId, setLastReadId] = useState<number>(() => {
    return Number(localStorage.getItem('last_read_notif_id') || '0');
  });

  const notifCount = notifications.filter(n => Number(n.id) > lastReadId).length;
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Fetch notifications & animes on mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchNotifications = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${API_BASE}/api/notifications`, { signal: controller.signal });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json") && isMounted) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Ignore transient fetch errors
        }
      }
    };

    const fetchAnimes = async () => {
      try {
        const res = await fetch('/api/animes', { signal: controller.signal });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAllAnimes(data);
          }
        }
      } catch (err) {}
    };

    fetchNotifications();
    fetchAnimes();

    const interval = setInterval(fetchNotifications, 15000);
    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, []);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
  }, [searchParams]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live search results
  const searchResults = useMemo(() => {
    if (!searchValue.trim()) return [];
    const q = searchValue.trim().toLowerCase();
    return allAnimes.filter(anime => {
      const title = (anime.title || '').toLowerCase();
      const janrlar = (anime.janrlar || '').toLowerCase();
      const tags = (anime.tags || '').toLowerCase();
      const desc = (anime.description || '').toLowerCase();
      return title.includes(q) || janrlar.includes(q) || tags.includes(q) || desc.includes(q);
    });
  }, [searchValue, allAnimes]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchFocused(false);
    setShowMobileSearch(false);
    if (searchValue.trim()) {
      navigate(`/animelar?search=${encodeURIComponent(searchValue.trim())}`);
    } else {
      navigate('/animelar');
    }
  };

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
    navigate('/');
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 md:h-16 bg-[#09090b]/95 backdrop-blur-md border-b border-[#1a1a1c] z-30 px-2 min-[400px]:px-4 md:px-8 flex items-center justify-between text-white select-none">
      
      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-0 top-0 bg-[#09090b] px-4 py-3 flex flex-col gap-2 z-40 border-b border-[#222] shadow-2xl sm:hidden"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowMobileSearch(false)}
                className="p-1.5 text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <input
                  type="text"
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Anime nomini yozing..."
                  className="w-full bg-[#111113] border border-[#ff006a]/40 text-white text-xs rounded-sm pl-4 pr-10 py-2.5 focus:outline-none focus:border-[#ff006a] transition-all placeholder:text-white/30 font-bold"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff006a] hover:text-white transition-colors">
                  <Search size={16} />
                </button>
              </form>
            </div>

            {/* Mobile Live Results */}
            {searchValue.trim() && (
              <div className="bg-[#111113] border border-[#222] rounded-sm max-h-72 overflow-y-auto divide-y divide-[#1a1a1c] mt-1">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-white/40 flex items-center justify-center gap-2">
                    <Film size={14} />
                    <span>Hech narsa topilmadi</span>
                  </div>
                ) : (
                  <>
                    {searchResults.slice(0, 5).map((anime) => (
                      <Link
                        key={anime.id}
                        to={`/anime/${toSlug(anime.title)}`}
                        onClick={() => {
                          setShowMobileSearch(false);
                          setIsSearchFocused(false);
                        }}
                        className="p-2 flex items-center gap-3 hover:bg-[#1a1a1c] transition-colors"
                      >
                        <img
                          src={anime.image_url}
                          alt={anime.title}
                          className="w-9 h-12 object-cover rounded-sm border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{anime.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                            {anime.rating && (
                              <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                                <Star size={10} className="fill-current" /> {Number(anime.rating).toFixed(1)}
                              </span>
                            )}
                            <span>{anime.yil || ''}</span>
                            <span className="text-[#ff006a] uppercase text-[9px] font-semibold">{anime.holati || ''}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full p-2.5 text-center text-xs font-bold text-[#ff006a] hover:bg-[#ff006a]/10 transition-colors bg-[#09090b]"
                    >
                      Barcha {searchResults.length} ta natijani ko'rish →
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left side: Hamburger (Mobile) + Logo/Search (Desktop) */}
      <div className="flex items-center space-x-1.5 min-[400px]:space-x-3 md:space-x-4 flex-1 min-w-0">
        {/* Hamburger Trigger for Mobile Sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 -ml-1 text-white/70 hover:text-white hover:bg-[#1a1a1a] rounded-sm transition-colors md:hidden shrink-0"
        >
          <Menu size={18} />
        </button>

        {/* Mobile Brand Name */}
        <Link to="/" className="flex items-center md:hidden shrink-0">
          <img 
            src={logoImg} 
            alt="AnimeUz" 
            className="h-[40px] min-[400px]:h-[48px] w-auto object-contain" 
          />
        </Link>

        {/* Search Bar Input (Desktop) */}
        <div className="relative max-w-md w-full hidden sm:block" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchValue}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder="Anime qidirish..."
              className="w-full bg-[#111113] border border-[#1a1a1c] text-white text-xs rounded-sm pl-4 pr-10 py-2.5 focus:outline-none focus:border-[#ff006a] transition-all placeholder:text-white/30 font-bold"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#ff006a] transition-colors">
              <Search size={14} />
            </button>
          </form>

          {/* Desktop Live Autocomplete Dropdown */}
          <AnimatePresence>
            {isSearchFocused && searchValue.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 right-0 top-full mt-1.5 bg-[#111113] border border-[#222] rounded-sm shadow-2xl overflow-hidden z-50 divide-y divide-[#1a1a1c]"
              >
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-white/40 flex items-center justify-center gap-2">
                    <Film size={14} />
                    <span>"{searchValue}" bo'yicha anime topilmadi</span>
                  </div>
                ) : (
                  <>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#1a1a1c] custom-scrollbar">
                      {searchResults.slice(0, 6).map((anime) => (
                        <Link
                          key={anime.id}
                          to={`/anime/${toSlug(anime.title)}`}
                          onClick={() => setIsSearchFocused(false)}
                          className="p-2.5 flex items-center gap-3 hover:bg-[#1a1a1c] transition-colors group"
                        >
                          <img
                            src={anime.image_url}
                            alt={anime.title}
                            className="w-10 h-13 object-cover rounded-sm border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-[#ff006a] transition-colors truncate">
                              {anime.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1">
                              {anime.rating && (
                                <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                                  <Star size={10} className="fill-current" /> {Number(anime.rating).toFixed(1)}
                                </span>
                              )}
                              <span>{anime.yil || ''}</span>
                              <span className="text-[#ff006a] uppercase text-[9px] font-semibold">{anime.holati || ''}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full p-2.5 text-center text-xs font-bold text-[#ff006a] hover:bg-[#ff006a]/10 transition-colors bg-[#0c0c0e] block"
                    >
                      Barcha {searchResults.length} ta natijani ko'rish →
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center space-x-1 min-[400px]:space-x-2 md:space-x-4 shrink-0">
        
        {/* Mobile Search Icon */}
        <button 
          onClick={() => setShowMobileSearch(true)} 
          className="p-1.5 text-white/60 hover:text-white transition-colors sm:hidden"
        >
          <Search size={16} />
        </button>

        {/* Donat Quick Button */}
        <Link
          to="/donat"
          className="flex items-center gap-1.5 bg-[#ff006a]/15 hover:bg-[#ff006a] text-[#ff006a] hover:text-white border border-[#ff006a]/30 px-2.5 py-1.5 rounded-sm text-[11px] font-bold transition-all shadow-[0_0_10px_rgba(255,0,106,0.15)] uppercase tracking-wider shrink-0"
          title="Loyiha rivojiga donat qilish"
        >
          <Heart size={13} className="fill-current animate-pulse" />
          <span className="hidden sm:inline">Donat</span>
        </Link>

        {/* Upload/Add Anime Quick-link (Admins or generic) */}
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="p-2 text-white/60 hover:text-[#ff006a] hover:bg-[#111] rounded-sm transition-all"
            title="Katalog boshqaruvi"
          >
            <PlusCircle size={18} />
          </Link>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              const nextShow = !showNotifications;
              setShowNotifications(nextShow);
              if (nextShow && notifications.length > 0) {
                const highestId = Math.max(...notifications.map(n => Number(n.id)));
                setLastReadId(highestId);
                localStorage.setItem('last_read_notif_id', String(highestId));
              }
            }}
            className="p-1.5 sm:p-2 text-white/60 hover:text-white hover:bg-[#111] rounded-sm transition-all relative"
          >
            <Bell size={16} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#ff006a] rounded-full text-[9px] flex items-center justify-center font-bold text-white ring-2 ring-[#09090b]">
                {notifCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed sm:absolute top-16 sm:top-auto right-2 sm:right-0 left-2 sm:left-auto mt-1 sm:mt-3 w-auto sm:w-80 bg-[#111113] border border-[#1a1a1c] rounded-sm shadow-2xl overflow-hidden text-sm z-50"
              >
                <div className="p-3 border-b border-[#222] bg-[#0c0c0e] flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-white/50">Bildirishnomalar</span>
                  <button onClick={() => setShowNotifications(false)} className="text-white/30 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
                <div className="divide-y divide-[#1a1a1c] max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-xs text-center text-white/40">Yangi bildirishnomalar yo'q.</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-[#161619] transition-colors cursor-pointer">
                        <p className="font-bold text-xs text-white/90">{n.message}</p>
                        <span className="text-[9px] text-[#ff006a] font-mono mt-1 block">
                          {n.created_at ? new Date(n.created_at).toLocaleString('uz-UZ') : 'Yangi'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User State & Dropdown */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 p-1 rounded-sm hover:bg-[#111] transition-all"
            >
              <div className="w-8 h-8 rounded-full border border-[#ff006a]/30 overflow-hidden flex items-center justify-center bg-[#1c1c1e] text-[#ff006a] uppercase font-bold text-xs">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <span className="text-xs font-bold hidden md:inline text-white/80">{user.name}</span>
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 bg-[#111113] border border-[#1a1a1c] rounded-sm shadow-2xl overflow-hidden z-50 text-xs"
                >
                  <div className="p-3 border-b border-[#1a1a1c] bg-[#0c0c0e]">
                    <p className="font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-white/40 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/profil"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white hover:bg-[#1a1a1c] rounded-sm transition-colors"
                    >
                      <User size={13} />
                      <span>Mening profilim</span>
                    </Link>
                    <Link
                      to="/sevimlilar"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white hover:bg-[#1a1a1c] rounded-sm transition-colors"
                    >
                      <Heart size={13} />
                      <span>Sevimlilar</span>
                    </Link>
                    <Link
                      to="/sozlamalar"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white hover:bg-[#1a1a1c] rounded-sm transition-colors"
                    >
                      <Settings size={13} />
                      <span>Sozlamalar</span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-950/20 rounded-sm transition-colors"
                      >
                        <Shield size={13} />
                        <span>Control Panel</span>
                      </Link>
                    )}
                  </div>
                  <div className="p-1 border-t border-[#1a1a1c] bg-[#0c0c0e]">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-white/50 hover:text-red-400 rounded-sm transition-colors text-left"
                    >
                      <LogOut size={13} />
                      <span>Chiqish</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center space-x-1 min-[400px]:space-x-2">
            <Link 
              to="/login" 
              className="text-white/70 hover:text-white text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 sm:py-2 transition-colors uppercase tracking-wider whitespace-nowrap"
            >
              Kirish
            </Link>
            <Link 
              to="/register" 
              className="hidden min-[450px]:inline-flex bg-[#ff006a] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-sm text-[11px] sm:text-xs font-bold hover:bg-[#d40058] transition-colors uppercase tracking-wider whitespace-nowrap shrink-0"
            >
              Ro'yxatdan o'tish
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
