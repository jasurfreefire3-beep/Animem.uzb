import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Star, Eye, Layers, User, Calendar, ArrowLeft, Play, Clock, Sparkles, Share2, Check, Copy } from 'lucide-react';
import { Manga, MangaChapter } from '../types';

interface MangaDetailResponse extends Manga {
  chapters: MangaChapter[];
}

export default function MangaDetails() {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<MangaDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMangaDetail();
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: manga?.title || 'Manga',
          text: `${manga?.title} mangasini o'zbek tilida o'qing!`,
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
        <h2 className="text-xl font-bold text-white">Manga topilmadi</h2>
        <p className="text-white/50 text-sm">{error || 'Qidirilayotgan manga mavjud emas'}</p>
        <Link
          to="/mangalar"
          className="inline-flex items-center gap-2 bg-[#18181c] hover:bg-[#222] border border-[#333] px-4 py-2 rounded text-sm text-white font-bold"
        >
          <ArrowLeft size={16} /> Mangalarga qaytish
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
        to="/mangalar"
        className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Barcha mangalar
      </Link>

      {/* Header / Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-[#111] border border-[#222]">
        {/* Banner background */}
        {manga.banner_url && (
          <div className="absolute inset-0 h-48 sm:h-64 overflow-hidden opacity-30 pointer-events-none">
            <img
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
              <img
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
          Manga tavsifi
        </h2>
        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
          {manga.description}
        </p>
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
            Ushbu manga uchun hali hech qanday bob qo'shilmagan.
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
    </div>
  );
}
