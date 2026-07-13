import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Clock, Heart, MessageSquare, Edit3, Save, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Profil() {
  const { user } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'User');
  const [statusText, setStatusText] = useState('Premium foydalanuvchi');

  useEffect(() => {
    // Favorites count
    const favs = localStorage.getItem('anime_favorites');
    if (favs) {
      try {
        setFavoritesCount(JSON.parse(favs).length);
      } catch (e) {
        console.error(e);
      }
    }

    // History count
    const hist = localStorage.getItem('anime_history');
    if (hist) {
      try {
        setHistoryCount(JSON.parse(hist).length);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Watched hours simulation: deterministic based on activity
  const simulatedHours = Math.max(12, (favoritesCount * 12) + (historyCount * 3.5));

  const handleSave = () => {
    setIsEditing(false);
    // Realistically update context username if we had a profile endpoint or we can just keep state
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Profile Header */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff006a]/5 blur-3xl rounded-full pointer-events-none" />

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full bg-[#1c1c1e] border-2 border-[#ff006a]/30 flex items-center justify-center text-4xl font-bold font-mono text-[#ff006a] uppercase shadow-[0_0_20px_rgba(255,0,106,0.15)]">
            {name.charAt(0)}
          </div>
          <div className="absolute bottom-0 right-0 bg-[#ff006a] text-white p-1.5 rounded-full border-2 border-[#111] cursor-pointer hover:bg-[#d40058] transition-colors">
            <Edit3 size={12} onClick={() => setIsEditing(!isEditing)} />
          </div>
        </div>

        {/* User Info Details */}
        <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#000] border border-[#222] rounded-sm px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#ff006a]"
                />
                <button
                  onClick={handleSave}
                  className="p-1.5 bg-[#ff006a] text-white hover:bg-[#d40058] rounded-sm transition-colors"
                >
                  <Save size={14} />
                </button>
              </div>
            ) : (
              <h1 className="text-2xl font-black uppercase tracking-wide text-white truncate">
                {name}
              </h1>
            )}
            <span className="bg-[#ff006a]/10 border border-[#ff006a]/20 text-[#ff006a] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm self-center">
              Premium
            </span>
          </div>

          <p className="text-white/50 text-xs font-medium font-sans">
            {statusText}
          </p>
          <p className="text-white/30 text-[11px] font-mono">
            A'zo bo'lgan sana: 15.01.2024
          </p>
        </div>

        {/* Edit profile action button */}
        <div className="shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="border border-[#222] bg-[#1a1a1c] hover:bg-[#2a2a2c] text-white font-bold text-xs px-5 py-2.5 rounded-sm transition-colors uppercase tracking-wider flex items-center gap-1.5"
          >
            <Edit3 size={12} /> Profilni tahrirlash
          </button>
        </div>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1 */}
        <div className="bg-[#111] border border-[#222] p-5 rounded-sm text-center space-y-1">
          <Clock className="w-5 h-5 text-[#ff006a] mx-auto" />
          <h4 className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Ko'rilgan vaqt</h4>
          <p className="text-2xl font-black text-white">{simulatedHours} soat</p>
        </div>

        {/* Stat 2 */}
        <Link to="/sevimlilar" className="bg-[#111] border border-[#222] p-5 rounded-sm text-center space-y-1 hover:border-[#ff006a]/30 transition-colors block">
          <Heart className="w-5 h-5 text-[#ff006a] mx-auto fill-current" />
          <h4 className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Sevimli animelar</h4>
          <p className="text-2xl font-black text-white">{favoritesCount} ta</p>
        </Link>

        {/* Stat 3 */}
        <div className="bg-[#111] border border-[#222] p-5 rounded-sm text-center space-y-1">
          <MessageSquare className="w-5 h-5 text-[#ff006a] mx-auto" />
          <h4 className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Izohlar</h4>
          <p className="text-2xl font-black text-white">15 ta</p>
        </div>
      </div>

      {/* Extra Detail Profile section */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield size={16} className="text-[#ff006a]" /> Hisob ma'lumotlari
        </h3>
        <div className="space-y-3 text-xs font-mono">
          <div className="flex justify-between py-2 border-b border-[#222]">
            <span className="text-white/40 uppercase">Email:</span>
            <span className="text-white/80">{user?.email || 'foydalanuvchi@anime.uz'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#222]">
            <span className="text-white/40 uppercase">Hisob roli:</span>
            <span className="text-white/80 uppercase font-bold text-[#ff006a]">
              {user?.role || 'FOYDALANUVCHI'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-white/40 uppercase">Xavfsizlik darajasi:</span>
            <span className="text-green-400 font-bold">YUQORI (2FA YOQILGAN)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
