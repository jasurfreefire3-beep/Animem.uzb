import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Download, X } from 'lucide-react';

const AFFILIATE_URL = "https://spin-b.com/mwGY27?tag=d_221320m_722889c_cz_AufBZvd8JsHCVwcFAHWmcL";
const TEN_MINUTES_MS = 10 * 60 * 1000; // 10 minutes

// High quality clean SVG fallback data URL for SpinBetter
const SPINBETTER_LOGO_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'><rect width='200' height='200' rx='40' fill='%230f172a'/><circle cx='100' cy='80' r='45' fill='%231d4ed8'/><circle cx='100' cy='80' r='45' fill='none' stroke='%23facc15' stroke-width='6' stroke-dasharray='10 5'/><path d='M 115 65 C 115 55, 85 55, 85 70 C 85 85, 115 80, 115 95 C 115 110, 85 110, 85 100' fill='none' stroke='%23facc15' stroke-width='9' stroke-linecap='round'/><rect x='15' y='140' width='170' height='40' rx='10' fill='%2322c55e'/><text x='100' y='166' font-family='sans-serif' font-weight='900' font-size='18' fill='%23ffffff' text-anchor='middle'>SPINBETTER</text></svg>";

export default function SpinBetterAdModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("/spinbetter_logo.svg");
  const location = useLocation();

  useEffect(() => {
    const checkAndShowAd = () => {
      const lastShownStr = localStorage.getItem('spinbetter_last_ad_time');
      const lastShown = lastShownStr ? parseInt(lastShownStr, 10) : 0;
      const now = Date.now();

      if (!lastShown || now - lastShown >= TEN_MINUTES_MS) {
        setIsOpen(true);
        localStorage.setItem('spinbetter_last_ad_time', now.toString());
      }
    };

    // Check 3 seconds after page load or navigation
    const timer = setTimeout(checkAndShowAd, 3000);

    // Also set up periodic check every minute
    const interval = setInterval(() => {
      const lastShownStr = localStorage.getItem('spinbetter_last_ad_time');
      const lastShown = lastShownStr ? parseInt(lastShownStr, 10) : 0;
      if (Date.now() - lastShown >= TEN_MINUTES_MS) {
        setIsOpen(true);
        localStorage.setItem('spinbetter_last_ad_time', Date.now().toString());
      }
    }, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    localStorage.setItem('spinbetter_last_ad_time', Date.now().toString());
  };

  const handleAdClick = () => {
    window.open(AFFILIATE_URL, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    localStorage.setItem('spinbetter_last_ad_time', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          {/* Motion backdrop click to close or click ad */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-sm md:max-w-md bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-gray-200 select-none overflow-visible"
          >
            {/* Green "Ad" Badge on top-left corner */}
            <div className="absolute -top-3 left-6 bg-[#8cc63f] text-white text-[11px] font-black px-3 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1 border border-white/40">
              <span>Ad</span>
            </div>

            {/* Top Close 'X' Button */}
            <button
              onClick={handleClose}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Body - Logo & Details */}
            <div 
              onClick={handleAdClick}
              className="flex items-center gap-4 mt-2 mb-6 cursor-pointer group"
            >
              <div className="relative shrink-0">
                <img
                  src={imgSrc}
                  onError={() => setImgSrc(SPINBETTER_LOGO_FALLBACK)}
                  alt="SpinBetter Logo"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-md border border-gray-100 group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-snug group-hover:text-[#1d6bf3] transition-colors">
                  SpinBetter
                </h3>
                <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed mt-1">
                  Eng yaxshi sport tikish va slot kazino platformasi! Rasmiy dasturni yuklab oling va bonuslarga ega bo'ling.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-4 rounded-2xl border-2 border-gray-200 hover:bg-gray-100 text-gray-700 font-extrabold text-xs md:text-sm transition-all cursor-pointer text-center"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleAdClick}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#1d6bf3] hover:bg-[#1556ca] active:scale-95 text-white font-extrabold text-xs md:text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Free Download</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
