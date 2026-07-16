import fs from 'fs';
const content = fs.readFileSync('src/pages/AnimeDetails.tsx', 'utf8');

const target = `                   <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold px-2.5 py-1 bg-black/60 rounded-sm border border-white/5">
                     <Star className="w-3 h-3 fill-current" /> {anime.rating ? anime.rating.toFixed(1) : '9.2'}
                   </span>`;

const replacement = target + `
                   {/* Rating Stars */}
                   <div className="flex items-center gap-0.5 ml-2">
                       {[1, 2, 3, 4, 5].map((star) => (
                           <button key={star} onClick={() => handleRate(star)} className="text-yellow-400 hover:scale-110 transition-transform">
                               <Star className={\`w-4 h-4 \${star <= (userRating || Math.round(anime.rating || 0)) ? 'fill-current' : 'text-gray-600'}\`} />
                           </button>
                       ))}
                   </div>
                   <span className="text-white/40 text-[10px] ml-2">({anime.rating_count || 0} baho)</span>`;

if (content.includes(target)) {
    const newContent = content.replace(target, replacement);
    fs.writeFileSync('src/pages/AnimeDetails.tsx', newContent);
    console.log('Success');
} else {
    console.error('Target not found');
}
