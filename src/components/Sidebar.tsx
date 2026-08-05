import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Tv, 
  BookOpen,
  Calendar, 
  Clock, 
  Star, 
  Heart, 
  History, 
  Settings, 
  PlayCircle, 
  User, 
  Moon, 
  Sun,
  Shield,
  MessageSquare,
  Gift,
  X,
  MessageCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { translateGenre } from '../types';
import logoImg from '../logo.png';

interface SidebarProps {
  onClose?: () => void;
  onGenreSelect?: (genre: string) => void;
}

export default function Sidebar({ onClose, onGenreSelect }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved !== 'light';
  });

  useEffect(() => {
    // Initial sync
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    const handleGlobalThemeChange = () => {
      const savedTheme = localStorage.getItem('theme');
      setDarkMode(savedTheme !== 'light');
    };

    window.addEventListener('theme-changed', handleGlobalThemeChange);
    return () => window.removeEventListener('theme-changed', handleGlobalThemeChange);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    const themeKey = newValue ? 'dark' : 'light';
    localStorage.setItem('theme', themeKey);
    if (themeKey === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    window.dispatchEvent(new Event('theme-changed'));
  };

  const menuItems = [
    { name: 'Bosh sahifa', path: '/', icon: Home },
    { name: 'Animelar', path: '/animelar', icon: Tv },
    { name: 'Mangalar', path: '/manga', icon: BookOpen },
    { name: 'Donat (Qo\'llab-quvvatlash)', path: '/donat', icon: Gift },
    { name: 'Jadval', path: '/jadval', icon: Calendar },
    { name: 'Yangi chiqishlar', path: '/yangi-chiqishlar', icon: Clock },
    { name: 'Top 100', path: '/top100', icon: Star },
    { name: 'Sevimlilar', path: '/sevimlilar', icon: Heart },
    { name: 'Tarix', path: '/tarix', icon: History },
    { name: 'Sozlamalar', path: '/sozlamalar', icon: Settings },
  ];

  const categories = [
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Supernatural',
  ];

  return (
    <div className="w-full h-full flex flex-col text-white select-none">
      {/* Brand Logo */}
      <div className="relative h-28 flex items-center justify-center px-5 border-b border-[#1a1a1a]">
        <Link to="/" onClick={onClose} className="flex items-center group">
          <img 
            src={logoImg} 
            alt="AnimeUz" 
            className="h-[80px] w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </Link>
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-white/50 hover:text-white hover:bg-[#1a1a1a] rounded-sm transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-4 space-y-6">
        {/* Main Menu */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3.5 px-4 py-3 rounded-sm text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-[#ff006a] text-white shadow-[0_0_15px_rgba(255,0,106,0.2)]' 
                    : 'text-white/50 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-white/50'} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {user && user.role === 'admin' && (
            <Link
              to="/admin"
              onClick={onClose}
              className={`flex items-center space-x-3.5 px-4 py-3 rounded-sm text-sm font-bold transition-all ${
                location.pathname === '/admin'
                  ? 'bg-red-600 text-white'
                  : 'text-white/50 hover:bg-red-950/20 hover:text-red-400'
              }`}
            >
              <Shield size={18} />
              <span>Control Panel</span>
            </Link>
          )}
        </div>

        {/* Categories Section */}
        <div>
          <h4 className="px-4 text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">
            Kategoriyalar
          </h4>
          <div className="space-y-0.5">
            {categories.map((genre) => (
              <Link
                key={genre}
                to={`/animelar?genre=${genre}`}
                onClick={() => {
                  if (onGenreSelect) onGenreSelect(genre);
                  if (onClose) onClose();
                }}
                className="flex items-center px-4 py-2 text-xs font-bold text-white/50 hover:text-white hover:bg-[#111] rounded-sm transition-colors"
              >
                <span className="mr-2 text-[#ff006a]/50 group-hover:text-[#ff006a] font-mono">&gt;</span>
                {translateGenre(genre)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Support Bot Button (Yashirildi)
      <div className="p-4 border-t border-[#1a1a1a] bg-[#0c0c0e]">
        <Link
          to="/support"
          onClick={onClose}
          className="flex items-center justify-center space-x-2 w-full bg-[#ff006a]/10 hover:bg-[#ff006a]/20 border border-[#ff006a]/30 text-[#ff006a] py-2.5 rounded-sm transition-all"
        >
          <MessageCircle size={16} />
          <span className="font-bold text-xs tracking-wider uppercase">Sumire Yordam</span>
        </Link>
      </div>
      */}

      {/* Bottom Mode Switch & Info */}
      <div className="p-4 border-t border-[#1a1a1a] bg-[#0c0c0e] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2 hover:bg-[#1a1a1a] rounded text-white/50 hover:text-white transition-all cursor-pointer"
            title={darkMode ? "Kungi rejim" : "Tungi rejim"}
          >
            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
        <div className="text-[10px] text-white/20 font-bold tracking-wider font-mono uppercase">
          ANIMEUZ v1.2
        </div>
      </div>
    </div>
  );
}
