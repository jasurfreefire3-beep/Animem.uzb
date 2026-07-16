import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Anime, Comment, translateGenre, toSlug } from '../types';
import { Star, MessageSquare, Send, Clock, Play, Plus, Calendar, Building, ListOrdered, Share2, Heart, Flag, PlayCircle, Eye, Shield, Moon, Sun, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import VideoPlayer from '../components/VideoPlayer';

export default function AnimeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
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

  useEffect(() => {
    const fetchAllDetails = async () => {
      try {
        if (!id) return;
        const res = await fetch(`${API_BASE}/api/animes/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setAnime(data);
        if (data.video_url) {
          setCurrentVideoUrl(data.video_url);
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
        if (epRes.ok) {
          const eps = await epRes.json();
          setEpisodesList(eps);
          const ep1 = eps.find((e: any) => e.episode_number === 1);
          if (ep1 && ep1.video_url) {
            setCurrentVideoUrl(ep1.video_url);
          }
        }

        // Fetch comments
        const commRes = await fetch(`${API_BASE}/api/animes/${data.id}/comments`);
        if (commRes.ok) {
          const coms = await commRes.json();
          setComments(coms);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchAllDetails();
    window.scrollTo(0, 0);
  }, [id, user]);

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

  if (!anime) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
    </div>
  );

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
    setCurrentVideoUrl(ep.video_url || '');
    window.scrollTo({ top: document.getElementById('player-section')?.offsetTop || 0, behavior: 'smooth' });
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
          <img 
            src={anime.banner_url || anime.image_url} 
            alt={`${anime.title} o'zbek tilida tizer afishasi - Animem Uz`} 
            className="w-full h-full object-cover opacity-35 md:opacity-100 scale-105 blur-[2px] md:blur-0 transition-all duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 md:via-[#09090b]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/75 to-transparent hidden md:block" />
        </div>
        
        <div className="relative w-full px-4 md:px-8 z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end max-w-7xl mx-auto">
             {/* Poster Overlay */}
             <div className="w-32 sm:w-36 md:w-48 shrink-0 rounded-sm overflow-hidden shadow-2xl border border-white/10 transform translate-y-0 md:translate-y-16 hover:scale-105 transition-transform duration-300">
               <img src={anime.image_url} alt={`${anime.title} o'zbek tilida poster - Animem Uz`} className="w-full h-full object-cover aspect-[3/4]" />
             </div>
             
             {/* Title & Meta */}
             <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-[#ff006a] text-white text-[9px] uppercase font-bold rounded-sm tracking-wider shadow-[0_0_12px_rgba(255,0,106,0.4)]">
                    {anime.holati === 'Yakunlangan' ? 'YAKUNLANGAN' : 'EFIRDA'}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold px-2.5 py-1 bg-black/60 rounded-sm border border-white/5">
                    <Star className="w-3 h-3 fill-current" /> {anime.rating || '9.2'}
                  </span>
                  <span className="text-white/80 text-xs font-medium flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-sm border border-white/5">
                    <Calendar className="w-3 h-3" /> {anime.yil || '2026'}
                  </span>
                  <span className="text-white/80 text-xs font-medium flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-sm border border-white/5 max-w-[150px] truncate">
                    <Building className="w-3 h-3" /> {anime.studiyasi || 'Studio'}
                  </span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 leading-tight tracking-tight uppercase">
                  {anime.title}
                </h1>
                
                <div className="text-white/40 text-xs font-medium mb-5">Original nomi · TV Serial</div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-6">
                  {genres.map(g => (
                    <span key={g} className="bg-[#18181b] hover:bg-[#ff006a] text-white/70 hover:text-white text-xs font-bold px-3 py-1.5 rounded-sm transition-colors cursor-pointer border border-[#27272a] hover:border-[#ff006a] shadow-xs">
                      {translateGenre(g)}
                    </span>
                  ))}
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

      <div className="flex flex-col lg:flex-row gap-6 mt-10 md:mt-20 max-w-7xl mx-auto px-4 md:px-8">
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
                 <Eye className="w-4 h-4 text-[#ff006a]" /> Synopsis
               </h2>
               <p className="text-white/70 text-sm leading-relaxed text-justify">
                 {anime.description}
               </p>
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

               <div className="mb-4 md:mb-6">
                  {currentVideoUrl ? (
                    <VideoPlayer key={currentVideoUrl} url={currentVideoUrl} poster={anime.banner_url || anime.image_url} />
                  ) : (
                    <div className="aspect-video bg-[#000] rounded-none md:rounded-sm shadow-xl overflow-hidden border-y md:border border-[#222] relative">
                      <img src={anime.banner_url || anime.image_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
                        <div className="z-10 bg-[#111]/80 backdrop-blur-md p-6 rounded-sm text-center border border-[#333] max-w-sm mx-4">
                           <Shield className="w-6 h-6 text-white/30 mx-auto mb-3" />
                           <div className="text-white font-bold text-sm mb-1">Episode {activeEpisode} unavailable</div>
                           <div className="text-white/40 text-xs">Video content not found on server.</div>
                        </div>
                      </div>
                    </div>
                  )}
               </div>

               {/* Episode Selector */}
               <div className="px-4 md:px-0">
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <ListOrdered className="w-3.5 h-3.5" /> Qismlar
                  </h3>
                  <div className="flex flex-wrap gap-2">
                     {combinedEpisodes.map(ep => (
                        <button 
                           key={ep.number}
                           onClick={() => handleEpisodeClick(ep)}
                           className={`w-12 h-12 rounded-sm text-xs font-bold transition-all flex items-center justify-center border ${
                              activeEpisode === ep.number 
                                 ? 'bg-[#ff006a] border-[#ff006a] text-white shadow-[0_0_12px_rgba(255,0,106,0.35)]' 
                                 : ep.video_url
                                    ? 'bg-[#18181b] hover:bg-[#27272a] border-[#27272a] text-white'
                                    : 'bg-[#09090b] text-white/10 border border-[#1a1a1a] cursor-not-allowed'
                           }`}
                        >
                           {ep.number}
                        </button>
                     ))}
                  </div>
               </div>
            </motion.section>

            {/* Comments Section */}
            <motion.section 
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
                        <div className="w-6 h-6 bg-[#333] rounded-sm flex items-center justify-center text-[10px] font-bold text-white">
                           {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white/70 text-xs font-medium">{user.name}</span>
                     </div>
                     <form onSubmit={handleCommentSubmit}>
                        <textarea
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

               <div className="space-y-3">
                  {comments.map((comment, idx) => (
                     <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={comment.id} 
                        className="bg-[#1a1a1a] p-4 rounded-sm border border-[#222] flex gap-3 relative group"
                     >
                        <div className="shrink-0 w-8 h-8 bg-[#333] rounded-sm flex items-center justify-center text-white/50 text-xs font-bold">
                           {comment.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-white/90 font-medium text-xs">{comment.user_name}</span>
                               {user && (comment.user_id === user.id || user.role === 'admin') && (
                                  <button
                                     onClick={() => handleCommentDelete(comment.id)}
                                     className="text-white/30 hover:text-red-500 p-1 rounded hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer ml-auto"
                                     title="O'chirish"
                                  >
                                     <Trash2 size={13} />
                                  </button>
                               )}
                              <span className="text-white/30 text-[10px]">{new Date(comment.created_at).toLocaleDateString()}</span>
                           </div>
                           <p className="text-white/70 text-sm leading-relaxed">{comment.content}</p>
                        </div>
                     </motion.div>
                  ))}
                  {comments.length === 0 && (
                     <div className="text-center text-white/40 text-sm py-8 bg-[#1a1a1a] rounded-sm border border-[#222]">
                        No comments yet.
                     </div>
                  )}
               </div>
            </motion.section>
         </div>
         
         {/* Right Sidebar */}
         <div className="hidden lg:block w-[300px] shrink-0">
           <div className="sticky top-20 space-y-6">
              <div className="bg-[#111] border border-[#222] rounded-sm p-4">
                 <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                   <Star className="w-4 h-4 text-yellow-400" /> Similar Anime
                 </h3>
                 <div className="space-y-3">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="flex gap-3 items-center group cursor-pointer p-1.5 rounded-sm hover:bg-[#222] transition-colors">
                       <div className="w-10 h-14 bg-[#222] rounded-sm overflow-hidden shrink-0">
                         <img src={anime.image_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <div>
                         <div className="text-white/90 text-xs font-medium line-clamp-1 group-hover:text-[#ff006a] transition-colors">Related Show {i}</div>
                         <div className="text-white/40 text-[10px] mt-0.5">TV Series • 2026</div>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
           </div>
         </div>
      </div>
    </div>
  );
}
