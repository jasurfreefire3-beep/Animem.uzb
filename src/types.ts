export interface User {
  id: number;
  name: string;
  role: 'user' | 'admin';
}

export interface Anime {
  id: number;
  title: string;
  description: string;
  image_url: string;
  banner_url: string;
  rating: number;
  rating_count: number;
  holati: string;
  yil: number | null;
  studiyasi: string;
  qismlar_soni: number;
  janrlar: string;
  video_url: string;
  tavsiya: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  anime_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Message {
  id: number;
  user_id: number;
  user_name: string;
  content: string;
  reply_to_id?: number | null;
  reply_to_name?: string | null;
  reply_to_content?: string | null;
  created_at: string;
}

export const GENRE_MAP: Record<string, string> = {
  'Action': 'Jangari',
  'Adventure': 'Sarguzasht',
  'Comedy': 'Komediya',
  'Drama': 'Drama',
  'Fantasy': 'Fantastika',
  'Horror': 'Dahshatli',
  'Romance': 'Romantika',
  'Sci-Fi': 'Ilmiy-fantastika',
  'Slice of Life': 'Kundalik hayot',
  'Supernatural': 'G\'ayritabiiy'
};

export function translateGenre(genre: string): string {
  const normalized = genre.trim();
  for (const [eng, uzb] of Object.entries(GENRE_MAP)) {
    if (eng.toLowerCase() === normalized.toLowerCase()) return uzb;
    if (uzb.toLowerCase() === normalized.toLowerCase()) return uzb;
  }
  return normalized;
}

export function getEnglishGenre(genre: string): string {
  const normalized = genre.trim();
  for (const [eng, uzb] of Object.entries(GENRE_MAP)) {
    if (uzb.toLowerCase() === normalized.toLowerCase()) return eng;
    if (eng.toLowerCase() === normalized.toLowerCase()) return eng;
  }
  return normalized;
}

export function toSlug(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/o['’`‘]/g, "o")
    .replace(/g['’`‘]/g, "g")
    .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}


