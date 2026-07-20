import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ff006a]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-lg w-full flex flex-col items-center"
      >
        {/* The beautiful image uploaded by user */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="w-full max-w-sm mb-8 rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-2 shadow-2xl"
        >
          <img 
            src="/BezNazvaniya.png" 
            alt="Sahifa topilmadi" 
            className="w-full h-auto object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Text details */}
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-white mb-3">
          Sahifa topilmadi
        </h1>
        
        <p className="text-sm text-white/60 max-w-md mx-auto leading-relaxed mb-8">
          Afsuski, siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko'chirilgan bo'lishi mumkin. 
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#ff006a] hover:bg-[#d40058] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all duration-300 w-full sm:w-auto shadow-lg shadow-[#ff006a]/20 cursor-pointer"
          >
            <Home size={14} />
            Bosh sahifaga qaytish
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all duration-300 w-full sm:w-auto cursor-pointer"
          >
            <ArrowLeft size={14} />
            Orqaga qaytish
          </button>
        </div>
      </motion.div>
    </div>
  );
}
