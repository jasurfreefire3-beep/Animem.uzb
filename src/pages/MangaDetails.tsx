import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../types';
import { BookOpen, Star, Eye, Layers, User, Calendar, ArrowLeft, Play, Clock, Sparkles, Share2, Check, Copy, MessageSquare, Send, ThumbsUp, ThumbsDown, MessageCircle, Trash2, X } from 'lucide-react';
import { Manga, MangaChapter } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface MangaDetailResponse extends Manga {
  chapters: MangaChapter[];
}

export default function MangaDetails() {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<MangaDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    fetchMangaDetail();
    fetchComments();
  }, [id]);

  const fetchMangaDetail = async () => {
    try {
      const res = await fetch(`/api/mangas/${id}`);
      if (!res.ok) {
        throw new Error('Manga topilmadi');
      }
      const data = await res.json();
      setManga(data);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/mangas/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch(e) {}
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowLoginPrompt(true); return; }
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/mangas/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      });
      if (res.ok) {
        const commentData = await res.json();
        setComments([commentData, ...comments]);
        setNewComment('');
      }
    } catch(e) {}
  };

  const handleCommentDelete = async (commentId: string | number) => {
    if (!user || !commentId) return;
    if (window.confirm("Ushbu izohni o'chirmoqchimisiz?")) {
      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchComments();
        }
      } catch(e) {}
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!user) { setShowLoginPrompt(true); return; }
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
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
      const res = await fetch(`/api/comments/${commentId}/dislike`, {
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
      const res = await fetch(`/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: text.trim() })
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: manga?.title || manga?.type || 'Manga',
          text: `${manga?.title} ${manga?.type?.toLowerCase() || 'manga'}sini o'zbek tilida o'qing!`,
          url: window.location.href,
        });
        return;
      } catch (e) {
        // Fallback to clipboard if share cancelled or not supported
      }
    }
    
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="bg-[#111] border border-[#222] p-8 rounded-lg text-center space-y-4">
        <BookOpen className="mx-auto text-red-500/50" size={48} />
        <h2 className="text-xl font-bold text-white">Topilmadi</h2>
        <p className="text-white/50 text-sm">{error || 'Qidirilayotgan ma\'lumot mavjud emas'}</p>
        <Link
          to="/manga"
          className="inline-flex items-center gap-2 bg-[#18181c] hover:bg-[#222] border border-[#333] px-4 py-2 rounded text-sm text-white font-bold"
        >
          <ArrowLeft size={16} /> Barchasiga qaytish
        </Link>
      </div>
    );
  }

  const genres = manga.janrlar ? manga.janrlar.split(',').map(g => g.trim()) : [];
  const chapters = manga.chapters || [];
  const firstChapter = chapters.length > 0 ? chapters[0] : null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/manga"
        className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Barcha asarlar
      </Link>

      {/* Header / Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-[#111] border border-[#222]">
        {/* Banner background */}
        {manga.banner_url && (
          <div className="absolute inset-0 h-48 sm:h-64 overflow-hidden opacity-30 pointer-events-none">
            <img loading="lazy" decoding="async"
              src={manga.banner_url}
              alt={manga.title}
              className="w-full h-full object-cover blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111]/80 to-[#111]" />
          </div>
        )}

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row gap-6">
          {/* Cover image */}
          <div className="w-40 sm:w-52 shrink-0 mx-auto md:mx-0">
            <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-[#ff006a]/40 shadow-2xl shadow-[#ff006a]/10 relative group">
              <img loading="lazy" decoding="async"
                src={manga.cover_url}
                alt={manga.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-xs font-black text-amber-400 flex items-center gap-1 border border-white/10">
                <Star size={13} className="fill-amber-400" />
                {manga.rating || 9.5}
              </div>
            </div>
          </div>

          {/* Details metadata */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  manga.holati === 'Tugallangan' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-[#ff006a]/20 text-[#ff006a] border border-[#ff006a]/30'
                }`}>
                  {manga.holati}
                </span>
                {manga.released_year && (
                  <span className="bg-white/5 border border-white/10 text-white/70 px-2.5 py-0.5 rounded text-[10px] font-bold">
                    {manga.released_year}-yil
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight">
                {manga.title}
              </h1>
            </div>

            {/* Author / Artist / Views */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-white/70">
              {manga.author && (
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-[#ff006a]" />
                  <span>Muallif: <strong className="text-white">{manga.author}</strong></span>
                </div>
              )}
              {manga.artist && (
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#ff006a]" />
                  <span>Rassom: <strong className="text-white">{manga.artist}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-[#ff006a]" />
                <span>Boblar soni: <strong className="text-white">{chapters.length} ta</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/80">
                <Eye size={14} className="text-[#ff006a]" />
                <span>Ko'rishlar: <strong className="text-white">{manga.korishlar || 0}</strong></span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
              {genres.map((g, idx) => (
                <span key={idx} className="bg-[#18181c] border border-[#262626] text-white/80 text-xs px-2.5 py-1 rounded-sm font-semibold">
                  {g}
                </span>
              ))}
            </div>

            {manga.tags && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                {manga.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="bg-white/5 border border-white/10 text-white/60 hover:text-white text-[11px] font-medium px-2.5 py-0.5 rounded-sm transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons: Read & Share */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {firstChapter ? (
                <Link
                  to={`/manga/${manga.id}/read/${firstChapter.chapter_number}`}
                  className="inline-flex items-center gap-2 bg-[#ff006a] hover:bg-[#d40058] text-white font-black px-6 py-3 rounded-md transition-all shadow-lg shadow-[#ff006a]/20 uppercase tracking-wider text-xs"
                >
                  <Play size={16} className="fill-white" />
                  Birinchi bobni o'qish ({firstChapter.chapter_number}-bob)
                </Link>
              ) : (
                <div className="text-xs text-white/40 italic">
                  Hozircha boblar yuklanmagan
                </div>
              )}

              <button
                onClick={handleShare}
                className={`inline-flex items-center gap-2 font-black px-5 py-3 rounded-md transition-all uppercase tracking-wider text-xs border cursor-pointer ${
                  copied 
                    ? 'bg-green-600 text-white border-green-500' 
                    : 'bg-[#18181c] hover:bg-[#222] text-white/90 border-[#333] hover:border-[#ff006a]/50'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-white" />
                    Nusxalandi!
                  </>
                ) : (
                  <>
                    <Share2 size={16} className="text-[#ff006a]" />
                    Ulashish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-lg space-y-3">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen size={16} className="text-[#ff006a]" />
          {manga.type || 'Manga'} tavsifi
        </h2>
        <div className="relative">
          <p className={`text-white/70 text-sm leading-relaxed whitespace-pre-line ${showFullDesc ? '' : 'line-clamp-4'}`}>
            {manga.description}
          </p>
          {manga.description && manga.description.length > 200 && (
            <button 
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-[#ff006a] hover:text-[#ff3385] text-xs font-bold uppercase tracking-wider mt-2 flex items-center transition-colors"
            >
              {showFullDesc ? 'Kamroq o\'qish' : 'Ko\'proq o\'qish'}
            </button>
          )}
        </div>
      </div>

      {/* Chapters list */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#222] pb-4">
          <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Layers size={18} className="text-[#ff006a]" />
            Boblar ro'yxati ({chapters.length})
          </h2>
        </div>

        {chapters.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            Ushbu asar uchun hali hech qanday bob qo'shilmagan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                to={`/manga/${manga.id}/read/${ch.chapter_number}`}
                className="group bg-[#18181c] hover:bg-[#222] border border-[#262626] hover:border-[#ff006a]/40 p-3.5 rounded-md transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-sm group-hover:text-[#ff006a] transition-colors">
                    {ch.chapter_number}-bob {ch.title ? `: ${ch.title}` : ''}
                  </div>
                  <div className="text-[11px] text-white/40 mt-1 flex items-center gap-2">
                    <span>{ch.pages?.length || 0} sahifa</span>
                    {ch.created_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(ch.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[#ff006a]/10 text-[#ff006a] group-hover:bg-[#ff006a] group-hover:text-white p-2 rounded-md transition-colors shrink-0">
                  <Play size={14} className="fill-current" />
                </div>
              </Link>
            ))}
          </div>
         )}
       </div>

       {/* Comments Section */}
       <div className="bg-[#111] border border-[#222] p-6 rounded-lg space-y-6">
         <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
               <MessageSquare size={18} className="text-[#ff006a]" />
               Izohlar ({comments.length})
            </h2>
         </div>

         {/* Comment Form */}
         <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
               value={newComment}
               onChange={(e) => setNewComment(e.target.value)}
               placeholder={user ? "Fikr bildirish..." : "Izoh qoldirish uchun tizimga kiring..."}
               disabled={!user}
               className="w-full bg-[#18181c] border border-[#262626] rounded-md p-3 text-white text-sm focus:outline-none focus:border-[#ff006a] resize-none h-24 placeholder:text-white/30 disabled:opacity-50"
            />
            <div className="flex justify-end">
               {user ? (
                  <button
                     type="submit"
                     className="bg-[#ff006a] hover:bg-[#d40058] text-white font-black px-6 py-2.5 rounded-md text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#ff006a]/20"
                  >
                     <Send size={14} /> Izoh qoldirish
                  </button>
               ) : (
                  <Link
                     to="/login"
                     className="bg-[#222] hover:bg-[#333] text-white font-bold px-6 py-2.5 rounded-md text-xs transition-all"
                  >
                     Kirish
                  </Link>
               )}
            </div>
         </form>

         {/* Comments List */}
         <div className="space-y-4">
            {comments.map((comment) => {
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
                     key={comment.id} 
                     className="group bg-[#18181c] border border-[#262626] p-4 rounded-md flex gap-3"
                  >
                     {avatarSrc ? (
                        <img loading="lazy" decoding="async" src={avatarSrc} alt={comment.user_name} className="w-11 h-11 rounded-full object-cover border-2 border-[#ff006a]/40 hover:border-[#ff006a] shrink-0 shadow-md transition-all" />
                     ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2a2a2e] to-[#151518] text-[#ff006a] flex items-center justify-center font-extrabold text-sm shrink-0 border-2 border-[#ff006a]/30 shadow-md">
                           {comment.user_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                     )}
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                           <span className="text-white/90 font-bold text-xs">{comment.user_name}</span>
                           <span className="text-white/30 text-[10px]">
                              {new Date(comment.created_at).toLocaleDateString()}
                           </span>

                           {/* Quick Reply button right next to name */}
                           <button 
                              onClick={() => setReplyingCommentId(replyingCommentId === Number(comment.id) ? null : Number(comment.id))}
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

                        {/* Action buttons */}
                        <div className="flex items-center gap-4 text-xs text-white/50">
                           <button 
                              onClick={() => handleLikeComment(Number(comment.id))}
                              className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${isLiked ? 'text-emerald-400 font-bold' : ''}`}
                           >
                              <ThumbsUp size={13} className={isLiked ? 'fill-emerald-400' : ''} />
                              <span>{comment.likes || 0}</span>
                           </button>
                           <button 
                              onClick={() => handleDislikeComment(Number(comment.id))}
                              className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${isDisliked ? 'text-red-400 font-bold' : ''}`}
                           >
                              <ThumbsDown size={13} className={isDisliked ? 'fill-red-400' : ''} />
                              <span>{comment.dislikes || 0}</span>
                           </button>
                           <button 
                              onClick={() => setReplyingCommentId(replyingCommentId === Number(comment.id) ? null : Number(comment.id))}
                              className="flex items-center gap-1.5 hover:text-[#ff006a] transition-colors cursor-pointer"
                           >
                              <MessageCircle size={13} />
                              <span>Javob yozish</span>
                           </button>
                        </div>

                        {/* Replies list */}
                        {replies.length > 0 && (
                           <div className="mt-4 pl-4 border-l-2 border-[#333] space-y-3">
                              {replies.map((rep: any) => {
                                 const repAvatar = rep.user_avatar;
                                 return (
                                    <div key={rep.id} className="bg-[#141418] p-3 rounded-sm border border-[#222] flex gap-2.5">
                                       {repAvatar ? (
                                          <img loading="lazy" decoding="async" src={repAvatar} alt={rep.user_name} className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" />
                                       ) : (
                                          <div className="w-7 h-7 rounded-full bg-[#ff006a]/20 text-[#ff006a] flex items-center justify-center font-bold text-xs shrink-0">
                                             {rep.user_name?.[0]?.toUpperCase() || 'U'}
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
                                 );
                              })}
                           </div>
                        )}

                        {/* Reply input form */}
                        {replyingCommentId === Number(comment.id) && (
                           <form onSubmit={(e) => handleReplySubmit(Number(comment.id), e)} className="mt-3 pt-3 border-t border-[#262626]">
                              <textarea
                                 value={replyText[Number(comment.id)] || ''}
                                 onChange={(e) => setReplyText({ ...replyText, [Number(comment.id)]: e.target.value })}
                                 placeholder="Javob yozish..."
                                 className="w-full bg-[#111] border border-[#262626] rounded-sm p-2 text-white text-xs focus:outline-none focus:border-[#ff006a]/50 resize-none h-16 mb-2 placeholder:text-white/30"
                              />
                              <div className="flex justify-end gap-2">
                                 <button 
                                    type="button" 
                                    onClick={() => setReplyingCommentId(null)}
                                    className="px-3 py-1 rounded bg-[#222] hover:bg-[#333] text-white/70 text-xs font-bold transition-colors cursor-pointer"
                                 >
                                    Bekor qilish
                                 </button>
                                 <button 
                                    type="submit" 
                                    className="px-3 py-1 rounded bg-[#ff006a] hover:bg-[#d40058] text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
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
               <div className="text-center text-white/40 text-sm py-8 bg-[#18181c] rounded-md border border-[#262626]">
                  Hozircha izohlar yo'q. Birinchi bo'lib izoh qoldiring!
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
