import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Layers, Maximize2, RotateCcw, Share2, Check } from 'lucide-react';

interface ChapterData {
  chapter: {
    id: string | number;
    manga_id: string | number;
    chapter_number: number;
    title?: string;
    pages: string[];
  };
  manga_title: string;
  all_chapters: {
    id: string | number;
    chapter_number: number;
    title?: string;
  }[];
}

export default function MangaReader() {
  const { id, chapterNumber } = useParams<{ id: string; chapterNumber: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchChapter();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, chapterNumber]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data ? `${data.manga_title} - ${chapterNumber}-bob` : 'Manga',
          text: data ? `${data.manga_title} - ${chapterNumber}-bobni o'qing!` : 'Manga',
          url: window.location.href,
        });
        return;
      } catch (e) {
        // Fallback
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

  const fetchChapter = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/mangas/${id}/chapters/${chapterNumber}`);
      if (!res.ok) {
        throw new Error('Bob topilmadi');
      }
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Sahifalar yuklanmoqda...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#111] border border-[#222] p-8 rounded-lg text-center space-y-4 max-w-lg mx-auto my-12">
        <BookOpen className="mx-auto text-red-500/60" size={48} />
        <h2 className="text-xl font-bold text-white">Bobni yuklashda xatolik</h2>
        <p className="text-white/50 text-sm">{error || 'Qidirilayotgan bob topilmadi'}</p>
        <div className="flex justify-center gap-3">
          <Link
            to={`/manga/${id}`}
            className="inline-flex items-center gap-2 bg-[#18181c] hover:bg-[#222] border border-[#333] px-4 py-2 rounded text-sm text-white font-bold"
          >
            <ArrowLeft size={16} /> Manga sahifasiga
          </Link>
        </div>
      </div>
    );
  }

  const { chapter, manga_title, all_chapters } = data;
  const currentChapterNum = Number(chapterNumber);
  
  const currentIdx = all_chapters.findIndex(c => Number(c.chapter_number) === currentChapterNum);
  const prevChapter = currentIdx > 0 ? all_chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx >= 0 && currentIdx < all_chapters.length - 1 ? all_chapters[currentIdx + 1] : null;

  return (
    <div className="min-h-screen -mx-4 sm:-mx-6 lg:-mx-8 bg-[#0a0a0a] text-white">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-50 bg-[#111]/95 backdrop-blur-md border-b border-[#222] px-4 py-3 flex items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/manga/${id}`}
            className="p-2 bg-[#18181c] hover:bg-[#222] text-white/80 hover:text-white rounded transition-colors shrink-0"
            title="Mangaga qaytish"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-white truncate">
              {manga_title}
            </h1>
            <p className="text-[11px] text-[#ff006a] font-bold">
              {chapter.chapter_number}-bob {chapter.title ? `: ${chapter.title}` : ''}
            </p>
          </div>
        </div>

        {/* Chapter Switcher & Prev/Next */}
        <div className="flex items-center gap-2">
          {prevChapter ? (
            <button
              onClick={() => navigate(`/manga/${id}/read/${prevChapter.chapter_number}`)}
              className="p-2 bg-[#18181c] hover:bg-[#222] text-white rounded transition-colors flex items-center gap-1 text-xs font-bold"
              title="Oldingi bob"
            >
              <ChevronLeft size={16} />
              <span className="hidden md:inline">Oldingi</span>
            </button>
          ) : (
            <button disabled className="p-2 bg-[#18181c]/50 text-white/20 rounded cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
          )}

          <select
            value={currentChapterNum}
            onChange={(e) => navigate(`/manga/${id}/read/${e.target.value}`)}
            className="bg-[#18181c] border border-[#333] text-white text-xs font-bold py-1.5 px-2 rounded focus:outline-none focus:border-[#ff006a] cursor-pointer"
          >
            {all_chapters.map((ch) => (
              <option key={ch.id} value={ch.chapter_number}>
                {ch.chapter_number}-bob
              </option>
            ))}
          </select>

          {nextChapter ? (
            <button
              onClick={() => navigate(`/manga/${id}/read/${nextChapter.chapter_number}`)}
              className="p-2 bg-[#ff006a] hover:bg-[#d40058] text-white rounded transition-colors flex items-center gap-1 text-xs font-bold shadow-md shadow-[#ff006a]/20"
              title="Keyingi bob"
            >
              <span className="hidden md:inline">Keyingi</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button disabled className="p-2 bg-[#18181c]/50 text-white/20 rounded cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
          )}

          <button
            onClick={handleShare}
            className={`p-2 rounded transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer border ${
              copied
                ? 'bg-green-600 text-white border-green-500'
                : 'bg-[#18181c] hover:bg-[#222] text-white/80 hover:text-white border-[#333]'
            }`}
            title="Bobni ulashish"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            <span className="hidden sm:inline">{copied ? 'Nusxalandi' : 'Ulashish'}</span>
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div className="max-w-3xl mx-auto py-4 px-2 space-y-1">
        {chapter.pages && chapter.pages.length > 0 ? (
          chapter.pages.map((imgUrl, idx) => (
            <div key={idx} className="relative bg-[#111] overflow-hidden rounded-sm">
              <img
                src={imgUrl}
                alt={`${chapter.chapter_number}-bob ${idx + 1}-sahifa`}
                className="w-full h-auto object-contain block mx-auto shadow-2xl"
                loading={idx < 3 ? 'eager' : 'lazy'}
              />
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white/60 font-mono">
                {idx + 1} / {chapter.pages.length}
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-white/40 text-sm">
            Ushbu bob uchun sahifa rasmlari kiritilmagan.
          </div>
        )}
      </div>

      {/* Bottom Footer Navigation */}
      <div className="bg-[#111] border-t border-[#222] p-4 text-center space-y-4 max-w-3xl mx-auto my-6 rounded-lg">
        <div className="text-xs text-white/60 font-bold">
          {chapter.chapter_number}-bob yakunlandi ({chapter.pages?.length || 0} sahifa)
        </div>

        <div className="flex items-center justify-center gap-3">
          {prevChapter && (
            <button
              onClick={() => navigate(`/manga/${id}/read/${prevChapter.chapter_number}`)}
              className="bg-[#18181c] hover:bg-[#222] border border-[#333] text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft size={16} /> Oldingi bob ({prevChapter.chapter_number})
            </button>
          )}

          <Link
            to={`/manga/${id}`}
            className="bg-[#18181c] hover:bg-[#222] border border-[#333] text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5"
          >
            <Layers size={14} /> Mundarija
          </Link>

          {nextChapter && (
            <button
              onClick={() => navigate(`/manga/${id}/read/${nextChapter.chapter_number}`)}
              className="bg-[#ff006a] hover:bg-[#d40058] text-white px-5 py-2 rounded text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#ff006a]/20 cursor-pointer"
            >
              Keyingi bob ({nextChapter.chapter_number}) <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
