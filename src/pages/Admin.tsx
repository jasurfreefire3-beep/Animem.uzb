import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Plus, Link as LinkIcon, Image, Type, AlignLeft, 
  Calendar, Building, ListOrdered, Tag, Film, Tv, Video, 
  Trash2, Edit2, Search, X, Check, Eye, Bell, BookOpen, CreditCard, Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { Anime, GENRE_MAP, translateGenre } from '../types';
import AdminNotifications from '../components/AdminNotifications';
import AdminMangalar from '../components/AdminMangalar';
import AdminDonatlar from '../components/AdminDonatlar';
import AdminUsers from '../components/AdminUsers';

export default function Admin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'manage_animes' | 'add_anime' | 'episodes' | 'notifications' | 'mangas' | 'users' | 'donations'>('manage_animes');
  
  // Anime Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [holati, setHolati] = useState('Faol');
  const [yil, setYil] = useState('');
  const [studiyasi, setStudiyasi] = useState('');
  const [qismlarSoni, setQismlarSoni] = useState('');
  const [tags, setTags] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tavsiya, setTavsiya] = useState(false);
  const [isBanner, setIsBanner] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  
  // Multi Category Selection state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Editing States
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);

  // Deletion States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Episodes Form States
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [selectedAnimeId, setSelectedAnimeId] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [episodeVideoUrl, setEpisodeVideoUrl] = useState('');

  // Filtering list
  const [searchQuery, setSearchQuery] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  const safeJson = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Server xatosi (${res.status}): ${text.substring(0, 100)}`);
    }
    throw new Error("Xato javob formati keldi");
  };

  // Fetch all animes on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchAnimes = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/animes`);
          if (res.ok) {
            const data = await safeJson(res);
            setAnimes(data);
          }
        } catch (err) {
          console.error("Failed to fetch animes", err);
        }
      };
      fetchAnimes();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded flex items-center justify-center">
           <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Access Denied</h2>
        <p className="text-white/50 text-sm">You do not have permission to view the control panel.</p>
        <button onClick={() => navigate('/')} className="bg-[#ff006a] hover:bg-[#d40058] text-white px-6 py-2.5 rounded-sm font-bold transition-colors">Return to Home</button>
      </div>
    );
  }

  // Handle new anime publish OR edit save
  const handleAnimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (selectedGenres.length === 0) {
      setMessage({ type: 'error', text: 'Iltimos, kamida bitta janr tanlang!' });
      return;
    }

    try {
      const payload = {
        title,
        description,
        image_url: imageUrl,
        banner_url: bannerUrl,
        holati,
        yil: yil ? parseInt(yil) : null,
        studiyasi,
        qismlar_soni: qismlarSoni ? parseInt(qismlarSoni) : 0,
        janrlar: selectedGenres.join(', '),
        video_url: videoUrl,
        tavsiya: tavsiya ? 1 : 0,
        is_banner: isBanner ? 1 : 0,
        is_adult: isAdult ? 1 : 0,
        ...(editingAnime && editingAnime.korishlar !== undefined ? { korishlar: editingAnime.korishlar } : {})
      };

      let res;
      if (editingAnime) {
        res = await fetch(`${API_BASE}/api/animes/${editingAnime.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/api/animes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const resData = await safeJson(res);
      if (!res.ok) {
        throw new Error(resData.error || 'Operation failed');
      }

      setMessage({ 
        type: 'success', 
        text: editingAnime ? 'Anime muvaffaqiyatli tahrirlandi!' : "Yangi anime muvaffaqiyatli qo'shildi!" 
      });

      // Reset Form and Mode
      setEditingAnime(null);
      setTitle('');
      setDescription('');
      setImageUrl('');
      setBannerUrl('');
      setHolati('Faol');
      setYil('');
      setStudiyasi('');
      setQismlarSoni('');
      setSelectedGenres([]);
      setVideoUrl('');
      setTavsiya(false);
      setIsBanner(false);
      setIsAdult(false);
      
      // Go back to list tab
      setActiveTab('manage_animes');

      // Refresh animes list
      const freshRes = await fetch(`${API_BASE}/api/animes`);
      if (freshRes.ok) {
        const data = await safeJson(freshRes);
        setAnimes(data);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Start Edit Mode for a selected Anime
  const handleStartEdit = (anime: Anime) => {
    setEditingAnime(anime);
    setTitle(anime.title);
    setDescription(anime.description || '');
    setImageUrl(anime.image_url || '');
    setBannerUrl(anime.banner_url || '');
    setHolati(anime.holati || 'Faol');
    setYil(anime.yil ? anime.yil.toString() : '');
    setStudiyasi(anime.studiyasi || '');
    setQismlarSoni(anime.qismlar_soni ? anime.qismlar_soni.toString() : '');
    
    // Parse genres from comma list
    const parsedGenres = anime.janrlar 
      ? anime.janrlar.split(',').map(s => s.trim()).filter(Boolean) 
      : [];
    setSelectedGenres(parsedGenres);
    
    setVideoUrl(anime.video_url || '');
    setTavsiya(!!anime.tavsiya);
    setIsBanner(!!anime.is_banner);
    setIsAdult(!!anime.is_adult);
    
    // Switch to submit form tab
    setActiveTab('add_anime');
    setMessage({ type: '', text: '' });
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingAnime(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setBannerUrl('');
    setHolati('Faol');
    setYil('');
    setStudiyasi('');
    setQismlarSoni('');
    setSelectedGenres([]);
    setVideoUrl('');
    setTavsiya(false);
    setIsBanner(false);
    setIsAdult(false);
    setActiveTab('manage_animes');
  };

  // Delete Anime Handler
  const handleDeleteAnime = async (animeId: string | number) => {
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/animes/${animeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await safeJson(res);
      if (!res.ok) {
        throw new Error(resData.error || 'Delete failed');
      }

      setMessage({ type: 'success', text: "Anime muvaffaqiyatli o'chirildi!" });
      setDeleteConfirmId(null);

      // Update state
      setAnimes(prev => prev.filter(a => String(a.id) !== String(animeId)));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Dynamic Episodes state and handlers
  const [episodesList, setEpisodesList] = useState<any[]>([]);
  const [archiveConfig, setArchiveConfig] = useState<{ accessKey: string; secretKey: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: { percent: number; status: string; filename?: string }}>({});

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      fetch('/api/archive-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          return res.json();
        }
        throw new Error(`Invalid content-type: ${contentType} or status: ${res.status}`);
      })
      .then(data => {
        if (data && !data.error) {
          setArchiveConfig(data);
        }
      })
      .catch(err => {
        console.warn("Could not fetch archive.org config (normal if server is starting/restarting):", err.message);
      });
    }
  }, [user, token]);

  const handleUploadFileToArchive = async (episodeNumber: number, file: File) => {
    const anime = animes.find(a => String(a.id) === String(selectedAnimeId));
    const animeTitle = anime ? anime.title : 'Anime';
    
    // Set initial status
    setUploadProgress(prev => ({
      ...prev,
      [episodeNumber]: { percent: 0, status: 'starting', filename: file.name }
    }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('selectedAnimeId', String(selectedAnimeId));
    formData.append('episodeNumber', String(episodeNumber));
    formData.append('title', `${animeTitle} - ${episodeNumber}-qism`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-archive-proxy', true);
    
    // Set Authorization header for our API
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        // Once it reaches 100%, change status to 'processing' (uploading from our server to archive.org)
        const status = percentComplete >= 100 ? 'processing' : 'uploading';
        setUploadProgress(prev => ({
          ...prev,
          [episodeNumber]: { ...prev[episodeNumber], percent: percentComplete, status }
        }));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response && response.url) {
            handleLocalUrlChange(episodeNumber, response.url);

            setUploadProgress(prev => ({
              ...prev,
              [episodeNumber]: { percent: 100, status: 'completed', filename: file.name }
            }));

            setMessage({
              type: 'success',
              text: `${file.name} muvaffaqiyatli yuklandi va avtomatik saqlandi!`
            });

            handleSaveEpisode(episodeNumber, response.url);
          } else {
            throw new Error(response.error || "Server javobida havola topilmadi");
          }
        } catch (err: any) {
          console.error('Response parse error:', err);
          setUploadProgress(prev => ({
            ...prev,
            [episodeNumber]: { ...prev[episodeNumber], status: 'failed' }
          }));
          setMessage({
            type: 'error',
            text: `Yuklashda xatolik: ${err.message || 'Noma\'lum xatolik'}`
          });
        }
      } else {
        let errMsg = xhr.statusText;
        try {
          const resp = JSON.parse(xhr.responseText);
          if (resp && resp.error) errMsg = resp.error;
        } catch (e) {}

        console.error('Upload failed with status:', xhr.status, errMsg);
        setUploadProgress(prev => ({
          ...prev,
          [episodeNumber]: { ...prev[episodeNumber], status: 'failed' }
        }));
        setMessage({
          type: 'error',
          text: `Faylni yuklashda xatolik yuz berdi (${xhr.status}): ${errMsg}`
        });
      }
    };

    xhr.onerror = () => {
      setUploadProgress(prev => ({
        ...prev,
        [episodeNumber]: { ...prev[episodeNumber], status: 'failed' }
      }));
      setMessage({
        type: 'error',
        text: 'Tarmoq xatoligi tufayli faylni yuklash imkoni bo\'lmadi.'
      });
    };

    xhr.send(formData);
  };

  useEffect(() => {
    if (selectedAnimeId) {
      const fetchEps = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/animes/${selectedAnimeId}/episodes`);
          if (res.ok) {
            const data = await safeJson(res);
            setEpisodesList(data);
          }
        } catch (err) {
          console.error("Failed to fetch episodes:", err);
          setEpisodesList([]);
        }
      };
      fetchEps();
    } else {
      setEpisodesList([]);
    }
  }, [selectedAnimeId]);

  const handleSaveEpisode = async (epNum: number, urlVal: string) => {
    if (!selectedAnimeId) return;
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/animes/${selectedAnimeId}/episodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ episode_number: epNum, video_url: urlVal })
      });
      const resData = await safeJson(res);
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save episode');
      }
      
      setMessage({ type: 'success', text: `${epNum}-qism muvaffaqiyatli saqlandi!` });
      
      // Refresh list
      const epsRes = await fetch(`${API_BASE}/api/animes/${selectedAnimeId}/episodes`);
      if (epsRes.ok) {
        const data = await safeJson(epsRes);
        setEpisodesList(data);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteEpisode = async (epNum: number) => {
    if (!selectedAnimeId) return;
    if (!window.confirm(`${epNum}-qismni o'chirishga ruxsat berasizmi?`)) return;
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/animes/${selectedAnimeId}/episodes/${epNum}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await safeJson(res);
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to delete episode');
      }

      setMessage({ type: 'success', text: `${epNum}-qism o'chirildi!` });
      setEpisodesList(prev => prev.filter(e => e.episode_number !== epNum));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAddBlankEpisodeCard = () => {
    if (!selectedAnimeId) {
      setMessage({ type: 'error', text: 'Iltimos, avval filmni tanlang!' });
      return;
    }
    const maxEpNum = episodesList.length > 0 
      ? Math.max(...episodesList.map(e => e.episode_number || 0)) 
      : 0;
    const nextEpNum = maxEpNum + 1;
    
    const newEp = {
      anime_id: selectedAnimeId,
      episode_number: nextEpNum,
      video_url: '',
      isNew: true
    };
    setEpisodesList(prev => [...prev, newEp]);
  };

  const handleLocalUrlChange = (epNum: number, urlVal: string) => {
    setEpisodesList(prev => prev.map(e => e.episode_number === epNum ? { ...e, video_url: urlVal } : e));
  };

  const filteredAnimes = animes.filter(anime => 
    anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (anime.studiyasi && anime.studiyasi.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 px-4 md:px-0">
      {/* Control Panel Header */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-5 sm:p-8 relative overflow-hidden">
        <h1 className="text-2xl font-bold text-white flex items-center mb-2 uppercase tracking-wide">
          <ShieldAlert className="w-6 h-6 text-[#ff006a] mr-3" />
          Control Panel
        </h1>
        <p className="text-white/50 text-sm">Sayt katalogini tahrirlash, qismlar qo'shish va kontentni boshqarish.</p>
      </div>

      {/* Tabs list */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-1.5 flex space-x-1.5 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('manage_animes');
            setMessage({ type: '', text: '' });
          }}
          className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-sm text-xs sm:text-sm font-bold transition-colors flex-1 justify-center ${
            activeTab === 'manage_animes' ? 'bg-[#ff006a] text-white' : 'text-white/50 hover:bg-[#222] hover:text-white'
          }`}
        >
          <Tv size={16} />
          <span>Anime Ro'yxati</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('add_anime');
            setMessage({ type: '', text: '' });
          }}
          className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-sm text-xs sm:text-sm font-bold transition-colors flex-1 justify-center ${
            activeTab === 'add_anime' ? 'bg-[#ff006a] text-white' : 'text-white/50 hover:bg-[#222] hover:text-white'
          }`}
        >
          <Plus size={16} />
          <span>{editingAnime ? "Animeni Tahrirlash" : "Anime Qo'shish"}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('episodes');
            setMessage({ type: '', text: '' });
          }}
          className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-sm text-xs sm:text-sm font-bold transition-colors flex-1 justify-center ${
            activeTab === 'episodes' ? 'bg-[#ff006a] text-white' : 'text-white/50 hover:bg-[#222] hover:text-white'
          }`}
        >
          <ListOrdered size={16} />
          <span>Qismlarni Boshqarish</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('notifications');
            setMessage({ type: '', text: '' });
          }}
          className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-sm text-xs sm:text-sm font-bold transition-colors flex-1 justify-center ${
            activeTab === 'notifications' ? 'bg-[#ff006a] text-white' : 'text-white/50 hover:bg-[#222] hover:text-white'
          }`}
        >
          <Bell size={16} />
          <span>Bildirishnomalar</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('mangas');
            setMessage({ type: '', text: '' });
          }}
          className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-sm text-xs sm:text-sm font-bold transition-colors flex-1 justify-center ${
            activeTab === 'mangas' ? 'bg-[#ff006a] text-white' : 'text-white/50 hover:bg-[#222] hover:text-white'
          }`}
        >
          <BookOpen size={16} />
          <span>Mangalar</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('users');
            setMessage({ type: '', text: '' });
          }}
          className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-sm text-xs sm:text-sm font-bold transition-colors flex-1 justify-center ${
            activeTab === 'users' ? 'bg-[#ff006a] text-white' : 'text-white/50 hover:bg-[#222] hover:text-white'
          }`}
        >
          <Users size={16} />
          <span>Foydalanuvchilar</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('donations');
            setMessage({ type: '', text: '' });
          }}
          className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-sm text-xs sm:text-sm font-bold transition-colors flex-1 justify-center ${
            activeTab === 'donations' ? 'bg-[#ff006a] text-white' : 'text-white/50 hover:bg-[#222] hover:text-white'
          }`}
        >
          <CreditCard size={16} />
          <span>Donatlar</span>
        </button>
      </div>

      {/* Status Messages */}
      {message.text && (
        <div className={`p-4 rounded-sm text-sm font-bold flex items-center gap-3 ${
          message.type === 'error' 
            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
            : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${message.type === 'error' ? 'bg-red-400' : 'bg-green-400'}`} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab 1: Manage Anime Catalog */}
      {activeTab === 'manage_animes' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222] rounded-sm p-5 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#222] pb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center">
              <Tv className="w-4 h-4 text-[#ff006a] mr-2" /> Barcha Animelar ({animes.length})
            </h2>
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Nomi bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#000] border border-[#222] rounded-sm pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
            </div>
          </div>

          {/* Anime List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredAnimes.map((anime) => (
              <div 
                key={anime.id} 
                className="flex items-center gap-4 bg-[#050505] hover:bg-[#0c0c0c] border border-[#222] p-3 rounded-sm transition-colors"
              >
                {/* Poster */}
                <div className="w-12 h-16 shrink-0 bg-[#111] border border-[#222] rounded-sm overflow-hidden">
                  <img src={anime.image_url} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white line-clamp-1 truncate">{anime.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-[#222] text-white/50 text-[10px] uppercase font-bold rounded-sm">
                      {anime.holati || 'Airing'}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {anime.yil || 'Noma\'lum'}
                    </span>
                    <span className="text-[10px] text-white/40 border-l border-[#222] pl-2 line-clamp-1 truncate max-w-[120px]">
                      {anime.studiyasi || 'Noma\'lum'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center shrink-0">
                  {deleteConfirmId === anime.id ? (
                    <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-500/20 p-1.5 rounded-sm">
                      <span className="text-[10px] text-red-400 font-bold uppercase mr-1">O'chirilsinmi?</span>
                      <button
                        onClick={() => handleDeleteAnime(anime.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-[11px] px-2.5 py-1 rounded-sm font-bold transition-colors"
                      >
                        Ha
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="bg-[#222] hover:bg-[#333] text-white text-[11px] px-2.5 py-1 rounded-sm font-bold transition-colors"
                      >
                        Yo'q
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(anime)}
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-sm transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(anime.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-sm transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredAnimes.length === 0 && (
              <div className="text-center py-12 text-white/40 bg-[#050505] rounded-sm border border-[#222]">
                <Tv className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs">Hech qanday anime topilmadi.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 2: Create / Edit Anime Form */}
      {activeTab === 'add_anime' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222] rounded-sm p-5 sm:p-8"
        >
          {/* Editing Mode bar */}
          {editingAnime ? (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                  Tahrirlash rejimi: <span className="text-white font-normal lowercase">{editingAnime.title}</span>
                </span>
              </div>
              <button
                onClick={handleCancelEdit}
                className="text-xs bg-[#222] hover:bg-[#333] text-white px-3 py-1.5 rounded-sm font-bold transition-colors flex items-center gap-1"
              >
                <X size={14} /> Bekor qilish
              </button>
            </div>
          ) : (
            <div className="flex items-center mb-6 pb-4 border-b border-[#222]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center">
                <Plus className="w-4 h-4 text-[#ff006a] mr-2" /> Yangi Anime Katalogi Yaratish
              </h2>
            </div>
          )}

          <form onSubmit={handleAnimeSubmit} className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Anime Nomi (Title)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Synopsis */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Tavsif (Synopsis)</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <AlignLeft className="h-4 w-4 text-white/30" />
                  </div>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 min-h-[120px] resize-none transition-colors"
                  />
                </div>
              </div>

              {/* Poster Cover URL */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Poster Rasm URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Image className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Banner URL */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Katta Banner Rasm URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                  />
                </div>
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Holati (Status)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="h-4 w-4 text-white/30" />
                  </div>
                  <select
                    value={holati}
                    onChange={(e) => setHolati(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#ff006a]/50 appearance-none transition-colors"
                  >
                    <option value="Faol">Airing (Efirda)</option>
                    <option value="Yakunlangan">Completed (Tugallangan)</option>
                    <option value="Kutilmoqda">Upcoming (Kutilmoqda)</option>
                  </select>
                </div>
              </div>
              
              {/* Year */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Chiqarilgan Yili</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="number"
                    value={yil}
                    onChange={(e) => setYil(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                  />
                </div>
              </div>
              
              {/* Studio */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Studiyasi (Studio)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="text"
                    value={studiyasi}
                    onChange={(e) => setStudiyasi(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Total Episodes */}
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Qismlar Soni (Total Episodes)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ListOrdered className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="number"
                    value={qismlarSoni}
                    onChange={(e) => setQismlarSoni(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                  />
                </div>
              </div>
              
              {/* Multiple Genres Selection Grid */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase">Janrlar (Kategoriyalar - Bir nechta tanlash mumkin)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-[#000] p-4 rounded-sm border border-[#222]">
                  {Object.entries(GENRE_MAP).map(([engKey, uzbVal]) => {
                    const isSelected = selectedGenres.includes(engKey);
                    return (
                      <button
                        key={engKey}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGenres(prev => prev.filter(g => g !== engKey));
                          } else {
                            setSelectedGenres(prev => [...prev, engKey]);
                          }
                        }}
                        className={`px-3 py-2 rounded-sm text-xs font-bold flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-[#ff006a]/20 border-[#ff006a] text-white shadow-[0_0_10px_rgba(255,0,106,0.15)]'
                            : 'bg-[#050505] border-[#222] text-white/60 hover:text-white hover:border-[#333]'
                        }`}
                      >
                        <span>{uzbVal}</span>
                        {isSelected && <Check size={12} className="text-[#ff006a]" />}
                      </button>
                    );
                  })}
                </div>
                {selectedGenres.length > 0 && (
                  <p className="mt-2 text-xs text-white/40">
                    Tanlanganlar: <span className="text-[#ff006a] font-bold">{selectedGenres.map(g => GENRE_MAP[g] || g).join(', ')}</span>
                  </p>
                )}
              </div>

              {/* Episode 1 URL */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white/50 uppercase">1-Qism Manbasi</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (videoUrl.includes('t.me')) setVideoUrl('');
                      }}
                      className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                        !videoUrl.includes('t.me')
                          ? 'bg-[#111] border-[#ff006a] text-white font-black shadow-[0_0_8px_rgba(255,0,106,0.15)]'
                          : 'bg-[#000] border-[#222] text-white/40 hover:text-white'
                      }`}
                    >
                      Video Player
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!videoUrl.includes('t.me')) setVideoUrl('https://t.me/Animem_uz_bot?start=one_pice');
                      }}
                      className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                        videoUrl.includes('t.me')
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-black'
                          : 'bg-[#000] border-[#222] text-white/40 hover:text-white'
                      }`}
                    >
                      Telegram Havola
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Film className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="text"
                    value={videoUrl}
                    placeholder={videoUrl.includes('t.me') ? "https://t.me/Animem_uz_bot?start=..." : "https://ia601904.us.archive.org/2/items/..."}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                  />
                </div>
              </div>
              
              {/* Tavsiya checkbox */}
              <div className="md:col-span-2 flex items-center mt-2 p-3 bg-[#000] rounded-sm border border-[#222]">
                <div className="flex items-center h-4">
                  <input
                    id="tavsiya"
                    type="checkbox"
                    checked={tavsiya}
                    onChange={(e) => setTavsiya(e.target.checked)}
                    className="w-4 h-4 text-[#ff006a] bg-[#111] border-[#333] rounded-sm focus:ring-[#ff006a]/50 focus:ring-2 cursor-pointer"
                  />
                </div>
                <label htmlFor="tavsiya" className="ml-3 text-xs font-bold text-white cursor-pointer select-none uppercase tracking-wide">
                  Trend bo'limida ajratib ko'rsatilsin (Highlight in Trending)
                </label>
              </div>
              
              <div className="md:col-span-2 flex items-center mt-2 p-3 bg-[#000] rounded-sm border border-[#222]">
                <div className="flex items-center h-4">
                  <input
                    id="isBanner"
                    type="checkbox"
                    checked={isBanner}
                    onChange={(e) => setIsBanner(e.target.checked)}
                    className="w-4 h-4 text-[#ff006a] bg-[#111] border-[#333] rounded-sm focus:ring-[#ff006a]/50 focus:ring-2 cursor-pointer"
                  />
                </div>
                <label htmlFor="isBanner" className="ml-3 text-xs font-bold text-white cursor-pointer select-none uppercase tracking-wide">
                  Asosiy Bannerda ko'rsatilsin (Bannerga qo'yiladi)
                </label>
              </div>

              <div className="md:col-span-2 flex items-center mt-2 p-3 bg-[#000] rounded-sm border border-red-900/60">
                <div className="flex items-center h-4">
                  <input
                    id="isAdult"
                    type="checkbox"
                    checked={isAdult}
                    onChange={(e) => setIsAdult(e.target.checked)}
                    className="w-4 h-4 text-red-600 bg-[#111] border-[#333] rounded-sm focus:ring-red-500/50 focus:ring-2 cursor-pointer"
                  />
                </div>
                <label htmlFor="isAdult" className="ml-3 text-xs font-bold text-red-400 cursor-pointer select-none uppercase tracking-wide">
                  18+ Kontent (kirishda yosh haqida ogohlantirish chiqadi)
                </label>
              </div>

            </div>

            <div className="pt-6 flex justify-end gap-3">
              {editingAnime && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-[#222] hover:bg-[#333] text-white font-bold py-2.5 px-6 rounded-sm transition-colors"
                >
                  Bekor qilish
                </button>
              )}
              <button
                type="submit"
                className="bg-[#ff006a] hover:bg-[#d40058] text-white font-bold py-2.5 px-6 rounded-sm transition-colors flex items-center"
              >
                {editingAnime ? <Check size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                {editingAnime ? "O'zgarishlarni Saqlash" : "Animeni Chop Etish"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Tab 3: Manage Seasons & Episodes (Dynamic Layout) */}
      {activeTab === 'episodes' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222] rounded-sm p-5 sm:p-8 space-y-6"
        >
          {/* Header with Add Season Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-4">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-[#ff006a]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Fasllar va Epizodlar
              </h2>
            </div>
            <button
              type="button"
              onClick={() => alert("Yangi fasl qo'shish xususiyati tez orada ishga tushadi!")}
              className="px-4 py-2 border border-[#222] hover:border-[#ff006a]/50 text-xs text-white/80 hover:text-white font-bold rounded-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={14} className="text-[#ff006a]" />
              Fasl Qo'shish
            </button>
          </div>

          {/* Anime Selection Dropdown */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider">
              FILMNI TANLANG (Select anime series)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tv className="h-4 w-4 text-white/30" />
              </div>
              <select
                required
                value={selectedAnimeId}
                onChange={(e) => setSelectedAnimeId(e.target.value)}
                className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff006a]/50 appearance-none transition-colors"
              >
                <option value="" disabled>Sevimli animeni ro'yxatdan tanlang...</option>
                {animes.map(anime => (
                  <option key={anime.id} value={anime.id}>
                    {anime.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Season and Episode Listing */}
          {selectedAnimeId ? (
            <div className="space-y-6 pt-2">
              {/* Season 1 block */}
              <div className="bg-black/40 border border-[#222] rounded-sm p-4 sm:p-6 space-y-6">
                
                {/* Season Title and Add Episode Action */}
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff006a]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">1-FASL</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddBlankEpisodeCard}
                      className="px-4 py-2 bg-[#ff006a] hover:bg-[#d40058] text-xs font-bold text-white rounded-sm uppercase tracking-wider transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Qism Qo'shish
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Faslni o'chirib bo'lmaydi. Kamida 1 ta fasl bo'lishi shart.")}
                      className="p-2 text-white/30 hover:text-red-500 transition-colors"
                      title="Faslni o'chirish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Grid of Episode cards */}
                {episodesList.length === 0 ? (
                  <div className="text-center py-12 text-white/40 text-xs bg-[#050505] rounded-sm border border-[#222] border-dashed">
                    Fikrlar va qismlar hozircha mavjud emas. Yuqoridagi "+ QISM QO'SHISH" tugmasini bosing!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {episodesList.map((ep, idx) => {
                      const inputId = `file-upload-${ep.episode_number}`;
                      const isTelegramUrl = ep.video_url && (ep.video_url.includes('t.me') || ep.video_url.includes('telegram'));
                      return (
                        <div 
                          key={idx}
                          className="bg-[#050505] border border-[#222] rounded-sm p-4 space-y-4 hover:border-white/10 transition-colors relative"
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-white/80 uppercase tracking-widest bg-[#111] px-2 py-1 rounded border border-[#222]">
                              {ep.episode_number}-qism
                            </span>
                            
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isTelegramUrl) {
                                    handleLocalUrlChange(ep.episode_number, '');
                                  }
                                }}
                                className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase transition-colors cursor-pointer border ${
                                  !isTelegramUrl
                                    ? 'bg-[#111] border-[#ff006a] text-white font-black'
                                    : 'bg-[#000] border-[#222] text-white/40 hover:text-white'
                                }`}
                              >
                                Video
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isTelegramUrl) {
                                    handleLocalUrlChange(ep.episode_number, 'https://t.me/Animem_uz_bot?start=one_pice');
                                  }
                                }}
                                className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase transition-colors cursor-pointer border ${
                                  isTelegramUrl
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-black'
                                    : 'bg-[#000] border-[#222] text-white/40 hover:text-white'
                                }`}
                              >
                                Telegram
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteEpisode(ep.episode_number)}
                              className="text-white/30 hover:text-red-500 transition-colors p-1"
                              title="Qismni o'chirish"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* URL input and upload button block */}
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              {/* Video URL Input */}
                              <input
                                type="text"
                                placeholder={isTelegramUrl ? "https://t.me/Animem_uz_bot?start=..." : "https://ia601904.us.archive.org/2/items/..."}
                                value={ep.video_url || ''}
                                onChange={(e) => handleLocalUrlChange(ep.episode_number, e.target.value)}
                                className="flex-1 bg-black border border-[#222] rounded-sm px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                              />

                              {/* Upload action hidden and button (Only for non-Telegram URLs) */}
                              {!isTelegramUrl && (
                                <>
                                  <input
                                    id={inputId}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleUploadFileToArchive(ep.episode_number, file);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    disabled={uploadProgress[ep.episode_number]?.status === 'uploading' || uploadProgress[ep.episode_number]?.status === 'processing'}
                                    onClick={() => document.getElementById(inputId)?.click()}
                                    className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed border border-[#222] hover:border-white/10 rounded-sm text-xs text-white font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Video size={13} className="text-[#ff006a]" />
                                    Qurilmadan
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Upload Progress Bar */}
                            {uploadProgress[ep.episode_number] && (
                              <div className="space-y-1.5 p-2 bg-black/60 border border-white/5 rounded-sm">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-white/60 truncate max-w-[150px]">
                                    {uploadProgress[ep.episode_number].status === 'completed' ? 'Muvaffaqiyatli yuklandi' : 
                                     uploadProgress[ep.episode_number].status === 'processing' ? 'Archive.org saytiga yuklanmoqda (Kuting)...' : 
                                     uploadProgress[ep.episode_number].status === 'failed' ? 'Yuklashda xatolik!' : 'Serverga yuklanmoqda...'}
                                  </span>
                                  <span className="text-[#ff006a]">
                                    {uploadProgress[ep.episode_number].percent}%
                                  </span>
                                </div>
                                <div className="w-full bg-[#1c1c1e] h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-300 ${uploadProgress[ep.episode_number].status === 'failed' ? 'bg-red-500' : uploadProgress[ep.episode_number].status === 'completed' ? 'bg-green-500' : 'bg-[#ff006a]'}`}
                                    style={{ width: `${uploadProgress[ep.episode_number].percent}%` }}
                                  />
                                </div>
                                <p className="text-[9px] text-white/30 truncate">
                                  {uploadProgress[ep.episode_number].filename}
                                </p>
                              </div>
                            )}

                            {/* Subtext display */}
                            <p className="text-[10px] text-white/30 truncate select-none">
                              {ep.video_url ? (isTelegramUrl ? "Telegram bot yoki kanal havolasi" : ep.video_url) : "Video manbasini kiriting yoki qurilmadan yuklang"}
                            </p>

                            {/* Save URL Action Button */}
                            <button
                              type="button"
                              onClick={() => handleSaveEpisode(ep.episode_number, ep.video_url)}
                              className="w-full py-2.5 bg-[#111] hover:bg-[#ff006a] text-white/90 hover:text-white border border-[#222] hover:border-transparent text-xs font-extrabold rounded-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                            >
                              <Check size={14} className="text-[#ff006a] group-hover:text-white" />
                              Saqlash
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-[#222] border-dashed rounded-sm bg-black/10">
              <Tv className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white/60 uppercase">Fasllar va qismlarni ko'rish</h4>
              <p className="text-xs text-white/30 mt-1 max-w-xs mx-auto">Iltimos, yuqoridagi ro'yxatdan anime yoki film tanlang.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AdminNotifications />
        </motion.div>
      )}

      {/* Tab 5: Mangalar */}
      {activeTab === 'mangas' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AdminMangalar token={token || ''} />
        </motion.div>
      )}

      {/* Tab 6: Foydalanuvchilar */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AdminUsers token={token || ''} />
        </motion.div>
      )}

      {/* Tab 6: Donatlar */}
      {activeTab === 'donations' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AdminDonatlar />
        </motion.div>
      )}
    </div>
  );
}
