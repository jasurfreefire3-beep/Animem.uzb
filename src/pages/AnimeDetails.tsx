import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Anime, Comment, translateGenre, toSlug } from '../types';
import { Star, MessageSquare, Send, Clock, Play, Plus, Calendar, Building, ListOrdered, Share2, Heart, Flag, PlayCircle, Eye, Shield, Moon, Sun, Trash2, Trophy, X, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VideoPlayer from '../components/VideoPlayer';
import AgeGate from '../components/AgeGate';
import AdBanner728x90 from '../components/AdBanner728x90';
import NativeBannerAd from '../components/NativeBannerAd';

export default function AnimeDetails() {
  const params = useParams();
  const { slug } = params;
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const [anime, setAnime] = useState<Anime | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [episodesList, setEpisodesList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeEpisode, setActiveEpisode] = useState(1);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<string | null>(null);
  const [ratingSummary, setRatingSummary] = useState<{ average: number; total: number; distribution: Record<number, number> } | null>(null);
  const [similarAnimes, setSimilarAnimes] = useState<Anime[]>([]);
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
  const [adultConfirmed, setAdultConfirmed] = useState(
    () => localStorage.getItem('animem_18plus_ok') === '1'
  );

  const fetchRatingSummary = async (animeId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/animes/${animeId}/ratings-summary`);
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setRatingSummary(data);
      }
    } catch (err) {
      console.error("Error fetching rating summary:", err);
    }
  };

  useEffect(() => {
    const fetchAllDetails = async () => {
      try {
        console.log("Fetching anime details for slug:", slug);
        if (!slug) return;
        const res = await fetch(`${API_BASE}/api/animes/by-slug/${slug}`);
        console.log("Response status:", res.status);
        const resType = res.headers.get("content-type");
        if (!res.ok || !resType || !resType.includes("application/json")) {
          console.error("Fetch failed or non-JSON response:", res.status);
          return;
        }
        const data = await res.json();
        console.log("Fetched anime:", data);
        setAnime(data);
        fetchRatingSummary(data.id);
        if (data.video_url) {
          setCurrentVideoUrl(data.video_url);
        }

        // Fetch user rating
        if (user && token) {
            fetch(`${API_BASE}/api/animes/${data.id}/rating`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => {
              const contentType = res.headers.get("content-type");
              if (res.ok && contentType && contentType.includes("application/json")) {
                return res.json();
              }
              return { rating: 0 };
            })
            .then(data => setUserRating(data.rating || 0))
            .catch(err => console.error(err));
        }

        // Check if currently favorited
        const savedFavs = localStorage.getItem('anime_favorites');
        if (savedFavs) {
          try {
            const favIds = JSON.parse(savedFavs);
            setIsFavorited(favIds.some((favId: any) => String(favId) === String(data.id)));
          } catch (e) {
            console.error(e);
          }
        }

        // Fetch episodes
        const epRes = await fetch(`${API_BASE}/api/animes/${data.id}/episodes`);
        const epType = epRes.headers.get("content-type");
        if (epRes.ok && epType && epType.includes("application/json")) {
          const eps = await epRes.json();
          setEpisodesList(eps);
          const ep1 = eps.find((e: any) => e.episode_number === 1);
          if (ep1 && ep1.video_url) {
            setCurrentVideoUrl(ep1.video_url);
          }
        }

        // Fetch comments
        const commRes = await fetch(`${API_BASE}/api/animes/${data.id}/comments`);
        const commType = commRes.headers.get("content-type");
        if (commRes.ok && commType && commType.includes("application/json")) {
          const coms = await commRes.json();
          setComments(coms);
        }

        // Fetch similar animelar for sidebar
        const listRes = await fetch(`${API_BASE}/api/animes`);
        const listType = listRes.headers.get("content-type");
        if (listRes.ok && listType && listType.includes("application/json")) {
          const listData = await listRes.json();
          const filtered = listData.filter((item: Anime) => String(item.id) !== String(data.id));
          setSimilarAnimes(filtered.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchAllDetails();
    window.scrollTo(0, 0);
  }, [slug, user]);

  useEffect(() => {
    if (anime) {
      document.title = `${anime.title} - O'zbek tilida ko'rish | Animem.uz`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `${anime.title} o'zbek tilida HD formatda onlayn tomosha qilish. ${anime.description ? anime.description.substring(0, 180).trim() : ''}`);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', `${anime.title} - O'zbek tilida ko'rish | Animem.uz`);
      }
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && anime.image_url) {
        ogImage.setAttribute('content', anime.image_url);
      }
    } else {
      document.title = "Animem Uz - O'zbekistondagi eng yirik anime portali";
    }
  }, [anime]);

  // Enhanced SEO: canonical, OG, Twitter, JSON-LD
  useEffect(() => {
    if (!anime) return;

    try {
      const canonicalUrl = `${window.location.origin}/anime/${toSlug(anime.title || '')}`;

      // canonical link
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonicalUrl);

      // og:description
      let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', anime.description ? anime.description.substring(0, 200).trim() : `${anime.title} - Animem.uz`);

      // twitter card
      let twCard = document.querySelector('meta[name="twitter:card"]') as HTMLMetaElement | null;
      if (!twCard) {
        twCard = document.createElement('meta');
        twCard.setAttribute('name', 'twitter:card');
        document.head.appendChild(twCard);
      }
      twCard.setAttribute('content', 'summary_large_image');

      let twTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement | null;
      if (!twTitle) { twTitle = document.createElement('meta'); twTitle.setAttribute('name', 'twitter:title'); document.head.appendChild(twTitle); }
      twTitle.setAttribute('content', `${anime.title} - Animem.uz`);

      let twImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement | null;
      if (!twImage) { twImage = document.createElement('meta'); twImage.setAttribute('name', 'twitter:image'); document.head.appendChild(twImage); }
      if (anime.image_url) twImage.setAttribute('content', anime.image_url);

      // JSON-LD structured data
      const ldId = 'ld-json-anime';
      let ldScript = document.getElementById(ldId) as HTMLScriptElement | null;
      const isSeries = (anime.qismlar_soni && Number(anime.qismlar_soni) > 1);
      const ld = {
        '@context': 'https://schema.org',
        '@type': isSeries ? 'TVSeries' : 'Movie',
        'name': anime.title,
        'url': canonicalUrl,
        'image': anime.image_url || undefined,
        'description': anime.description || undefined,
        'genre': anime.janrlar || undefined,
        'datePublished': anime.created_at || undefined,
        'aggregateRating': anime.rating ? { '@type': 'AggregateRating', 'ratingValue': String(anime.rating), 'ratingCount': anime.rating_count || 0 } : undefined,
      };
      if (!ldScript) {
        ldScript = document.createElement('script');
        ldScript.id = ldId;
        ldScript.type = 'application/ld+json';
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(ld);
    } catch (e) {
      console.error('SEO meta injection error:', e);
    }
  }, [anime]);

  // Handle saving history when activeEpisode changes
  useEffect(() => {
    if (anime && anime.id) {
      const saveHistory = async () => {
        try {
          const savedHistory = localStorage.getItem('anime_history');
          let historyList = [];
          if (savedHistory) {
            try {
              historyList = JSON.parse(savedHistory);
            } catch (e) {
              console.error(e);
            }
          }
          historyList = historyList.filter((item: any) => String(item.animeId) !== String(anime.id));
          historyList.unshift({
            animeId: anime.id,
            viewedAt: new Date().toISOString(),
            lastEpisode: activeEpisode
          });
          historyList = historyList.slice(0, 20);
          localStorage.setItem('anime_history', JSON.stringify(historyList));
        } catch (e) {
          console.error(e);
        }
      };
      saveHistory();
    }
  }, [anime, activeEpisode]);

  const toggleFavorite = async () => {
    if (!anime) return;
    try {
      const savedFavs = localStorage.getItem('anime_favorites');
      let favIds = [];
      if (savedFavs) {
        try {
          favIds = JSON.parse(savedFavs);
        } catch (e) {
          console.error(e);
        }
      }

      let updatedFavs;
      const animeIdStr = String(anime.id);
      if (isFavorited) {
        updatedFavs = favIds.filter((favId: any) => String(favId) !== animeIdStr);
        setIsFavorited(false);
      } else {
        updatedFavs = [...favIds, anime.id];
        setIsFavorited(true);
      }
      localStorage.setItem('anime_favorites', JSON.stringify(updatedFavs));
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/anime/${toSlug(anime?.title || '')}`;
    if (navigator.share) {
      navigator.share({
        title: `${anime?.title} - O'zbek tilida ko'rish`,
        text: anime?.description?.slice(0, 100),
        url: shareUrl,
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRate = async (newRating: number) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!anime) return;
    try {
      setRatingStatus("Saqlanmoqda...");
      const res = await fetch(`${API_BASE}/api/animes/${anime.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newRating })
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        setRatingStatus("Sessiya muddati tugadi. Iltimos, qaytadan tizimga kiring.");
        setTimeout(() => setRatingStatus(null), 5000);
        return;
      }

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setUserRating(newRating);
        setAnime({ ...anime, rating: data.rating, rating_count: data.count });
        fetchRatingSummary(anime.id);
        setRatingStatus("Muvaffaqiyatli saqlandi!");
        setTimeout(() => setRatingStatus(null), 3000);
      } else {
        let errorMsg = "Xatolik yuz berdi";
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        }
        setRatingStatus(errorMsg);
        setTimeout(() => setRatingStatus(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setRatingStatus(err.message || "Ulanishda xatolik yuz berdi");
      setTimeout(() => setRatingStatus(null), 4000);
    }
  };

  const fetchComments = async () => {
    if (!anime) return;
    try {
      const res = await fetch(`${API_BASE}/api/animes/${anime.id}/comments`);
      if (res.ok) {
        const coms = await res.json();
        setComments(coms);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !anime) return;

    try {
      const res = await fetch(`${API_BASE}/api/animes/${anime.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      } else {
        console.error("Failed to add comment:", await res.text());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentDelete = async (commentId: string | number) => {
    if (!user || !commentId) return;
    if (window.confirm("Ushbu izohni o'chirmoqchimisiz?")) {
      try {
        const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          fetchComments();
        } else {
          console.error("Failed to delete comment:", await res.text());
        }
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!user) { setShowLoginPrompt(true); return; }
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(comments.map(c => String(c.id) === String(commentId) ? { ...c, likes: data.likes, dislikes: data.dislikes, liked_users: data.liked_users, disliked_users: data.disliked_users } : c));
      }
    } catch(e) {}
  };

  const handleDislikeComment = async (commentId: number) => {
    if (!user) { setShowLoginPrompt(true); return; }
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}/dislike`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(comments.map(c => String(c.id) === String(commentId) ? { ...c, likes: data.likes, dislikes: data.dislikes, liked_users: data.liked_users, disliked_users: data.disliked_users } : c));
      }
    } catch(e) {}
  };

  const handleReplySubmit = async (commentId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowLoginPrompt(true); return; }
    const text = replyText[commentId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: text })
      });
      if (res.ok) {
        const newReply = await res.json();
        setComments(comments.map(c => {
          if (String(c.id) === String(commentId)) {
            return { ...c, replies: [...(c.replies || []), newReply] };
          }
          return c;
        }));
        setReplyText({ ...replyText, [commentId]: '' });
        setReplyingCommentId(null);
      }
    } catch(e) {}
  };

  if (!anime) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
    </div>
  );

  if (anime.is_adult && !adultConfirmed) {
    return (
      <AgeGate
        title={anime.title}
        poster={anime.image_url}
        onConfirm={() => {
          localStorage.setItem('animem_18plus_ok', '1');
          setAdultConfirmed(true);
        }}
        onBack={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      />
    );
  }

  const genres = anime.janrlar ? anime.janrlar.split(',').map(g => g.trim()) : [];
  const episodesCount = anime.qismlar_soni || 1;
  const generatedEpisodes = Array.from({ length: episodesCount }, (_, i) => i + 1);

  // Merge generated and fetched episodes
  const combinedEpisodes = generatedEpisodes.map(epNum => {
    const fetchedEp = Array.isArray(episodesList) ? episodesList.find(e => e.episode_number === epNum) : null;
    return {
      number: epNum,
      video_url: fetchedEp ? fetchedEp.video_url : (epNum === 1 ? anime.video_url : null)
    };
  });

  const handleEpisodeClick = (ep: any) => {
    setActiveEpisode(ep.number);
    if (ep.video_url) {
      setCurrentVideoUrl(ep.video_url);
    } else {
      setCurrentVideoUrl(anime?.video_url || '');
    }
    const playerEl = document.getElementById('player-section');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": `${anime.title} - O'zbek tilida ko'rish - Animem.uz`,
    "alternateName": anime.title,
    "image": anime.image_url,
    "description": anime.description,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": anime.rating || 9.2,
      "reviewCount": anime.rating_count || 32
    },
    "genre": genres.map(g => translateGenre(g)),
    "dateCreated": anime.yil || 2026,
    "provider": {
      "@type": "Organization",
      "name": "Animem Uz",
      "url": "https://animem.uz",
      "logo": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSF45hYamscf6EOEVfza62xM3PmDvOBibTRYEmsaMscyw&s=10"
    }
  };

  return (
    <div className="space-y-8 pb-20 relative">
      {/* Google SEO JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>

      {/* Lights Off (Theater Mode) Backdrop */}
      {lightsOff && (
        <div 
          onClick={() => setLightsOff(false)} 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-40 transition-all duration-500 cursor-pointer"
        />
      )}

      {/* Immersive Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full md:h-[55vh] md:min-h-[450px] bg-[#09090b] pt-24 pb-12 md:py-0 flex items-end"
      >
        {/* Background Image Banner */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img loading="lazy" decoding="async" 
            src={anime.banner_url || anime.image_url} 
            alt={`${anime.title} banner`} 
            title={anime.title}
            className="w-full h-full object-cover opacity-35 md:opacity-100 scale-105 blur-[2px] md:blur-0 transition-all duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 md:via-[#09090b]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/75 to-transparent hidden md:block" />
        </div>
        
        <div className="relative w-full px-4 md:px-8 z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end max-w-7xl mx-auto">
             {/* Poster Overlay */}
             <div className="w-32 sm:w-36 md:w-48 shrink-0 rounded-sm overflow-hidden shadow-2xl border border-white/10 transform translate-y-0 md:translate-y-16 hover:scale-105 transition-transform duration-300">
               <img loading="lazy" decoding="async" src={anime.image_url} alt={anime.title} title={anime.title} className="w-full h-full object-cover aspect-[3/4]" />
             </div>
             
             {/* Title & Meta */}
             <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-[#ff006a] text-white text-[9px] uppercase font-bold rounded-sm tracking-wider shadow-[0_0_12px_rgba(255,0,106,0.4)]">
                    {anime.holati === 'Yakunlangan' ? 'YAKUNLANGAN' : 'EFIRDA'}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold px-2.5 py-1 bg-black/60 rounded-sm border border-white/5">
                    <Star className="w-3 h-3 fill-current" /> {anime.rating ? Number(anime.rating).toFixed(1) : '9.2'}
                  </span>
                  <span className="text-white/80 text-xs font-medium flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-sm border border-white/5">
                    <Calendar className="w-3 h-3" /> {anime.yil || '2026'}
                  </span>
                  <span className="text-white/80 text-xs font-medium flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-sm border border-white/5 max-w-[150px] truncate">
                    <Building className="w-3 h-3" /> {anime.studiyasi || 'Studio'}
                  </span>
                  <span className="text-white/80 text-xs font-medium flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-sm border border-white/5">
                    <Eye className="w-3.5 h-3.5 text-[#ff006a]" /> {anime.korishlar || 0} ta ko'rish
                  </span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 leading-tight tracking-tight uppercase">
                  {anime.title}
                </h1>
                
                <div className="text-white/40 text-xs font-medium mb-5">Original nomi · TV Serial</div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-4">
                  {genres.map(g => (
                    <span key={g} className="bg-[#18181b] hover:bg-[#ff006a] text-white/70 hover:text-white text-xs font-bold px-3 py-1.5 rounded-sm transition-colors cursor-pointer border border-[#27272a] hover:border-[#ff006a] shadow-xs">
                      {translateGenre(g)}
                    </span>
                  ))}
                </div>

                {anime.tags && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-6">
                    {anime.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="bg-white/5 border border-white/10 text-white/60 hover:text-white text-[11px] font-medium px-2.5 py-0.5 rounded-sm transition-colors">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5 ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star} 
                            onClick={() => {
                              const section = document.getElementById('ratings-section');
                              if (section) {
                                section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }} 
                            className="text-yellow-400 hover:scale-110 transition-transform cursor-pointer"
                            title="Baholash bo'limiga o'tish"
                        >
                            <Star className={`w-4 h-4 ${star <= Math.round((anime.rating || 9.2) / 2) ? 'text-[#ff9900] fill-[#ff9900]' : 'text-gray-600'}`} />
                        </button>
                    ))}
                    <span className="text-white/40 text-[10px] ml-2">({anime.rating_count || 0} baho)</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      const playerSec = document.getElementById('player-section');
                      if (playerSec) {
                        playerSec.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="bg-[#ff006a] hover:bg-[#d40058] text-white px-8 py-3 rounded-sm font-black flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#ff006a]/25 text-sm uppercase tracking-wider"
                  >
                    <Play className="w-4 h-4 fill-current" /> TOMOSHA QILISH
                  </button>
                  <button 
                    onClick={toggleFavorite}
                    className={`px-8 py-3 rounded-sm font-black transition-all flex items-center justify-center gap-2 text-sm border uppercase tracking-wider ${
                      isFavorited 
                        ? 'bg-[#ff006a]/15 border-[#ff006a] text-white shadow-[0_0_15px_rgba(255,0,106,0.25)]' 
                        : 'bg-[#18181b] border-[#27272a] hover:bg-[#27272a] text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-[#ff006a]' : ''}`} /> 
                    {isFavorited ? 'SEVIMLILARDA' : 'SEVIMLILARGA QO\'SHISH'}
                  </button>
                </div>
             </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col xl:flex-row gap-6 mt-10 md:mt-20 max-w-7xl mx-auto px-4 md:px-8">
         {/* Main Left Content */}
         <div className="flex-1 space-y-6 min-w-0">
            {/* Synopsis */}
            <motion.section 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.3 }}
               className="bg-[#111] border border-[#222] rounded-sm p-6"
            >
               <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-wide">
                 <Eye className="w-4 h-4 text-[#ff006a]" /> Tavsif
               </h2>
               <p className="text-white/70 text-sm leading-relaxed text-justify">
                 {isExpanded ? anime.description : anime.description.slice(0, 300) + (anime.description.length > 300 ? '...' : '')}
               </p>
               {anime.description.length > 300 && (
                 <button 
                   onClick={() => setIsExpanded(!isExpanded)} 
                   className="text-[#ff006a] text-xs font-bold mt-2 hover:underline"
                 >
                   {isExpanded ? "Kamroq o'qish" : "Ko'proq o'qish"}
                 </button>
               )}
               <div className="flex gap-4 mt-6 pt-4 border-t border-[#222]">
                 <button onClick={handleShare} className="text-white/50 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors">
                   <Share2 className="w-3.5 h-3.5" /> {copied ? "Nusxalandi!" : "Ulashish"}
                 </button>
                 <button className="text-white/50 hover:text-[#ff006a] text-xs font-medium flex items-center gap-1.5 transition-colors">
                   <Flag className="w-3.5 h-3.5" /> Xabar berish
                  </button>
                  <button 
                    onClick={() => setLightsOff(!lightsOff)}
                    className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${lightsOff ? 'text-[#ff006a]' : 'text-white/50 hover:text-white'}`}
                  >
                    {lightsOff ? (
                      <>
                        <Sun className="w-3.5 h-3.5" /> Chiroqni yoqish
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5" /> Chiroqni o'chirish
                      </>
                    )}
                 </button>
               </div>
            </motion.section>

            {/* Player Section */}
            <motion.section 
               id="player-section"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className={`bg-transparent md:bg-[#111] md:border md:border-[#222] rounded-none md:rounded-sm p-0 md:p-6 relative transition-all duration-300 ${lightsOff ? 'z-50 ring-4 ring-[#ff006a]/25 shadow-[0_0_50px_rgba(255,0,106,0.25)] bg-[#111] border-[#ff006a]/35' : 'z-10'}`}
            >
               <div className="flex items-center justify-between mb-4 px-4 md:px-0">
                 <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                   <PlayCircle className="w-4 h-4 text-[#ff006a]" /> Player
                 </h2>
                 <div className="bg-[#18181b] border border-[#27272a] md:bg-[#222] md:border-0 px-3 py-1 rounded text-[10px] font-bold text-[#ff006a] uppercase">
                   Ep {activeEpisode} tomosha qilinmoqda
                 </div>
               </div>

               <div className="-mx-4 sm:mx-0 mb-3 md:mb-4">
                 {(currentVideoUrl || anime.video_url || '').includes('t.me') ? (
                    <div className="w-full min-h-[250px] sm:min-h-[360px] md:min-h-[480px] bg-[#0a0a0c] border border-white/10 sm:rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                      <div className="w-12 h-12 sm:w-20 sm:h-20 bg-[#0088cc]/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 shrink-0">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-10 sm:h-10 fill-[#0088cc]">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.34.52-.41-.01-1.21-.23-1.8-.42-.73-.24-1.32-.37-1.27-.78.02-.21.31-.43.87-.67 3.42-1.49 5.71-2.48 6.86-2.96 3.27-1.37 3.95-1.61 4.4-.1.01.03.02.05.02.08.01.12.01.25-.01.37z" />
                        </svg>
                      </div>
                      <h3 className="text-base sm:text-2xl font-black text-white mb-2 sm:mb-3">Bu qismni Telegram botimizda tomosha qiling!</h3>
                      <p className="text-xs sm:text-base text-white/60 max-w-lg mb-6 sm:mb-8">
                        Video fayl hajmi kattaligi sababli, ushbu anime qismi to'g'ridan-to'g'ri Telegram botimizga yuklangan.
                      </p>
                      <a 
                        href={currentVideoUrl || anime.video_url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 sm:gap-3 px-5 py-3 sm:px-8 sm:py-4 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs sm:text-base rounded-lg transition-all shadow-[0_0_20px_rgba(0,136,204,0.3)] hover:shadow-[0_0_30px_rgba(0,136,204,0.5)] hover:-translate-y-1 shrink-0"
                      >
                        <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        Botga o'tish va ko'rish
                      </a>
                    </div>
                 ) : (
                    <VideoPlayer 
                      url={currentVideoUrl || anime.video_url || '/assets/sample/video.mp4'} 
                      poster={anime.banner_url || anime.image_url} 
                      animeTitle={anime.title} 
                    />
                 )}
               </div>

               {/* Episode Selector */}
               <div className="animem-episodes-panel px-4 md:px-6 py-5">
                  <h3 className="text-xs font-bold text-[#ff9ac5] uppercase tracking-widest mb-4 flex items-center gap-2">
                     <ListOrdered className="w-3.5 h-3.5" /> Qismlar
                  </h3>
                  <div className="flex flex-wrap gap-3">
                     {combinedEpisodes.map(ep => (
                        <button 
                           key={ep.number}
                           onClick={() => handleEpisodeClick(ep)}
                           className={`w-14 h-12 rounded-xl text-sm font-semibold transition-all flex items-center justify-center border ${
                              activeEpisode === ep.number 
                                 ? 'bg-[#1b0b16] border-[#ff006a] text-white shadow-[0_0_18px_rgba(255,0,106,0.42)]'
                              : ep.video_url
                                    ? 'bg-[#171720] hover:bg-[#281421] hover:border-[#ff006a]/50 border-white/10 text-white'
                                    : 'bg-[#09090b] text-white/10 border border-[#1a1a1a] cursor-not-allowed'
                           }`}
                        >
                           {ep.number}
                        </button>
                     ))}
                  </div>
               </div>
            </motion.section>

            {/* 728x90 Advertisement Banner */}
            <AdBanner728x90 />

            {/* Native Banner Advertisement */}
            <NativeBannerAd />

            {/* Reyting va Sharhlar Section */}
            {anime && (
              <motion.section
                id="ratings-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="bg-[#111] border border-[#222] rounded-sm p-6 my-6"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#222] mb-6">
                  {/* Left Side: Trophy & Titles */}
                  <div className="flex items-center gap-4">
                    {/* Golden-bordered box for Trophy */}
                    <div className="w-16 h-16 bg-[#ff9900]/10 border border-[#ff9900]/30 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,153,0,0.1)]">
                      <Trophy className="w-7 h-7 text-[#ff9900]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-white tracking-wide">
                        Reyting va Sharhlar
                      </h2>
                      <p className="text-white/40 text-xs mt-1">
                        Boshqa foydalanuvchilarning fikrlari va baholari
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Average Rating Only */}
                  <div className="flex items-center gap-4 bg-[#161618] border border-[#222] px-6 py-4 rounded-xl shrink-0">
                    <div>
                      <div className="text-3xl font-black text-[#ff9900] flex items-baseline gap-1">
                        {ratingSummary?.average !== undefined ? ratingSummary.average : (anime.rating ? Number(anime.rating).toFixed(1) : '0.0')}
                        <span className="text-sm font-medium text-white/30">/10</span>
                      </div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-0.5">
                        O'rtacha baho
                      </p>
                    </div>
                  </div>
                </div>
                 {/* Bottom Grid: Your Rating vs Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                  {/* Left Col: Your Rating */}
                  <div className="lg:col-span-6 bg-[#161618] border border-[#222] rounded-xl p-4 sm:p-6 flex flex-col justify-between min-h-[200px] sm:min-h-[220px]">
                    <div>
                      <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4">
                        Sizning bahoingiz
                      </h3>
                      
                      {/* 10 Stars Row (Fluid & Responsive Grid) */}
                      <div className="grid grid-cols-10 gap-1 sm:gap-2 mb-4 max-w-full" onMouseLeave={() => setHoveredStar(null)}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => {
                          const isHighlighted = (hoveredStar !== null ? hoveredStar : userRating) >= starVal;
                          return (
                            <button
                              key={starVal}
                              onClick={() => {
                                handleRate(starVal);
                                setHoveredStar(null);
                              }}
                              onMouseEnter={() => setHoveredStar(starVal)}
                              className="aspect-square w-full min-w-0 flex items-center justify-center transition-all transform hover:scale-125 focus:outline-none cursor-pointer"
                              title={user ? `${starVal} ball` : "Ovoz berish uchun tizimga kiring"}
                            >
                              <Star
                                className={`w-full h-full max-w-[28px] max-h-[28px] transition-colors ${
                                  isHighlighted 
                                    ? 'text-[#ff9900] fill-[#ff9900]' 
                                    : 'text-white/20 hover:text-[#ff9900]/60'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      {/* Status/Helper Text with live save status */}
                      <p className="text-xs italic text-[#ff9900] font-medium min-h-[1.25rem]">
                        {ratingStatus ? (
                          <span className={ratingStatus.includes("Xatolik") ? "text-red-500 font-bold" : "text-green-400 font-bold"}>
                            {ratingStatus}
                          </span>
                        ) : !user ? (
                          "Baholash uchun tizimga kiring"
                        ) : userRating > 0 ? (
                          `Siz ${userRating} ball berdingiz!`
                        ) : (
                          "Baholash uchun yulduzchalarni bosing"
                        )}
                      </p>
                    </div>

                    {/* Sharh Yozish Button */}
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          const el = document.getElementById('comment-textarea');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.focus();
                          } else {
                            const section = document.getElementById('comment-section');
                            if (section) {
                              section.scrollIntoView({ behavior: 'smooth' });
                            }
                          }
                        }}
                        className="flex items-center gap-2 border border-white/10 hover:border-[#ff006a]/40 bg-[#222]/30 hover:bg-[#ff006a]/10 text-white hover:text-[#ff006a] font-bold text-xs px-5 py-3 rounded-lg uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Sharh yozish
                      </button>
                    </div>
                  </div>

                  {/* Right Col: Rating Distribution */}
                  <div className="lg:col-span-6 bg-[#161618] border border-[#222] rounded-xl p-6">
                    <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4">
                      Baholar taqsimoti
                    </h3>

                    <div className="space-y-2.5">
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((ratingVal) => {
                        const count = ratingSummary?.distribution?.[ratingVal] || 0;
                        const total = ratingSummary?.total || 0;
                        const percentage = total > 0 ? (count / total) * 100 : 0;

                        return (
                          <div key={ratingVal} className="flex items-center gap-3">
                            {/* Rating Label */}
                            <span className="w-5 text-right text-xs font-bold text-white/60 font-mono">
                              {ratingVal}
                            </span>
                            {/* Small Star */}
                            <Star className="w-3.5 h-3.5 text-[#ff9900] fill-[#ff9900] shrink-0" />
                            
                            {/* Progress Bar Container */}
                            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.03]">
                              <div
                                className="h-full bg-gradient-to-r from-[#ff9900] to-[#ffb84d] rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            {/* Count Text */}
                            <span className="w-10 text-xs font-medium text-white/40 text-right font-mono">
                              {count} ta
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Comments Section */}
            <motion.section 
               id="comment-section"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5 }}
               className="bg-[#111] border border-[#222] rounded-sm p-6"
            >
               <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-6 uppercase tracking-wide">
                  <MessageSquare className="w-4 h-4 text-white/50" /> Comments ({comments.length})
               </h2>

               {user ? (
                  <div className="bg-[#1a1a1a] p-4 rounded-sm border border-[#222] mb-6">
                     <div className="flex items-center gap-2 mb-3">
                        {user.avatar_url ? (
                           <img loading="lazy" decoding="async" 
                              src={user.avatar_url} 
                              alt={user.name} 
                              className="w-6 h-6 rounded-full object-cover border border-[#ff006a]/40 shrink-0" 
                           />
                        ) : (
                           <div className="w-6 h-6 bg-[#333] rounded-sm flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                           </div>
                        )}
                        <span className="text-white/70 text-xs font-medium">{user.name}</span>
                     </div>
                     <form onSubmit={handleCommentSubmit}>
                        <textarea
                           id="comment-textarea"
                           value={newComment}
                           onChange={(e) => setNewComment(e.target.value)}
                           placeholder="Add a comment..."
                           className="w-full bg-[#000] border border-[#222] rounded-sm p-3 text-white text-sm focus:outline-none focus:border-[#ff006a]/50 resize-none h-20 mb-3 transition-colors placeholder:text-white/30"
                        />
                        <div className="flex justify-end">
                           <button type="submit" className="bg-[#ff006a] hover:bg-[#d40058] text-white px-5 py-2 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-colors">
                              <Send size={14}/> Post
                           </button>
                        </div>
                     </form>
                  </div>
               ) : (
                  <div className="bg-[#1a1a1a] p-6 rounded-sm mb-6 text-center border border-[#222]">
                     <p className="text-white/50 text-sm mb-3">Please login to join the discussion.</p>
                     <Link to="/login" className="inline-block bg-[#ff006a] hover:bg-[#d40058] text-white font-bold text-xs px-6 py-2 rounded-sm transition-colors">
                       Login
                     </Link>
                  </div>
               )}

               <div className="space-y-4">
                  {comments.map((comment, idx) => {
                     const avatarSrc = comment.user_avatar || comment.avatar_url;
                     const likedUsers = Array.isArray(comment.liked_users) ? comment.liked_users : [];
                     const dislikedUsers = Array.isArray(comment.disliked_users) ? comment.disliked_users : [];
                     const isLiked = user ? likedUsers.includes(user.id) : false;
                     const isDisliked = user ? dislikedUsers.includes(user.id) : false;
                     const replies = Array.isArray(comment.replies) ? comment.replies : [];

                     return (
                        <motion.div 
                           initial={{ opacity: 0, y: 5 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: idx * 0.05 }}
                           key={comment.id} 
                           className="bg-[#1a1a1a] p-4 rounded-sm border border-[#222] flex gap-3 relative group"
                        >
                           <Link to={`/user/${comment.user_id}`} className="shrink-0">
                              {avatarSrc ? (
                                 <img loading="lazy" decoding="async" 
                                    src={avatarSrc} 
                                    alt={comment.user_name} 
                                    className="shrink-0 w-11 h-11 rounded-full object-cover border-2 border-[#ff006a]/40 hover:border-[#ff006a] shadow-md transition-all" 
                                 />
                              ) : (
                                 <div className="shrink-0 w-11 h-11 bg-gradient-to-br from-[#2a2a2e] to-[#151518] rounded-full border-2 border-[#ff006a]/30 flex items-center justify-center text-[#ff006a] text-sm font-extrabold shadow-md hover:text-white transition-colors">
                                    {comment.user_name.charAt(0).toUpperCase()}
                                 </div>
                              )}
                           </Link>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                 <Link to={`/user/${comment.user_id}`} className="text-white/90 font-bold text-xs hover:text-[#ff006a] hover:underline transition-colors">
                                    {comment.user_name}
                                 </Link>
                                 <span className="text-white/30 text-[10px]">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                 </span>

                                 {/* Quick Reply button right next to name/header */}
                                 <button 
                                    onClick={() => setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id)}
                                    className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-[#ff006a]/20 text-[#ff006a] text-[10px] font-bold flex items-center gap-1 transition-all border border-[#ff006a]/20"
                                    title="Javob qaytarish"
                                 >
                                    <MessageCircle size={11} />
                                    <span>Javob berish</span>
                                 </button>

                                 {user && (comment.user_id === user.id || user.role === 'admin') && (
                                    <button
                                       onClick={() => handleCommentDelete(comment.id)}
                                       className="text-white/30 hover:text-red-500 p-1 rounded hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer ml-auto"
                                       title="O'chirish"
                                    >
                                       <Trash2 size={13} />
                                    </button>
                                 )}
                              </div>
                              <p className="text-white/80 text-sm leading-relaxed mb-3">{comment.content}</p>

                              {/* Action buttons: Like, Dislike, Reply */}
                              <div className="flex items-center gap-4 text-xs text-white/50">
                                 <button 
                                    onClick={() => handleLikeComment(comment.id)}
                                    className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${isLiked ? 'text-emerald-400 font-bold' : ''}`}
                                 >
                                    <ThumbsUp size={13} className={isLiked ? 'fill-emerald-400' : ''} />
                                    <span>{comment.likes || 0}</span>
                                 </button>
                                 <button 
                                    onClick={() => handleDislikeComment(comment.id)}
                                    className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${isDisliked ? 'text-red-400 font-bold' : ''}`}
                                 >
                                    <ThumbsDown size={13} className={isDisliked ? 'fill-red-400' : ''} />
                                    <span>{comment.dislikes || 0}</span>
                                 </button>
                                 <button 
                                    onClick={() => setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id)}
                                    className="flex items-center gap-1.5 hover:text-[#ff006a] text-white/60 transition-colors cursor-pointer"
                                 >
                                    <MessageCircle size={13} />
                                    <span>Javob yozish</span>
                                 </button>
                              </div>

                              {/* Replies list */}
                              {replies.length > 0 && (
                                 <div className="mt-4 pl-4 border-l-2 border-[#ff006a]/30 space-y-3">
                                    {replies.map((rep: any) => (
                                       <div key={rep.id} className="bg-[#141414] p-3 rounded-lg border border-[#222] flex gap-2.5 items-start">
                                          {rep.user_avatar ? (
                                             <img loading="lazy" decoding="async" src={rep.user_avatar} alt={rep.user_name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />
                                          ) : (
                                             <div className="w-8 h-8 rounded-full bg-[#222] text-[#ff006a] font-bold text-xs flex items-center justify-center shrink-0 border border-white/10">
                                                {rep.user_name?.charAt(0).toUpperCase() || 'U'}
                                             </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className="text-white/90 text-xs font-bold">{rep.user_name}</span>
                                                <span className="text-white/35 text-[9px] ml-auto">{new Date(rep.created_at).toLocaleDateString()}</span>
                                             </div>
                                             <p className="text-white/70 text-xs leading-relaxed">{rep.content}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {/* Reply input form */}
                              {replyingCommentId === comment.id && (
                                 <form onSubmit={(e) => handleReplySubmit(comment.id, e)} className="mt-3 pt-3 border-t border-[#222]">
                                    <textarea
                                       value={replyText[comment.id] || ''}
                                       onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                                       placeholder="Javob yozish..."
                                       className="w-full bg-[#000] border border-[#222] rounded-sm p-2 text-white text-xs focus:outline-none focus:border-[#ff006a]/50 resize-none h-16 mb-2 placeholder:text-white/30"
                                    />
                                    <div className="flex justify-end gap-2">
                                       <button 
                                          type="button" 
                                          onClick={() => setReplyingCommentId(null)}
                                          className="px-3 py-1 rounded bg-[#222] hover:bg-[#333] text-white/70 text-xs font-bold transition-colors"
                                       >
                                          Bekor qilish
                                       </button>
                                       <button 
                                          type="submit" 
                                          className="px-3 py-1 rounded bg-[#ff006a] hover:bg-[#d40058] text-white text-xs font-bold transition-colors flex items-center gap-1"
                                       >
                                          <Send size={11} /> Yuborish
                                       </button>
                                    </div>
                                 </form>
                              )}
                           </div>
                        </motion.div>
                     );
                  })}
                  {comments.length === 0 && (
                     <div className="text-center text-white/40 text-sm py-8 bg-[#1a1a1a] rounded-sm border border-[#222]">
                        No comments yet.
                     </div>
                  )}
               </div>
            </motion.section>
         </div>
         
         {/* Right Sidebar */}
         <div className="hidden xl:block w-[300px] shrink-0">
           <div className="sticky top-20 space-y-6">
              {similarAnimes.length > 0 && (
                <div className="bg-[#111] border border-[#222] rounded-sm p-4">
                   <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                     <Star className="w-4 h-4 text-[#ff006a]" /> O'xshash Animelar
                   </h3>
                   <div className="space-y-3">
                     {similarAnimes.map(sim => (
                       <Link 
                         key={sim.id} 
                         to={`/anime/${toSlug(sim.title)}`} 
                         title={`${sim.title} - O'zbek tilida ko'rish`}
                         className="flex gap-3 items-center group cursor-pointer p-1.5 rounded-sm hover:bg-[#222] transition-colors"
                       >
                         <div className="w-10 h-14 bg-[#222] rounded-sm overflow-hidden shrink-0">
                           <img loading="lazy" decoding="async" 
                             src={sim.image_url} 
                             alt={`${sim.title} - O'zbek tilida ko'rish`} 
                             title={`${sim.title} - O'zbek tilida ko'rish`}
                             className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                           />
                         </div>
                         <div className="min-w-0 flex-1">
                           <div className="text-white/90 text-xs font-medium line-clamp-1 group-hover:text-[#ff006a] transition-colors">{sim.title}</div>
                           <div className="text-white/40 text-[10px] mt-0.5">TV Series • {sim.yil || "2026"}</div>
                         </div>
                       </Link>
                     ))}
                   </div>
                </div>
              )}
           </div>
         </div>
      </div>

      <AnimatePresence>
        {showLoginPrompt && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginPrompt(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_20px_50px_rgba(255,0,106,0.15)] text-center overflow-hidden"
            >
              {/* Radial background accent */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#ff006a]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 bg-[#ff006a]/10 border border-[#ff006a]/20 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,0,106,0.15)]">
                <Star className="w-8 h-8 text-[#ff006a] fill-current animate-pulse" />
              </div>

              {/* Titles */}
              <h3 className="text-xl font-extrabold text-white mb-2 uppercase tracking-wide">
                Ro'yxatdan O'tish Shart!
              </h3>
              <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                Anime tomosha qilish, baholash va izoh qoldirish uchun tizimga kiring yoki ro'yxatdan o'ting.
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowLoginPrompt(false);
                    navigate('/login');
                  }}
                  className="w-full bg-[#ff006a] hover:bg-[#d40058] text-white py-3 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#ff006a]/25 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Tizimga kirish
                </button>
                <button
                  onClick={() => {
                    setShowLoginPrompt(false);
                    navigate('/register');
                  }}
                  className="w-full bg-[#18181b] border border-white/10 hover:bg-[#27272a] text-white py-3 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all cursor-pointer"
                >
                  Ro'yxatdan o'tish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
