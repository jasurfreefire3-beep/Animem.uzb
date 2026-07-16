import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AnimeDetails from './pages/AnimeDetails';
import Admin from './pages/Admin';
import Chat from './pages/Chat';
import ChatWidget from './components/ChatWidget';
import { Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Newly added pages
import Animelar from './pages/Animelar';
import Jadval from './pages/Jadval';
import YangiChiqishlar from './pages/YangiChiqishlar';
import Top100 from './pages/Top100';
import Sevimlilar from './pages/Sevimlilar';
import Tarix from './pages/Tarix';
import Sozlamalar from './pages/Sozlamalar';
import Profil from './pages/Profil';

export default function App() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showTelegramBanner, setShowTelegramBanner] = useState(() => {
    const closed = localStorage.getItem('telegramBannerClosed');
    return closed !== 'true';
  });

  const closeBanner = () => {
    setShowTelegramBanner(false);
    localStorage.setItem('telegramBannerClosed', 'true');
  };
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-[#ff006a]/30 custom-scrollbar relative flex">
      <AnimatePresence>
        {showTelegramBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-[#09090b]/95 backdrop-blur-md border-b border-[#0088cc]/30 shadow-[0_4px_30px_rgba(0,136,204,0.25)] py-3 px-4 md:px-8"
          >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="bg-[#0088cc]/10 p-1.5 rounded-full border border-[#0088cc]/30 animate-bounce">
                  <Send className="w-4 h-4 text-[#0088cc] fill-current" />
                </div>
                <p className="text-white font-medium text-xs md:text-sm">
                  Telegram kanalimizga obuna bo'ling! Eng so'nggi premyeralar va sifatli animelar faqat bizda.
                </p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <motion.a
                  href="https://t.me/animemuz1"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(0, 136, 204, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#0088cc]/20 transition-all uppercase tracking-wider cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 fill-current" />
                  Telegram kanalga o'tish
                </motion.a>
                <button
                  onClick={closeBanner}
                  className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
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
        <main className="flex-1 pt-24 md:pt-20 pb-12 px-4 md:px-8 max-w-[1440px] mx-auto w-full relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/anime/:animeId/:slug" element={<AnimeDetails />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/chat" element={<Chat />} />
            
            {/* Added high fidelity views matching user design */}
            <Route path="/animelar" element={<Animelar />} />
            <Route path="/jadval" element={<Jadval />} />
            <Route path="/yangi-chiqishlar" element={<YangiChiqishlar />} />
            <Route path="/top100" element={<Top100 />} />
            <Route path="/sevimlilar" element={<Sevimlilar />} />
            <Route path="/tarix" element={<Tarix />} />
            <Route path="/sozlamalar" element={<Sozlamalar />} />
            <Route path="/profil" element={<Profil />} />
          </Routes>
        </main>

        <footer className="p-4 text-center border-t border-[#1a1a1a] mt-auto">
          <a
            href="https://t.me/animemuz1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-white/40 hover:text-[#0088cc] transition-colors text-xs uppercase tracking-wider"
          >
            <Send className="w-4 h-4" />
            Telegram kanal
          </a>
        </footer>
      </div>

      {/* 4. Overlay Chat widgets */}
      <ChatWidget />
    </div>
  );
}
