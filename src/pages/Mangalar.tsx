import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter, Star, Eye, Layers } from 'lucide-react';
import { Manga, translateGenre } from '../types';

export default function Mangalar() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Barchasi');
  const [selectedStatus, setSelectedStatus] = useState('Barchasi');
  const [selectedType, setSelectedType] = useState('Barchasi');

  useEffect(() => {
    fetchMangas();
  }, []);

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

  const genresList = [
    'Barchasi',
    'Jangari',
    'Sarguzasht',
    'Fantastika',
    'Komediya',
    'Mistika',
    'Drama',
    'Romantika',
    'G\'ayritabiiy'
  ];

  const filteredMangas = mangas.filter(manga => {
    const matchesSearch = manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manga.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (manga.author && manga.author.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGenre = selectedGenre === 'Barchasi' || (manga.janrlar && manga.janrlar.includes(selectedGenre));
    const matchesStatus = selectedStatus === 'Barchasi' || manga.holati === selectedStatus;
    const matchesType = selectedType === 'Barchasi' || (manga.type || 'Manga') === selectedType;

    return matchesSearch && matchesGenre && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-[#18181c] via-[#241220] to-[#18181c] border border-[#333] p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-[#ff006a] text-xs font-black uppercase tracking-widest mb-2">
            <BookOpen size={16} />
            <span>Mangalar Kolleksiyasi</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-2">
            Manga va Manhvalar
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            O'zbek tilidagi eng mashhur manga va manhvalarni yuqori sifatda o'qing va yangi boblardan bahramand bo'ling.
          </p>
        </div>
        <div className="absolute right-4 bottom-0 opacity-15 pointer-events-none hidden md:block">
          <BookOpen size={220} className="text-[#ff006a]" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111] border border-[#222] p-4 rounded-lg space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Manga nomi yoki muallifini qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181c] border border-[#333] rounded-md pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#ff006a] transition-colors"
            />
          </div>

          {/* Type Select */}
          <div className="w-full md:w-40">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-[#18181c] border border-[#333] rounded-md px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#ff006a] cursor-pointer"
            >
              <option value="Barchasi">Barcha Turlar</option>
              <option value="Manga">Manga</option>
              <option value="Manhwa">Manhwa</option>
              <option value="Manhua">Manhua</option>
              <option value="Komiks">Komiks</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#18181c] border border-[#333] rounded-md px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#ff006a] cursor-pointer"
            >
              <option value="Barchasi">Barcha Holatlar</option>
              <option value="Davom etmoqda">Davom etmoqda</option>
              <option value="Tugallangan">Tugallangan</option>
            </select>
          </div>
        </div>

        {/* Genre Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-white/40 font-bold uppercase shrink-0 flex items-center gap-1">
            <Filter size={12} /> Janr:
          </span>
          {genresList.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === genre
                  ? 'bg-[#ff006a] text-white shadow-md shadow-[#ff006a]/30'
                  : 'bg-[#18181c] text-white/60 hover:text-white hover:bg-[#222] border border-[#262626]'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Manga Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-[#111] border border-[#222] rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-[#222]" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-[#222] rounded w-3/4" />
                <div className="h-3 bg-[#222] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMangas.length === 0 ? (
        <div className="bg-[#111] border border-[#222] rounded-lg p-12 text-center">
          <BookOpen className="mx-auto text-white/20 mb-3" size={48} />
          <h3 className="text-lg font-bold text-white mb-1">Manga topilmadi</h3>
          <p className="text-white/40 text-sm">
            Kiritilgan mezonlarga mos manga topilmadi. Qidiruv so'rovini tahrirlab ko'ring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMangas.map((manga) => (
            <Link
              key={manga.id}
              to={`/manga/${manga.id}`}
              className="group bg-[#111] border border-[#222] hover:border-[#ff006a]/50 rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#ff006a]/10 flex flex-col"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-[#18181c]">
                <img
                  src={manga.cover_url}
                  alt={manga.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                
                {/* Rating Badge */}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-black text-amber-400 flex items-center gap-1 border border-white/10">
                  <Star size={12} className="fill-amber-400" />
                  {manga.rating || 9.5}
                </div>

                {/* Status Badge */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  manga.holati === 'Tugallangan' 
                    ? 'bg-emerald-500/90 text-white' 
                    : 'bg-[#ff006a]/90 text-white'
                }`}>
                  {manga.holati}
                </div>

                {/* Chapters overlay count */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 flex items-center justify-between text-[11px] text-white/80">
                  <span className="flex items-center gap-1 font-bold">
                    <Layers size={12} className="text-[#ff006a]" />
                    {manga.type || "Manga"} • {manga.chapters_count || 0} bob
                  </span>
                  <span className="flex items-center gap-1 text-white/60">
                    <Eye size={12} />
                    {manga.korishlar || 0}
                  </span>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-[#ff006a] transition-colors">
                    {manga.title}
                  </h3>
                  <p className="text-xs text-white/40 line-clamp-1 mt-0.5">
                    {manga.author || "Muallif noma'lum"}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-[#222] flex items-center justify-between text-[11px] text-white/50">
                  <span className="truncate max-w-[120px]">
                    {manga.janrlar?.split(',')[0]}
                  </span>
                  <span>{manga.released_year}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
