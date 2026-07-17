import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Clock, Heart, MessageSquare, Edit3, Save, Camera, Upload, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Profil() {
  const { user, token, login } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'User');
  const [statusText, setStatusText] = useState('Premium foydalanuvchi');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

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

  // Client-side image resizing/compression to keep Base64 string small
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const resizedBase64 = await resizeImage(file, 150, 150);
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      
      const res = await fetch(`${API_BASE}/api/user/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: resizedBase64 })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Rasm yuklashda xatolik");
      }

      login(token!, data.user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Rasm yuklash muvaffaqiyatsiz bo'ldi");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError('');

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profilni tahrirlashda xatolik");
      }

      login(data.token, data.user);
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-sm text-xs font-bold font-mono">
          {error}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff006a]/5 blur-3xl rounded-full pointer-events-none" />

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full border-2 border-[#ff006a]/30 overflow-hidden flex items-center justify-center bg-[#1c1c1e] text-4xl font-bold font-mono text-[#ff006a] uppercase shadow-[0_0_20px_rgba(255,0,106,0.15)] relative group">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              name.charAt(0)
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/65 flex items-center justify-center rounded-full">
                <Loader2 size={24} className="text-[#ff006a] animate-spin" />
              </div>
            )}
          </div>
          
          <label 
            htmlFor="avatar-input" 
            className="absolute bottom-0 right-0 bg-[#ff006a] text-white p-1.5 rounded-full border-2 border-[#111] cursor-pointer hover:bg-[#d40058] transition-colors flex items-center justify-center"
            title="Rasm yuklash"
          >
            <Camera size={12} />
            <input
              type="file"
              id="avatar-input"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* User Info Details */}
        <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            {isEditing ? (
              <div className="flex items-center gap-2 w-full max-w-xs mx-auto md:mx-0">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  className="bg-[#000] border border-[#222] rounded-sm px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#ff006a] w-full"
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 bg-[#ff006a] text-white hover:bg-[#d40058] rounded-sm transition-colors shrink-0 flex items-center justify-center min-w-[32px] min-h-[32px]"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
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

      {/* Stats Grid */}
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
