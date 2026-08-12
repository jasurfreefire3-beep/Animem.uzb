import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Anime, translateGenre, getEnglishGenre, toSlug } from '../types';
import { Star, Play, Grid, List, Film, Calendar, Eye, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import AnimeCard from '../components/AnimeCard';
import AdBanner728x90 from '../components/AdBanner728x90';

export default function Animelar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const genreFilter = searchParams.get('genre') || '';
  const searchFilter = searchParams.get('search') || '';

  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearch, setLocalSearch] = useState(searchFilter);

  useEffect(() => {
    setLocalSearch(searchFilter);
  }, [searchFilter]);

  useEffect(() => {
    if (genreFilter && genreFilter !== 'Barchasi') {
      document.title = `${genreFilter} animelar - O'zbek tilida ko'rish | Animem.uz`;
    } else if (searchFilter) {
      document.title = `"${searchFilter}" qidiruvi - Animem.uz`;
    } else {
      document.title = "Barcha Animelar - O'zbek tilida tomosha qilish | Animem.uz";
    }
  }, [genreFilter, searchFilter]);

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${API_BASE}/api/animes`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setAnimes(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching animes:", err);
        setLoading(false);
      }
    };
    fetchAnimes();
  }, []);

  const genres = [
    'Barchasi',
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Supernatural',
  ];

  // Enhanced Filtering logic
  const filteredAnimes = animes.filter((anime) => {
    let matchesGenre = true;
    if (genreFilter && genreFilter !== 'Barchasi') {
      const engFilter = getEnglishGenre(genreFilter).toLowerCase();
      const uzbFilter = translateGenre(genreFilter).toLowerCase();
      const animeJanrlar = anime.janrlar ? anime.janrlar.toLowerCase() : '';
      matchesGenre = animeJanrlar.includes(engFilter) || animeJanrlar.includes(uzbFilter);
    }

    let matchesSearch = true;
    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      const title = (anime.title || '').toLowerCase();
      const desc = (anime.description || '').toLowerCase();
      const janrlar = (anime.janrlar || '').toLowerCase();
      const tags = (anime.tags || '').toLowerCase();
      matchesSearch = title.includes(q) || desc.includes(q) || janrlar.includes(q) || tags.includes(q);
    }

    return matchesGenre && matchesSearch;
  });

  const handleGenreSelect = (genre: string) => {
    if (genre === 'Barchasi') {
      searchParams.delete('genre');
    } else {
      searchParams.set('genre', genre);
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      searchParams.set('search', localSearch.trim());
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const clearSearch = () => {
    setLocalSearch('');
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Stats & Page Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide flex items-center gap-2">
            {searchFilter ? (
              <span>Qidiruv: <span className="text-[#ff006a]">"{searchFilter}"</span></span>
            ) : genreFilter ? (
              `${translateGenre(genreFilter)} Animelar`
            ) : (
              'Barcha Animelar'
            )}
          </h1>
          <p className="text-white/40 text-xs mt-1">Katalogda jami {filteredAnimes.length} ta anime mavjud</p>
        </div>

        {/* Search input + Grid/List View Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative min-w-[200px] sm:min-w-[260px]">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Katalogdan qidirish..."
              className="w-full bg-[#111113] border border-[#222] focus:border-[#ff006a] text-white text-xs rounded-sm pl-3 pr-8 py-2 font-bold placeholder:text-white/30 focus:outline-none transition-all"
            />
            {localSearch ? (
              <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <X size={14} />
              </button>
            ) : (
              <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#ff006a]">
                <Search size={14} />
              </button>
            )}
          </form>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-[#ff006a] text-white' : 'bg-[#111] border border-[#222] text-white/50 hover:text-white'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-[#ff006a] text-white' : 'bg-[#111] border border-[#222] text-white/50 hover:text-white'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Genre Filter Tags */}
      <div className="flex flex-wrap gap-1.5 py-2 overflow-x-auto">
        {genres.map((g) => {
          const isActive = genreFilter === g || (g === 'Barchasi' && !genreFilter);
          return (
            <button
              key={g}
              onClick={() => handleGenreSelect(g)}
              className={`px-4 py-1.5 rounded-sm text-xs font-bold transition-all ${
                isActive ? 'bg-[#ff006a] text-white shadow-[0_0_10px_rgba(255,0,106,0.3)]' : 'bg-[#111] border border-[#222] text-white/50 hover:bg-[#222] hover:text-white'
              }`}
            >
              {translateGenre(g)}
            </button>
          );
        })}
      </div>

      {/* 728x90 Advertisement Banner */}
      <AdBanner728x90 />

      {/* Empty State */}
      {filteredAnimes.length === 0 && (
        <div className="text-center py-20 bg-[#111] border border-[#222] rounded-sm space-y-4">
          <Film className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="text-lg font-bold text-white">Hech narsa topilmadi</h3>
          <p className="text-white/40 text-sm max-w-xs mx-auto">Siz kiritgan so'rov bo'yicha hech qanday anime topilmadi. Boshqa janr yoki kalit so'zni sinab ko'ring.</p>
          <button
            onClick={() => {
              setSearchParams({});
            }}
            className="bg-[#ff006a] hover:bg-[#d40058] text-white text-xs font-bold px-4 py-2 rounded-sm transition-colors"
          >
            Filtrlarni tozalash
          </button>
        </div>
      )}

      {/* Anime Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredAnimes.map((anime, idx) => (
            <motion.div
              key={anime.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <AnimeCard anime={anime} />
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredAnimes.map((anime, idx) => (
            <motion.div
              key={anime.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-[#111] border border-[#222] p-3 rounded-sm flex gap-4 hover:border-[#ff006a]/30 transition-colors group"
            >
              <Link to={`/anime/${toSlug(anime.title)}`} title={anime.title} className="w-16 h-20 rounded-sm overflow-hidden bg-[#000] shrink-0 border border-[#222] relative block">
                <img loading="lazy" decoding="async" 
                  src={anime.image_url} 
                  alt={anime.title} 
                  title={anime.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                />
              </Link>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Link to={`/anime/${toSlug(anime.title)}`} className="text-white font-bold text-base truncate group-hover:text-[#ff006a] transition-colors">
                      {anime.title}
                    </Link>
                    {anime.rating && (
                      <span className="flex items-center gap-0.5 text-yellow-400 font-bold text-[10px] px-1 bg-[#222] rounded-sm">
                        <Star className="w-2.5 h-2.5 fill-current" /> {Number(anime.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-xs line-clamp-2 mt-1 leading-relaxed">{anime.description}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/40 mt-2 font-mono">
                  <span>HOLATI: <span className="text-[#ff006a] font-bold">{anime.holati?.toUpperCase() || 'NOMA\'LUM'}</span></span>
                  <span>|</span>
                  <span>YIL: <span className="text-white/60">{anime.yil || 'Noma\'lum'}</span></span>
                  <span>|</span>
                  <span>QISMLAR: <span className="text-white/60">{anime.qismlar_soni || 1} ta</span></span>
                  <span>|</span>
                  <span className="flex items-center gap-1">KO'RISHLAR: <span className="text-white/60 flex items-center gap-0.5"><Eye className="w-3.5 h-3.5 text-[#ff006a]" /> {anime.korishlar || 0} ta</span></span>
                </div>
              </div>
              <div className="flex items-center shrink-0 pr-2">
                <Link
                  to={`/anime/${toSlug(anime.title)}`}
                  className="bg-[#ff006a] hover:bg-[#d40058] text-white text-xs font-bold px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5"
                >
                  <Play size={12} className="fill-current" /> Tomosha qilish
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
