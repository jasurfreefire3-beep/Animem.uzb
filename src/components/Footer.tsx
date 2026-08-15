import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, ShieldCheck, FileText, Copyright, Mail, Tv, BookOpen, Flame, Calendar } from 'lucide-react';
import AdBanner728x90 from './AdBanner728x90';
import { TikTokIcon } from './SocialIcons';

const TelegramIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const FacebookIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[#0b0b0e] border-t border-[#1a1a20] text-white/70 pt-6 pb-20 md:pb-10 mt-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Ad Banner Placement */}
        <div className="mb-8">
          <AdBanner728x90 />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#181820]">
          
          {/* Column 1: Brand & Intro */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <img loading="lazy" decoding="async" src="/logo.png" alt="Animem.uz Logo" className="w-9 h-9 object-contain" />
              <span className="font-black text-xl tracking-wider text-white">
                ANIMEM<span className="text-[#ff006a]">.UZ</span>
              </span>
            </Link>
            <p className="text-xs text-white/50 leading-relaxed">
              O'zbekistondagi eng yirik va zamonaviy onlayn anime hamda manga portali. Sevimli animelaringizni HD formatda bepul tomosha qiling va mangalarni o'zbek tilida o'qing.
            </p>

            {/* Badges */}
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2 py-0.5 bg-[#ff006a]/15 text-[#ff006a] border border-[#ff006a]/30 font-bold text-[10px] rounded">
                16+ Yoshi cheklovi
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] rounded">
                HD 1080p
              </span>
              <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold text-[10px] rounded">
                SSL Xavfsiz
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#222] pb-2">
              Katalog va Bo'limlar
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/animelar" className="hover:text-[#ff006a] transition-colors flex items-center gap-2">
                  <Tv size={13} className="text-[#ff006a]" /> Barcha Animelar
                </Link>
              </li>
              <li>
                <Link to="/manga" className="hover:text-[#ff006a] transition-colors flex items-center gap-2">
                  <BookOpen size={13} className="text-[#ff006a]" /> Manga va Komikslar
                </Link>
              </li>
              <li>
                <Link to="/top100" className="hover:text-[#ff006a] transition-colors flex items-center gap-2">
                  <Flame size={13} className="text-[#ff006a]" /> TOP-100 Animelar
                </Link>
              </li>
              <li>
                <Link to="/jadval" className="hover:text-[#ff006a] transition-colors flex items-center gap-2">
                  <Calendar size={13} className="text-[#ff006a]" /> Chiqish Jadvali
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Compliance */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#222] pb-2">
              Huquqiy Hujjatlar
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/maxfiylik-siyosati" className="hover:text-[#ff006a] transition-colors flex items-center gap-2">
                  <ShieldCheck size={13} className="text-[#ff006a]" /> Maxfiylik Siyosati
                </Link>
              </li>
              <li>
                <Link to="/foydalanish-shartlari" className="hover:text-[#ff006a] transition-colors flex items-center gap-2">
                  <FileText size={13} className="text-[#ff006a]" /> Foydalanish Shartlari
                </Link>
              </li>
              <li>
                <Link to="/mualliflik-huquqi" className="hover:text-[#ff006a] transition-colors flex items-center gap-2">
                  <Copyright size={13} className="text-[#ff006a]" /> Mualliflik Huquqi (DMCA)
                </Link>
              </li>
              <li>
                <Link to="/aloqa" className="hover:text-[#ff006a] transition-colors flex items-center gap-2">
                  <Mail size={13} className="text-[#ff006a]" /> Aloqa va Qayta Aloqa
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Social & Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#222] pb-2">
              Ijtimoiy Tarmoqlar
            </h3>

            <p className="text-xs text-white/50">
              Yangi fasllar va premeyralardan xabardor bo'lish uchun obuna bo'ling:
            </p>

            <div className="flex flex-col gap-2 pt-1">

              {/* Telegram */}
              <a
                href="https://t.me/animem_uz2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs font-bold px-3 py-2 bg-[#0088cc]/10 border border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/20 rounded transition-colors"
              >
                <TelegramIcon className="w-4 h-4 text-[#0088cc]" /> Telegram Kanal
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/animem.uz_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs font-bold px-3 py-2 bg-[#E1306C]/10 border border-[#E1306C]/30 text-[#E1306C] hover:bg-[#E1306C]/20 rounded transition-colors"
              >
                <Instagram size={15} /> Instagram Sahifa
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/animem.uz1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs font-bold px-3 py-2 bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/20 rounded transition-colors"
              >
                <FacebookIcon className="w-4 h-4 text-[#1877F2]" /> Facebook Sahifa
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@animem.uz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs font-bold px-3 py-2 bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded transition-colors"
              >
                <TikTokIcon size={16} className="w-4 h-4" /> TikTok Sahifa
              </a>

              {/* YouTube */}
              <a
                href="https://www.youtube.com/@animem_uz_org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs font-bold px-3 py-2 bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF0000] hover:bg-[#FF0000]/20 rounded transition-colors"
              >
                <Youtube size={16} /> YouTube Kanal
              </a>

            </div>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[11px] text-white/40">
          <div>
            © 2026 Animem.uz. Barcha huquqlar himoyalangan. Materiallardan nusxa ko'chirishda faol havola ko'rsatilishi shart.
          </div>

          <div className="flex items-center gap-4">
            <Link to="/maxfiylik-siyosati" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link to="/foydalanish-shartlari" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link to="/mualliflik-huquqi" className="hover:text-white transition-colors">
              DMCA
            </Link>
            <span>•</span>
            <Link to="/aloqa" className="hover:text-white transition-colors">
              Contacts
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
