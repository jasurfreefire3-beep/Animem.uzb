import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Anime, translateGenre, getEnglishGenre, toSlug } from '../types';
import { Star, Play, Grid, List, Film, Calendar, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export default function Animelar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const genreFilter = searchParams.get('genre') || '';
  const searchFilter = searchParams.get('search') || '';

  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (genreFilter && genreFilter !== 'Barchasi') {
      document.title = `${genreFilter} animelar - O'zbek tilida ko'rish | Animem.uz`;
    } else {
      document.title = "Barcha Animelar - O'zbek tilida tomosha qilish | Animem.uz";
    }
  }, [genreFilter]);

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const API_BASE = '';
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

  // Filtering logic
  const filteredAnimes = animes.filter((anime) => {
    let matchesGenre = true;
    if (genreFilter && genreFilter !== 'Barchasi') {
      const engFilter = getEnglishGenre(genreFilter).toLowerCase();
      const uzbFilter = translateGenre(genreFilter).toLowerCase();
      const animeJanrlar = anime.janrlar ? anime.janrlar.toLowerCase() : '';
      matchesGenre = animeJanrlar.includes(engFilter) || animeJanrlar.includes(uzbFilter);
    }
    const matchesSearch = !searchFilter || anime.title.toLowerCase().includes(searchFilter.toLowerCase()) || (anime.description && anime.description.toLowerCase().includes(searchFilter.toLowerCase()));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#ff006a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {genreFilter ? `${translateGenre(genreFilter)} Animelar` : 'Barcha Animelar'}
          </h1>
          <p className="text-white/40 text-xs mt-1">Katalogda jami {filteredAnimes.length} ta anime mavjud</p>
        </div>

        {/* Grid/List View Toggles */}
        <div className="flex items-center gap-2 self-start md:self-auto">
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
              <Link to={`/anime/${toSlug(anime.title)}`} title={`${anime.title} - O'zbek tilida ko'rish`} className="group block relative">
                <div className="relative aspect-[3/4] overflow-hidden mb-2 rounded-sm bg-[#111] border border-[#222]">
                  <img
                    src={anime.image_url}
                    alt={`${anime.title} - O'zbek tilida ko'rish`}
                    title={`${anime.title} - O'zbek tilida ko'rish`}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-11 h-11 bg-[#ff006a] rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_15px_rgba(255,0,106,0.5)]">
                      <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                    </div>
                  </div>
                  {anime.qismlar_soni && (
                    <div className="absolute bottom-2 left-2 bg-[#ff006a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                      EP {anime.qismlar_soni}
                    </div>
                  )}
                  {anime.rating && (
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 border border-white/5">
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                      {Number(anime.rating).toFixed(1)}
                    </div>
                  )}
                </div>
                <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#ff006a] transition-colors">
                  {anime.title}
                </h3>
                <div className="flex justify-between items-center text-[10px] text-white/40 mt-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-[#ff006a]/85" /> {anime.korishlar || 0}
                  </span>
                  <span>{anime.yil || 'Noma\'lum'}</span>
                </div>
              </Link>
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
              <Link to={`/anime/${toSlug(anime.title)}`} title={`${anime.title} - O'zbek tilida ko'rish`} className="w-16 h-20 rounded-sm overflow-hidden bg-[#000] shrink-0 border border-[#222] relative block">
                <img 
                  src={anime.image_url} 
                  alt={`${anime.title} - O'zbek tilida ko'rish`} 
                  title={`${anime.title} - O'zbek tilida ko'rish`}
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
