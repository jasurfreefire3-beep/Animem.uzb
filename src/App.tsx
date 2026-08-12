import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AnimeDetails from './pages/AnimeDetails';
import Admin from './pages/Admin';
import Chat from './pages/Chat';
import ChatWidget from './components/ChatWidget';
import SpinBetterAdModal from './components/SpinBetterAdModal';
import { Send, X, Instagram } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Newly added pages
import Animelar from './pages/Animelar';
import Mangalar from './pages/Mangalar';
import MangaDetails from './pages/MangaDetails';
import MangaReader from './pages/MangaReader';
import Jadval from './pages/Jadval';
import YangiChiqishlar from './pages/YangiChiqishlar';
import Top100 from './pages/Top100';
import Sevimlilar from './pages/Sevimlilar';
import Tarix from './pages/Tarix';
import Sozlamalar from './pages/Sozlamalar';
import Profil from './pages/Profil';
import Donat from './pages/Donat';
import NotFound from './pages/NotFound';
import SupportBot from './pages/SupportBot';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DMCA from './pages/DMCA';
import Aloqa from './pages/Aloqa';

export default function App() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showTelegramBanner, setShowTelegramBanner] = useState(true);
  
  const location = useLocation();
  const isSupportBot = location.pathname === '/support';

  // Previously we injected several third-party popunder and smart-link scripts which
  // opened popups or created redirects. Those behaviours conflict with ad network
  // policies (Yandex Ads) and can cause resource rejection. To comply, we avoid
  // injecting any popunder/smartlink scripts here. Use explicit in-page banners only.
  useEffect(() => {
    // Intentionally left blank: third-party popunder / auto-popup ad scripts disabled
    // to maintain compliance with ad network policies (no popups, no redirects).
    return () => {};
  }, [location.pathname]);

  const closeBanner = () => {
    setShowTelegramBanner(false);
  };
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  if (isSupportBot) {
    return (
      <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-[#ff006a]/30 custom-scrollbar relative flex">
        <Routes>
          <Route path="/support" element={<SupportBot />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-[#ff006a]/30 custom-scrollbar relative flex">
      <AnimatePresence>
        {showTelegramBanner && (
          <motion.div
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="fixed top-[4.25rem] md:top-20 left-2 right-2 md:left-72 md:right-6 z-[60] max-w-7xl mx-auto"
          >
            <div className="relative w-full rounded-xl md:rounded-2xl bg-gradient-to-r from-[#070e17] via-[#0b172a] to-[#070e17] border border-cyan-500/30 p-3 md:p-6 shadow-[0_10px_40px_rgba(0,136,204,0.25)] flex flex-row lg:flex-row items-center justify-between gap-3 md:gap-6">
              {/* Left Side: Icon, Badges, Title & Subtitle */}
              <div className="flex flex-row md:flex-row items-center md:items-start gap-3 md:gap-4 flex-1 min-w-0">
                {/* Logo with NEW badge */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-tr from-[#0088cc] to-[#00bfff] flex items-center justify-center shadow-lg shadow-[#0088cc]/30">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-8 md:h-8 text-white fill-current">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.99.54-1.41.53-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.41-1.4-.87.03-.24.36-.49.99-.75 3.86-1.68 6.43-2.78 7.72-3.3 3.67-1.48 4.44-1.74 4.94-1.75.11 0 .35.03.5.16.13.11.17.26.18.37 0 .04.01.18 0 .27z" />
                    </svg>
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border-2 border-[#070e17] shadow-md uppercase tracking-wider animate-pulse">
                    New
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  {/* Badges */}
                  <div className="hidden md:flex flex-wrap items-center justify-start gap-2 mb-2">
                    <span className="bg-[#0088cc]/10 text-[#00c8ff] text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-md border border-[#00c8ff]/20 uppercase">
                      TELEGRAM KANAL
                    </span>
                    <span className="bg-[#ffbb00]/10 text-[#ffbb00] text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-[#ffbb00]/20 flex items-center gap-1">
                      ✨ Rasmiy
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-white font-bold text-xs sm:text-sm md:text-lg tracking-tight leading-snug">
                    Bizning Rasmiy Telegram Kanalimizga Qo'shiling!
                  </h3>
                  <p className="hidden sm:block text-slate-400 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
                    Eng yangi animelar, premyeralar, o'zbekcha tarjimalar va do'stona suhbatlarni o'tkazib yubormaslik uchun hoziroq a'zo bo'ling!
                  </p>
                </div>
              </div>

              {/* Right Side: Action Button and Close Button */}
              <div className="flex items-center gap-2 md:gap-3 w-auto justify-end shrink-0">
                <motion.a
                  href="https://t.me/animem_uz2"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(0, 136, 204, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-[#0088cc] to-[#00aaff] hover:from-[#0077bb] hover:to-[#0099ee] text-white px-3 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0088cc]/20 transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current shrink-0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.99.54-1.41.53-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.41-1.4-.87.03-.24.36-.49.99-.75 3.86-1.68 6.43-2.78 7.72-3.3 3.67-1.48 4.44-1.74 4.94-1.75.11 0 .35.03.5.16.13.11.17.26.18.37 0 .04.01.18 0 .27z" />
                  </svg>
                  <span className="hidden min-[400px]:inline">Kanalga o'tish</span>
                  <span className="min-[400px]:hidden">A'zo bo'lish</span>
                </motion.a>

                <button
                  onClick={closeBanner}
                  className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
                  aria-label="Yopish"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Desktop Sidebar (Persistent) */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="w-64 h-screen fixed left-0 top-0 z-40 border-r border-[#1a1a1a] bg-[#09090b]">
          <Sidebar />
        </div>
      </div>

      {/* 2. Mobile Sidebar Overlay & Sliding panel */}
      {mobileSidebarOpen && (
        <div 
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}
      <div className={`fixed inset-y-0 left-0 w-64 border-r border-[#1a1a1a] bg-[#09090b] transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 md:hidden`}>
        <Sidebar onClose={closeMobileSidebar} />
      </div>

      {/* 3. Main content frame */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        <Navbar onToggleSidebar={toggleMobileSidebar} />
        
        {/* Main Content Area */}
        <main className="flex-1 pt-24 md:pt-20 pb-24 md:pb-12 px-4 md:px-8 max-w-[1440px] mx-auto w-full relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/anime/:slug" element={<AnimeDetails />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/chat" element={<Chat />} />
            
            {/* Added high fidelity views matching user design */}
            <Route path="/animelar" element={<Animelar />} />
            <Route path="/manga" element={<Mangalar />} />
            <Route path="/mangalar" element={<Navigate to="/manga" replace />} />
            <Route path="/manga/:id" element={<MangaDetails />} />
            <Route path="/manga/:id/read/:chapterNumber" element={<MangaReader />} />
            <Route path="/jadval" element={<Jadval />} />
            <Route path="/yangi-chiqishlar" element={<YangiChiqishlar />} />
            <Route path="/top100" element={<Top100 />} />
            <Route path="/sevimlilar" element={<Sevimlilar />} />
            <Route path="/tarix" element={<Tarix />} />
            <Route path="/sozlamalar" element={<Sozlamalar />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/user/:id" element={<Profil />} />
            <Route path="/donat" element={<Donat />} />
            
            {/* Legal & Moderation Compliance Routes */}
            <Route path="/maxfiylik-siyosati" element={<PrivacyPolicy />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/foydalanish-shartlari" element={<TermsOfService />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/mualliflik-huquqi" element={<DMCA />} />
            <Route path="/dmca" element={<DMCA />} />
            <Route path="/aloqa" element={<Aloqa />} />
            <Route path="/contacts" element={<Aloqa />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>

      {/* 4. Overlay Chat widgets, Mobile Navigation & Ad Modal */}
      <MobileBottomNav />
      <ChatWidget />
      <SpinBetterAdModal />
    </div>
  );
}
