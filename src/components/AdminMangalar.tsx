import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Edit2, Search, X, Check, Layers, Image, User, Sparkles, Link as LinkIcon } from 'lucide-react';
import { Manga, MangaChapter } from '../types';

interface AdminMangalarProps {
  token: string | null;
}

export default function AdminMangalar({ token }: AdminMangalarProps) {
  const [subTab, setSubTab] = useState<'manga_list' | 'add_manga' | 'add_chapter'>('manga_list');
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Manga Form State
  const [editingManga, setEditingManga] = useState<Manga | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [artist, setArtist] = useState('');
  const [holati, setHolati] = useState('Davom etmoqda');
  const [mangaType, setMangaType] = useState('Manga');
  const [releasedYear, setReleasedYear] = useState(new Date().getFullYear().toString());
  const [tags, setTags] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Jangari']);

  // Chapter Form State
  const [selectedMangaId, setSelectedMangaId] = useState<string>('');
  const [chapterNumber, setChapterNumber] = useState<string>('');
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [pagesInput, setPagesInput] = useState<string>('');
  const [mangaChapters, setMangaChapters] = useState<MangaChapter[]>([]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const [deleteChapterConfirm, setDeleteChapterConfirm] = useState<number | null>(null);

  const availableGenres = [
    'Jangari', 'Sarguzasht', 'Fantastika', 'Komediya', 
    'Mistika', 'Drama', 'Romantika', 'G\'ayritabiiy', 'Isekai'
  ];

  useEffect(() => {
    fetchMangas();
  }, []);

  useEffect(() => {
    if (selectedMangaId) {
      fetchMangaDetails(selectedMangaId);
    }
  }, [selectedMangaId]);

  const fetchMangas = async () => {
    try {
      const res = await fetch('/api/mangas');
      if (res.ok) {
        const data = await res.json();
        setMangas(data);
      }
    } catch (err) {
      console.error('Failed to fetch mangas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMangaDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/mangas/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMangaChapters(data.chapters || []);
      }
    } catch (err) {
      console.error('Failed to fetch manga details:', err);
    }
  };

  const resetMangaForm = () => {
    setEditingManga(null);
    setTitle('');
    setDescription('');
    setCoverUrl('');
    setBannerUrl('');
    setAuthor('');
    setArtist('');
    setHolati('Davom etmoqda');
    setReleasedYear(new Date().getFullYear().toString());
    setTags('');
    setSelectedGenres(['Jangari']);
  };

  const startEditManga = (m: Manga) => {
    setEditingManga(m);
    setTitle(m.title);
    setDescription(m.description);
    setCoverUrl(m.cover_url);
    setBannerUrl(m.banner_url || '');
    setAuthor(m.author || '');
    setArtist(m.artist || '');
    setHolati(m.holati || 'Davom etmoqda');
    setReleasedYear((m.released_year || new Date().getFullYear()).toString());
    setTags(m.tags || '');
    setSelectedGenres(m.janrlar ? m.janrlar.split(',').map(g => g.trim()) : ['Jangari']);
    setSubTab('add_manga');
  };

  const handleMangaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!title || !description || !coverUrl) {
      setMessage({ type: 'error', text: 'Iltimos, sarlavha, tavsif va muqova rasmini kiriting!' });
      return;
    }

    const payload = {
      title,
      description,
      cover_url: coverUrl,
      banner_url: bannerUrl || coverUrl,
      author: author || "Noma'lum",
      artist: artist || "Noma'lum",
      janrlar: selectedGenres.join(', '),
      holati,
      released_year: parseInt(releasedYear) || new Date().getFullYear(),
      tags
    };

    try {
      const url = editingManga ? `/api/mangas/${editingManga.id}` : '/api/mangas';
      const method = editingManga ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Operatsiyada xatolik yuz berdi');
      }

      setMessage({
        type: 'success',
        text: editingManga ? "Manga muvaffaqiyatli tahrirlandi!" : "Yangi manga muvaffaqiyatli qo'shildi!"
      });

      resetMangaForm();
      fetchMangas();
      setSubTab('manga_list');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Xatolik yuz berdi' });
    }
  };

  const handleDeleteManga = async (id: string | number) => {
    try {
      const res = await fetch(`/api/mangas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setMessage({ type: 'success', text: "Manga muvaffaqiyatli o'chirildi!" });
        setDeleteConfirmId(null);
        setMangas(prev => prev.filter(m => String(m.id) !== String(id)));
        fetchMangas();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Manga o'chirishda xatolik");
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleClearAllMangas = async () => {
    if (!window.confirm("Barcha mangalarni va test uchun yuklangan mangalarni o'chirishni xohlaysizmi?")) return;
    try {
      const res = await fetch('/api/admin/mangas-clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: "Barcha test mangalar o'chirildi!" });
        setMangas([]);
        fetchMangas();
      } else {
        throw new Error(data.error || "Xatolik yuz berdi");
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!selectedMangaId || !chapterNumber || !pagesInput.trim()) {
      setMessage({ type: 'error', text: 'Manga, Bob raqami va rasm havolalarini kiritish majburiy!' });
      return;
    }

    // Split pages by line break or comma
    const pagesArray = pagesInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (pagesArray.length === 0) {
      setMessage({ type: 'error', text: 'Kamida 1 ta sahifa havolasi kiritilishi kerak!' });
      return;
    }

    try {
      const res = await fetch(`/api/mangas/${selectedMangaId}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chapter_number: parseInt(chapterNumber),
          title: chapterTitle || `${chapterNumber}-bob`,
          pages: pagesArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bobni saqlashda xatolik');
      }

      setMessage({ type: 'success', text: `${chapterNumber}-bob muvaffaqiyatli saqlandi!` });
      setChapterNumber('');
      setChapterTitle('');
      setPagesInput('');
      fetchMangaDetails(selectedMangaId);
      fetchMangas();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteChapter = async (chapterNum: number) => {
    try {
      const res = await fetch(`/api/mangas/${selectedMangaId}/chapters/${chapterNum}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${chapterNum}-bob o'chirildi` });
        setDeleteChapterConfirm(null);
        setMangaChapters(prev => prev.filter(c => c.chapter_number !== chapterNum));
        fetchMangaDetails(selectedMangaId);
        fetchMangas();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter(g => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const filteredMangas = mangas.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.author && m.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#222] pb-3">
        <button
          onClick={() => { setSubTab('manga_list'); setMessage({ type: '', text: '' }); }}
          className={`px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            subTab === 'manga_list' ? 'bg-[#ff006a] text-white' : 'bg-[#18181c] text-white/60 hover:text-white'
          }`}
        >
          <BookOpen size={14} /> Mangalar Ro'yxati ({mangas.length})
        </button>

        <button
          onClick={() => { resetMangaForm(); setSubTab('add_manga'); setMessage({ type: '', text: '' }); }}
          className={`px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            subTab === 'add_manga' ? 'bg-[#ff006a] text-white' : 'bg-[#18181c] text-white/60 hover:text-white'
          }`}
        >
          <Plus size={14} /> {editingManga ? "Manganı Tahrirlash" : "Yangi Manga Qo'shish"}
        </button>

        <button
          onClick={() => { setSubTab('add_chapter'); setMessage({ type: '', text: '' }); }}
          className={`px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            subTab === 'add_chapter' ? 'bg-[#ff006a] text-white' : 'bg-[#18181c] text-white/60 hover:text-white'
          }`}
        >
          <Layers size={14} /> Manga Boblarini Boshqarish
        </button>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`p-4 rounded text-sm font-bold flex items-center gap-2 ${
          message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Sub Tab 1: Manga List */}
      {subTab === 'manga_list' && (
        <div className="bg-[#111] border border-[#222] p-5 rounded-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-[#ff006a]" /> Barcha Mangalar
              </h3>
              {mangas.length > 0 && (
                <button
                  onClick={handleClearAllMangas}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={12} /> Barchasini o'chirish (Testlar)
                </button>
              )}
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input
                type="text"
                placeholder="Manga qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181c] border border-[#333] rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ff006a]"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-white/40 text-xs">Yuklanmoqda...</div>
          ) : filteredMangas.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-xs">Hech qanday manga topilmadi</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#222] text-white/40 uppercase tracking-wider">
                    <th className="p-3">Muqova</th>
                    <th className="p-3">Manga Nomi</th>
                    <th className="p-3">Muallif / Rassom</th>
                    <th className="p-3">Holati</th>
                    <th className="p-3">Boblar</th>
                    <th className="p-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {filteredMangas.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <img src={m.cover_url} alt={m.title} className="w-10 h-14 object-cover rounded border border-[#333]" />
                      </td>
                      <td className="p-3 font-bold text-white">
                        {m.title}
                        <div className="text-[11px] text-white/40 font-normal">{m.janrlar}</div>
                      </td>
                      <td className="p-3 text-white/70">
                        {m.author || "Noma'lum"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.holati === 'Tugallangan' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#ff006a]/20 text-[#ff006a]'
                        }`}>
                          {m.holati}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white/80">
                        {m.chapters_count || 0} bob
                      </td>
                      <td className="p-3 text-right">
                        {deleteConfirmId === m.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[11px] font-bold text-red-400 mr-1">O'chirishni tasdiqlaysizmi?</span>
                            <button
                              onClick={() => handleDeleteManga(m.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Ha, o'chirish
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="bg-[#222] hover:bg-[#333] text-white/70 px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Yo'q
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedMangaId(String(m.id));
                                setSubTab('add_chapter');
                              }}
                              className="bg-white/10 hover:bg-[#ff006a] text-white p-1.5 rounded transition-colors cursor-pointer"
                              title="Bob qo'shish"
                            >
                              <Layers size={14} />
                            </button>
                            <button
                              onClick={() => startEditManga(m)}
                              className="bg-white/10 hover:bg-amber-500 text-white p-1.5 rounded transition-colors cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(m.id)}
                              className="bg-white/10 hover:bg-red-500 text-white p-1.5 rounded transition-colors cursor-pointer"
                              title="O'chirish"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 2: Add/Edit Manga */}
      {subTab === 'add_manga' && (
        <form onSubmit={handleMangaSubmit} className="bg-[#111] border border-[#222] p-6 rounded-lg space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#222] pb-3">
            <BookOpen size={16} className="text-[#ff006a]" />
            {editingManga ? "Manganı Tahrirlash" : "Yangi Manga Qo'shish"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Manga Nomi *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="masalan: Solo Leveling"
                className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Muallif (Author)</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="masalan: Chugong"
                className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Rassom (Artist)</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="masalan: DUBU"
                className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Chiqarilgan yili</label>
              <input
                type="number"
                value={releasedYear}
                onChange={(e) => setReleasedYear(e.target.value)}
                className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Muqova Rasmi Havolasi (Cover URL) *</label>
              <input
                type="url"
                required
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Banner Rasmi Havolasi (Banner URL)</label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Holati</label>
              <select
                value={holati}
                onChange={(e) => setHolati(e.target.value)}
                className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
              >
                <option value="Davom etmoqda">Davom etmoqda</option>
                <option value="Tugallangan">Tugallangan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Turi</label>
              <select
                value={mangaType}
                onChange={(e) => setMangaType(e.target.value)}
                className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
              >
                <option value="Manga">Manga</option>
                <option value="Manhwa">Manhwa</option>
                <option value="Manhua">Manhua</option>
                <option value="Komiks">Komiks</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Teglar (Vergul bilan ajratib yozing: masalan: jangari, sarguzasht)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="jangari, sarguzasht, fantastika"
                className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Janrlar (Bir nechtasini tanlang)</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {availableGenres.map((g) => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`text-xs px-3 py-1 rounded font-bold cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#ff006a] text-white' : 'bg-[#18181c] text-white/50 border border-[#333]'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Manga Tavsifi *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Manga haqida qisqacha ma'lumot..."
              className="w-full bg-[#18181c] border border-[#333] rounded p-3 text-white text-xs focus:outline-none focus:border-[#ff006a]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#ff006a] hover:bg-[#d40058] text-white font-bold px-6 py-2.5 rounded text-xs uppercase tracking-wider cursor-pointer"
            >
              {editingManga ? "O'zgarishlarni Saqlash" : "Manganı Saqlash"}
            </button>
            {editingManga && (
              <button
                type="button"
                onClick={() => { resetMangaForm(); setSubTab('manga_list'); }}
                className="bg-[#18181c] hover:bg-[#222] text-white/70 font-bold px-4 py-2.5 rounded text-xs"
              >
                Bekor qilish
              </button>
            )}
          </div>
        </form>
      )}

      {/* Sub Tab 3: Manga Chapters Management */}
      {subTab === 'add_chapter' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveChapter} className="bg-[#111] border border-[#222] p-6 rounded-lg space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#222] pb-3">
              <Layers size={16} className="text-[#ff006a]" /> Manganı Tanlang va Bob Qo'shing
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Manganı Tanlang *</label>
                <select
                  required
                  value={selectedMangaId}
                  onChange={(e) => setSelectedMangaId(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
                >
                  <option value="">-- Manganı Tanlang --</option>
                  {mangas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.chapters_count || 0} bob)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Bob Raqami (Chapter Number) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                  placeholder="masalan: 1"
                  className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1 uppercase">Bob Sarlavhasi (Ixtiyoriy)</label>
                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="masalan: Eng kuchsiz ovchi"
                  className="w-full bg-[#18181c] border border-[#333] rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff006a]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-1 uppercase">
                Sahifa Rasm Havolalari (Har bir rasmni yangi qatordan yoki vergul bilan kiriting) *
              </label>
              <textarea
                required
                rows={6}
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
                placeholder={"https://example.com/page1.jpg\nhttps://example.com/page2.jpg\nhttps://example.com/page3.jpg"}
                className="w-full bg-[#18181c] border border-[#333] rounded p-3 text-white text-xs font-mono focus:outline-none focus:border-[#ff006a]"
              />
              <p className="text-[11px] text-white/40 mt-1">
                Ushbu havolalar tartib bo'yicha ketma-ket o'quvchiga ko'rsatiladi.
              </p>
            </div>

            <button
              type="submit"
              className="bg-[#ff006a] hover:bg-[#d40058] text-white font-bold px-6 py-2.5 rounded text-xs uppercase tracking-wider cursor-pointer"
            >
              Bobni Saqlash
            </button>
          </form>

          {/* Existing chapters list for selected manga */}
          {selectedMangaId && (
            <div className="bg-[#111] border border-[#222] p-6 rounded-lg space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Mavjud Boblar ({mangaChapters.length})
              </h4>

              {mangaChapters.length === 0 ? (
                <div className="text-xs text-white/40">Ushbu manga uchun hali hech qanday bob qo'shilmagan.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {mangaChapters.map((ch) => (
                    <div key={ch.id} className="bg-[#18181c] border border-[#333] p-3 rounded flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">
                          {ch.chapter_number}-bob {ch.title ? `: ${ch.title}` : ''}
                        </div>
                        <div className="text-[11px] text-white/40">
                          {ch.pages?.length || 0} ta sahifa
                        </div>
                      </div>

                      {deleteChapterConfirm === ch.chapter_number ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteChapter(ch.chapter_number)}
                            className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            O'chirish
                          </button>
                          <button
                            onClick={() => setDeleteChapterConfirm(null)}
                            className="bg-[#222] hover:bg-[#333] text-white/60 text-[10px] px-1.5 py-1 rounded transition-colors cursor-pointer"
                          >
                            Yo'q
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteChapterConfirm(ch.chapter_number)}
                          className="text-white/40 hover:text-red-400 p-1 transition-colors cursor-pointer"
                          title="Bobni o'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
