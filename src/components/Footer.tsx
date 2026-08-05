import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Instagram, ShieldCheck, FileText, Copyright, Mail, Tv, BookOpen, Flame, Calendar } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0b0b0e] border-t border-[#1a1a20] text-white/70 pt-10 pb-20 md:pb-10 mt-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#181820]">
          
          {/* Column 1: Brand & Intro */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Animem.uz Logo" className="w-9 h-9 object-contain" />
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
            <p className="text-xs text-white/50">Yangi fasllar va premeyralardan xabardor bo'lish uchun obuna bo'ling:</p>
            <div className="flex flex-col gap-2 pt-1">
              <a
                href="https://t.me/animem_uz2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold px-3 py-2 bg-[#0088cc]/10 border border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/20 rounded transition-colors"
              >
                <Send size={14} /> Telegram Kanal
              </a>
              <a
                href="https://www.instagram.com/animem.uz.official/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold px-3 py-2 bg-[#E1306C]/10 border border-[#E1306C]/30 text-[#E1306C] hover:bg-[#E1306C]/20 rounded transition-colors"
              >
                <Instagram size={14} /> Instagram Sahifa
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
            <Link to="/maxfiylik-siyosati" className="hover:text-white transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/foydalanish-shartlari" className="hover:text-white transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/mualliflik-huquqi" className="hover:text-white transition-colors">DMCA</Link>
            <span>•</span>
            <Link to="/aloqa" className="hover:text-white transition-colors">Contacts</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
