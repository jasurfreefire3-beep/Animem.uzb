import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Anime, toSlug } from '../types';
import { 
  Shield, Clock, Heart, MessageSquare, Edit3, Save, Camera, 
  Loader2, Globe, Send, Instagram, Youtube, Tv, Share2, 
  Check, X, Sparkles, Film, Star, ArrowRight, Lock, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TelegramIcon, InstagramIcon, TikTokIcon, YouTubeIcon, 
  DiscordIcon, FacebookIcon, VKIcon 
} from '../components/SocialIcons';

// Default banner if none provided
const DEFAULT_BANNER = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80";

function getOnlineStatusInfo(lastSeen?: string) {
  if (!lastSeen) return { isOnline: false, text: "Oflayn" };
  const seenDate = new Date(lastSeen).getTime();
  if (isNaN(seenDate)) return { isOnline: false, text: "Oflayn" };

  const now = Date.now();
  const diffMs = now - seenDate;
  
  if (diffMs < 180000) {
    return { isOnline: true, text: "Hozir tarmoqda (Online)" };
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return { isOnline: false, text: `${diffMins} daqiqa oldin tarmoqda edi` };
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return { isOnline: false, text: `${diffHours} soat oldin tarmoqda edi` };
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return { isOnline: false, text: `${diffDays} kun oldin tarmoqda edi` };
  }

  return { isOnline: false, text: "Uzoq vaqt oldin tarmoqda edi" };
}

export default function Profil() {
  const params = useParams();
  const targetId = params.id;
  const { user: currentUser, token, login } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editYoutube, setEditYoutube] = useState('');
  const [editDiscord, setEditDiscord] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editVk, setEditVk] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Load user profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const idToFetch = targetId || currentUser?.id;
        if (!idToFetch) {
          setError("Foydalanuvchi topilmadi");
          setLoading(false);
          return;
        }

        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}/api/user/${idToFetch}`, { headers });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Profilni yuklashda xatolik");
        }

        setProfileUser(data.user);
        setIsOwner(Boolean(data.isOwner || (currentUser && String(currentUser.id) === String(data.user.id))));
        
        // Populate edit state values
        setEditName(data.user.name || '');
        setEditBio(data.user.bio || '');
        setEditBannerUrl(data.user.banner_url || '');
        setEditAvatarUrl(data.user.avatar_url || '');
        setEditTelegram(data.user.telegram || '');
        setEditInstagram(data.user.instagram || '');
        setEditTiktok(data.user.tiktok || '');
        setEditYoutube(data.user.youtube || '');
        setEditDiscord(data.user.discord || '');
        setEditFacebook(data.user.facebook || '');
        setEditVk(data.user.vk || '');
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetId, currentUser, token]);

  // Client-side image compression
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingAvatar(true);
    try {
      const resizedBase64 = await resizeImage(file, 250, 250);
      setEditAvatarUrl(resizedBase64);

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
      if (res.ok) {
        setProfileUser(prev => prev ? { ...prev, avatar_url: resizedBase64 } : null);
        if (currentUser && data.user) {
          login(token, { ...currentUser, avatar_url: resizedBase64 });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingBanner(true);
    try {
      const resizedBase64 = await resizeImage(file, 1000, 400);
      setEditBannerUrl(resizedBase64);

      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName || profileUser?.name,
          banner_url: resizedBase64
        })
      });

      setProfileUser(prev => prev ? { ...prev, banner_url: resizedBase64 } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !token) return;

    setSaving(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const payload = {
        name: editName.trim(),
        bio: editBio,
        banner_url: editBannerUrl,
        avatar_url: editAvatarUrl,
        telegram: editTelegram,
        instagram: editInstagram,
        tiktok: editTiktok,
        youtube: editYoutube,
        discord: editDiscord,
        facebook: editFacebook,
        vk: editVk
      };

      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profilni saqlashda xatolik");
      }

      setProfileUser(prev => prev ? {
        ...prev,
        ...payload
      } : null);

      if (currentUser && data.user) {
        login(data.token || token, { ...currentUser, name: editName.trim(), avatar_url: editAvatarUrl || currentUser.avatar_url });
      }

      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  // Format social link for external redirect
  const formatSocialUrl = (platform: string, handleOrUrl: string) => {
    if (!handleOrUrl) return '#';
    const trimmed = handleOrUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const cleanHandle = trimmed.replace(/^@/, '');
    switch (platform) {
      case 'telegram': return `https://t.me/${cleanHandle}`;
      case 'instagram': return `https://instagram.com/${cleanHandle}`;
      case 'tiktok': return `https://tiktok.com/@${cleanHandle}`;
      case 'youtube': return `https://youtube.com/${cleanHandle.startsWith('c/') || cleanHandle.startsWith('@') ? cleanHandle : '@' + cleanHandle}`;
      case 'facebook': return `https://facebook.com/${cleanHandle}`;
      case 'discord': return `https://discord.com/users/${cleanHandle}`;
      case 'vk': return `https://vk.com/${cleanHandle}`;
      default: return trimmed;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold text-white uppercase">{error || "Foydalanuvchi topilmadi"}</h2>
        <Link to="/" className="inline-block bg-[#ff006a] text-white px-6 py-2.5 rounded-sm text-xs font-bold uppercase">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  const socialLinks = [
    { key: 'telegram', label: 'Telegram', value: profileUser.telegram, icon: TelegramIcon, glow: 'hover:shadow-[0_0_20px_rgba(0,136,204,0.7)]' },
    { key: 'instagram', label: 'Instagram', value: profileUser.instagram, icon: InstagramIcon, glow: 'hover:shadow-[0_0_20px_rgba(225,48,108,0.7)]' },
    { key: 'youtube', label: 'YouTube', value: profileUser.youtube, icon: YouTubeIcon, glow: 'hover:shadow-[0_0_20px_rgba(255,0,0,0.7)]' },
    { key: 'discord', label: 'Discord', value: profileUser.discord, icon: DiscordIcon, glow: 'hover:shadow-[0_0_20px_rgba(88,101,242,0.7)]' },
    { key: 'facebook', label: 'Facebook', value: profileUser.facebook, icon: FacebookIcon, glow: 'hover:shadow-[0_0_20px_rgba(24,119,242,0.7)]' },
    { key: 'tiktok', label: 'TikTok', value: profileUser.tiktok, icon: TikTokIcon, glow: 'hover:shadow-[0_0_20px_rgba(37,244,238,0.7)]' },
    { key: 'vk', label: 'VKontakte', value: profileUser.vk, icon: VKIcon, glow: 'hover:shadow-[0_0_20px_rgba(0,119,255,0.7)]' },
  ].filter(s => Boolean(s.value));

  const favoritesList: Anime[] = Array.isArray(profileUser.favorites) ? profileUser.favorites : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* BANNER & AVATAR HEADER */}
      <div className="relative bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Banner Container */}
        <div className="relative w-full h-48 sm:h-64 md:h-72 bg-[#1a1a1c] overflow-hidden">
          <img loading="lazy" decoding="async" 
            src={profileUser.banner_url || DEFAULT_BANNER} 
            alt="User Banner" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent" />

          {/* Banner Upload Button (For Owner) */}
          {isOwner && (
            <label className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 cursor-pointer backdrop-blur-md transition-all flex items-center gap-1.5 z-10 shadow-lg">
              <Camera size={14} className="text-[#ff006a]" />
              <span>{uploadingBanner ? "Yuklanmoqda..." : "Muqovani almashtirish"}</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleBannerUpload}
                disabled={uploadingBanner}
              />
            </label>
          )}
        </div>

        {/* Profile Content Overlay */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16 sm:-mt-20">
          
          {/* Avatar & Basic Info */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
            
            {/* Avatar Circle */}
            <div className="relative shrink-0 group">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-[#111] bg-[#1c1c1e] overflow-hidden flex items-center justify-center text-4xl sm:text-5xl font-black text-[#ff006a] uppercase shadow-[0_0_30px_rgba(255,0,106,0.3)] relative">
                {profileUser.avatar_url ? (
                  <img loading="lazy" decoding="async" src={profileUser.avatar_url} alt={profileUser.name} className="w-full h-full object-cover" />
                ) : (
                  profileUser.name.charAt(0)
                )}

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                    <Loader2 size={28} className="text-[#ff006a] animate-spin" />
                  </div>
                )}
              </div>

              {/* Avatar Upload Button */}
              {isOwner && (
                <label className="absolute bottom-1 right-1 bg-[#ff006a] hover:bg-[#d40058] text-white p-2 rounded-full border-2 border-[#111] cursor-pointer shadow-lg transition-transform hover:scale-110 flex items-center justify-center">
                  <Camera size={14} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              )}
            </div>

            {/* Name, Role & Bio summary */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-white drop-shadow">
                  {profileUser.name}
                </h1>

                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${
                  profileUser.role === 'admin' 
                    ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                    : 'bg-[#ff006a]/20 border-[#ff006a]/40 text-[#ff006a]'
                }`}>
                  {profileUser.role === 'admin' ? '⚡ ADMIN' : '✨ PREMIUM'}
                </span>

                {/* ONLINE / OFFLINE STATUS BADGE */}
                {(() => {
                  const status = getOnlineStatusInfo(profileUser.last_seen);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold border ${
                      status.isOnline 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.2)]' 
                        : 'bg-white/5 border-white/10 text-white/50'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-white/30'}`} />
                      <span>{status.text}</span>
                    </span>
                  );
                })()}

                {/* Round Social Buttons Quick Row in Header */}
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-2 ml-1">
                    {socialLinks.map((social) => {
                      const IconComponent = social.icon;
                      const href = formatSocialUrl(social.key, social.value!);
                      return (
                        <a
                          key={social.key}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${social.label}: ${social.value}`}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${social.glow} border border-white/10 bg-black/40`}
                        >
                          <IconComponent className="w-8 h-8" size={32} />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {profileUser.bio ? (
                <p className="text-white/80 text-xs sm:text-sm max-w-xl line-clamp-2 italic font-sans">
                  "{profileUser.bio}"
                </p>
              ) : (
                <p className="text-white/40 text-xs font-mono">
                  {isOwner ? "Bio yozilmagan. Profilni tahrirlash orqali bio qo'shing!" : "Foydalanuvchi bio yozmagan."}
                </p>
              )}
            </div>

          </div>

          {/* Edit Action Button */}
          {isOwner && (
            <div className="shrink-0">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-[#ff006a] hover:bg-[#d40058] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(255,0,106,0.25)] flex items-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                <Edit3 size={14} /> Profilni Tahrirlash
              </button>
            </div>
          )}

        </div>
      </div>

      {/* EDIT MODAL / INLINE EDITOR (Owner Only) */}
      <AnimatePresence>
        {isEditing && isOwner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#111] border border-[#ff006a]/30 rounded-2xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={18} className="text-[#ff006a]" /> Profil Ma'lumotlarini Tahrirlash
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-white/50 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Name & Bio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase mb-1">Ism va Familiya</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-[#000] border border-[#222] rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ff006a]"
                    placeholder="Ismingizni kiriting"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase mb-1">Bio (O'zingiz haqingizda status)</label>
                  <input
                    type="text"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ff006a]"
                    placeholder="Masalan: Anime ixlosmandi va manga ishqibozi..."
                  />
                </div>
              </div>

              {/* Banner & Avatar URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase mb-1">Banner Rasm Havolasi (URL)</label>
                  <input
                    type="url"
                    value={editBannerUrl}
                    onChange={(e) => setEditBannerUrl(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ff006a]"
                    placeholder="https://.../banner.jpg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase mb-1">Avatar Rasm Havolasi (URL)</label>
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ff006a]"
                    placeholder="https://.../avatar.jpg"
                  />
                </div>
              </div>

              {/* Social Media Links Inputs */}
              <div className="border-t border-[#222] pt-4">
                <h4 className="text-xs font-bold text-[#ff006a] uppercase tracking-wider mb-3">
                  Ijtimoiy Tarmoq Sahifalari (Telegram, Instagram, YouTube, Discord, Facebook, TikTok, VK)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">Telegram (username yoki havola)</label>
                    <input
                      type="text"
                      value={editTelegram}
                      onChange={(e) => setEditTelegram(e.target.value)}
                      placeholder="@username yoki t.me/username"
                      className="w-full bg-[#000] border border-[#222] rounded-lg px-3 py-2 text-white text-xs focus:border-[#0088cc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">Instagram (username)</label>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      placeholder="@username"
                      className="w-full bg-[#000] border border-[#222] rounded-lg px-3 py-2 text-white text-xs focus:border-[#e1306c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">YouTube (Kanal havolasi)</label>
                    <input
                      type="text"
                      value={editYoutube}
                      onChange={(e) => setEditYoutube(e.target.value)}
                      placeholder="youtube.com/@channel"
                      className="w-full bg-[#000] border border-[#222] rounded-lg px-3 py-2 text-white text-xs focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">Discord (Tag yoki invite)</label>
                    <input
                      type="text"
                      value={editDiscord}
                      onChange={(e) => setEditDiscord(e.target.value)}
                      placeholder="username#0000 yoki invite"
                      className="w-full bg-[#000] border border-[#222] rounded-lg px-3 py-2 text-white text-xs focus:border-[#5865F2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">Facebook (Profil havolasi)</label>
                    <input
                      type="text"
                      value={editFacebook}
                      onChange={(e) => setEditFacebook(e.target.value)}
                      placeholder="facebook.com/username"
                      className="w-full bg-[#000] border border-[#222] rounded-lg px-3 py-2 text-white text-xs focus:border-[#1877F2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">TikTok (username)</label>
                    <input
                      type="text"
                      value={editTiktok}
                      onChange={(e) => setEditTiktok(e.target.value)}
                      placeholder="@username"
                      className="w-full bg-[#000] border border-[#222] rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">VK / VKontakte (username yoki id)</label>
                    <input
                      type="text"
                      value={editVk}
                      onChange={(e) => setEditVk(e.target.value)}
                      placeholder="vk.com/username yoki id"
                      className="w-full bg-[#000] border border-[#222] rounded-lg px-3 py-2 text-white text-xs focus:border-[#0077FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-xs font-bold uppercase"
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#ff006a] hover:bg-[#d40058] text-white rounded-lg text-xs font-bold uppercase flex items-center gap-2 shadow-lg"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Saqlash</span>
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOCIAL LINKS DISPLAY SECTION */}
      {socialLinks.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe size={16} className="text-[#ff006a]" /> Ijtimoiy Tarmoq Sahifalari
          </h3>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((social) => {
              const IconComp = social.icon;
              const href = formatSocialUrl(social.key, social.value!);
              return (
                <a
                  key={social.key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-[#18181c] border border-white/10 hover:border-[#ff006a]/50 p-2 pr-4 rounded-full text-xs font-bold flex items-center gap-3 transition-all transform hover:-translate-y-0.5 ${social.glow} group cursor-pointer`}
                >
                  <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center overflow-hidden">
                    <IconComp className="w-9 h-9" size={36} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-white/40 uppercase font-extrabold tracking-wider leading-none mb-0.5">{social.label}</span>
                    <span className="text-white text-xs font-medium font-mono truncate max-w-[140px] group-hover:text-[#ff006a] transition-colors">{social.value}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* STATS COUNTER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-[#222] p-5 rounded-2xl text-center space-y-1 hover:border-[#ff006a]/30 transition-colors">
          <Clock className="w-6 h-6 text-[#ff006a] mx-auto" />
          <h4 className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Tomosha vaqti</h4>
          <p className="text-2xl font-black text-white">{Math.max(12, favoritesList.length * 8 + 14)} soat</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-5 rounded-2xl text-center space-y-1 hover:border-[#ff006a]/30 transition-colors">
          <Heart className="w-6 h-6 text-[#ff006a] mx-auto fill-current" />
          <h4 className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Saqlangan animelar</h4>
          <p className="text-2xl font-black text-white">{favoritesList.length} ta</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-5 rounded-2xl text-center space-y-1 hover:border-[#ff006a]/30 transition-colors">
          <MessageSquare className="w-6 h-6 text-[#ff006a] mx-auto" />
          <h4 className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Jami Izohlar</h4>
          <p className="text-2xl font-black text-white">{profileUser.comments_count || 0} ta</p>
        </div>
      </div>

      {/* SAVED / FAVORITE ANIMELAR DISPLAY GRID */}
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222] pb-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film size={18} className="text-[#ff006a]" /> Saqlangan Animelar ({favoritesList.length})
          </h3>

          {isOwner && (
            <Link to="/sevimlilar" className="text-xs text-[#ff006a] hover:underline font-bold flex items-center gap-1">
              Barchasini Boshqarish <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {favoritesList.length === 0 ? (
          <div className="text-center py-12 text-white/30 space-y-2">
            <Film className="w-10 h-10 mx-auto text-white/20" />
            <p className="text-xs font-mono">Hozircha birorta ham anime saqlanmagan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoritesList.map((anime) => (
              <div 
                key={anime.id} 
                className="bg-[#161618] border border-[#222] rounded-xl overflow-hidden group hover:border-[#ff006a]/50 transition-all flex flex-col"
              >
                {/* Anime Poster */}
                <Link to={`/anime/${toSlug(anime.title)}`} className="aspect-[3/4] relative overflow-hidden block bg-black">
                  <img loading="lazy" decoding="async" 
                    src={anime.image_url} 
                    alt={anime.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {anime.rating && (
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-yellow-500/30 text-yellow-400 font-bold text-[10px] flex items-center gap-1">
                      <Star size={10} className="fill-current" /> {Number(anime.rating).toFixed(1)}
                    </div>
                  )}
                </Link>

                {/* Anime Info */}
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <Link to={`/anime/${toSlug(anime.title)}`} className="text-xs font-bold text-white group-hover:text-[#ff006a] transition-colors line-clamp-1 block">
                    {anime.title}
                  </Link>

                  <div className="mt-2 pt-2 border-t border-[#222] flex items-center justify-between text-[10px] text-white/40">
                    <span>{anime.qismlar_soni || 12}-qism</span>
                    <Link to={`/anime/${toSlug(anime.title)}`} className="text-[#ff006a] font-bold hover:underline">
                      Ko'rish
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACCOUNT DETAILS & PRIVACY CARD */}
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield size={16} className="text-[#ff006a]" /> Tizim va Maxfiylik Ma'lumotlari
        </h3>

        <div className="space-y-3 text-xs font-mono">
          {/* EMAIL PRIVACY: EMAIL IS ONLY SHOWN IF ISOWNER IS TRUE */}
          {isOwner ? (
            <div className="flex justify-between py-2 border-b border-[#222] items-center">
              <span className="text-white/40 uppercase flex items-center gap-1.5">
                <Eye size={13} className="text-[#ff006a]" /> Email (Faqat sizga ko'rinadi):
              </span>
              <span className="text-white font-bold bg-[#1a1a1c] px-3 py-1 rounded border border-[#333]">
                {profileUser.email || currentUser?.email || 'Foydalanuvchi emaili'}
              </span>
            </div>
          ) : (
            <div className="flex justify-between py-2 border-b border-[#222] items-center text-white/40">
              <span className="uppercase flex items-center gap-1.5">
                <Lock size={13} className="text-white/30" /> Email Manzili:
              </span>
              <span className="italic text-[11px] text-white/30">Maxfiy (Boshqalarga ko'rinmaydi)</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-[#222] items-center">
            <span className="text-white/40 uppercase">Hisob Roli:</span>
            <span className="text-[#ff006a] font-bold uppercase">
              {profileUser.role === 'admin' ? 'ADMINISTRATOR' : 'PREMIUM FOYDALANUVCHI'}
            </span>
          </div>

          <div className="flex justify-between py-2 items-center">
            <span className="text-white/40 uppercase">A'zo bo'lingan sana:</span>
            <span className="text-white/80">
              {profileUser.created_at ? new Date(profileUser.created_at).toLocaleDateString() : '15.01.2024'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
