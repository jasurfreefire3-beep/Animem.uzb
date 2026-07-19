import { useState, useEffect } from 'react';
import { Settings, Eye, Globe, Film, ToggleLeft, ToggleRight, Sparkles, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function Sozlamalar() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light' ? 'Yorug\'' : 'Qorong\'i';
  });
  const [language, setLanguage] = useState('O\'zbekcha');
  const [quality, setQuality] = useState('1080p');
  const [autoPlay, setAutoPlay] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    // Sync with html class initial state
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    // Load config from localStorage
    const savedAutoPlay = localStorage.getItem('anime_settings_autoplay');
    if (savedAutoPlay !== null) {
      setAutoPlay(savedAutoPlay === 'true');
    }
    const savedQuality = localStorage.getItem('anime_settings_quality');
    if (savedQuality) {
      setQuality(savedQuality);
    }
    const savedLang = localStorage.getItem('anime_settings_lang');
    if (savedLang) {
      setLanguage(savedLang);
    }

    const syncTheme = () => {
      const currentSaved = localStorage.getItem('theme');
      setTheme(currentSaved === 'light' ? 'Yorug\'' : 'Qorong\'i');
    };

    window.addEventListener('theme-changed', syncTheme);
    return () => window.removeEventListener('theme-changed', syncTheme);
  }, []);

  const handleThemeChange = (val: string) => {
    setTheme(val);
    const themeKey = val === 'Yorug\'' ? 'light' : 'dark';
    localStorage.setItem('theme', themeKey);
    if (themeKey === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    window.dispatchEvent(new Event('theme-changed'));
    triggerSaveAlert();
  };

  const handleAutoplayToggle = () => {
    const newVal = !autoPlay;
    setAutoPlay(newVal);
    localStorage.setItem('anime_settings_autoplay', String(newVal));
    triggerSaveAlert();
  };

  const handleQualityChange = (val: string) => {
    setQuality(val);
    localStorage.setItem('anime_settings_quality', val);
    triggerSaveAlert();
  };

  const handleLangChange = (val: string) => {
    setLanguage(val);
    localStorage.setItem('anime_settings_lang', val);
    triggerSaveAlert();
  };

  const triggerSaveAlert = () => {
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6 relative overflow-hidden">
        <h1 className="text-2xl font-bold uppercase tracking-wide flex items-center gap-3">
          <Settings className="w-6 h-6 text-[#ff006a]" /> Sozlamalar (Settings)
        </h1>
        <p className="text-white/50 text-xs mt-1">Platformadan foydalanish shaxsiy sozlamalari</p>
      </div>

      {savedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-sm flex items-center gap-2"
        >
          <Check size={14} /> Sozlamalar muvaffaqiyatli saqlandi!
        </motion.div>
      )}

      {/* Settings Panel */}
      <div className="bg-[#111] border border-[#222] rounded-sm p-6 divide-y divide-[#222] space-y-6">
        
        {/* Theme Settings */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#ff006a]" /> Interfeys Mavzusi (Theme)
            </h3>
            <p className="text-white/40 text-xs">Ilova vizual ko'rinish fonini sozlang</p>
          </div>
          <div className="flex items-center space-x-1.5">
            {['Qorong\'i', 'Yorug\''].map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`px-4 py-2 rounded-sm text-xs font-bold border transition-colors cursor-pointer ${
                  theme === t 
                    ? 'bg-[#ff006a] border-[#ff006a] text-white shadow-[0_0_10px_rgba(255,0,106,0.2)]' 
                    : 'bg-[#000] border-[#222] text-white/50 hover:text-white hover:border-[#333]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Language Settings */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe size={16} className="text-[#ff006a]" /> Tizim Tili (Language)
            </h3>
            <p className="text-white/40 text-xs">Mavjud tillardan birini tanlang</p>
          </div>
          <div className="flex items-center space-x-1.5">
            {['O\'zbekcha', 'English', 'Русский'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLangChange(lang)}
                className={`px-4 py-2 rounded-sm text-xs font-bold border transition-colors ${
                  language === lang 
                    ? 'bg-[#ff006a] border-[#ff006a] text-white shadow-[0_0_10px_rgba(255,0,106,0.2)]' 
                    : 'bg-[#000] border-[#222] text-white/50 hover:text-white hover:border-[#333]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Video Quality Settings */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Film size={16} className="text-[#ff006a]" /> Standart Sifat (Video Quality)
            </h3>
            <p className="text-white/40 text-xs">Videolar yuklanadigan standart sifat formati</p>
          </div>
          <div className="flex items-center space-x-1.5">
            {['1080p', '720p', '480p', 'Auto'].map((q) => (
              <button
                key={q}
                onClick={() => handleQualityChange(q)}
                className={`px-4 py-2 rounded-sm text-xs font-bold border transition-colors ${
                  quality === q 
                    ? 'bg-[#ff006a] border-[#ff006a] text-white shadow-[0_0_10px_rgba(255,0,106,0.2)]' 
                    : 'bg-[#000] border-[#222] text-white/50 hover:text-white hover:border-[#333]'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Play Settings */}
        <div className="flex items-center justify-between gap-4 pt-6">
          <div className="space-y-0.5 flex-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye size={16} className="text-[#ff006a]" /> Avtomatik ijro (Auto Play)
            </h3>
            <p className="text-white/40 text-xs">Video sahifasiga kirganda pleer avtomatik ravishda boshlanadi</p>
          </div>
          <button
            onClick={handleAutoplayToggle}
            className="p-1 text-white hover:text-[#ff006a] transition-all"
          >
            {autoPlay ? (
              <ToggleRight size={40} className="text-[#ff006a]" />
            ) : (
              <ToggleLeft size={40} className="text-white/30" />
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
