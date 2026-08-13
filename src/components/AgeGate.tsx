import { motion } from 'motion/react';
import { ShieldAlert, ArrowLeft, Check } from 'lucide-react';

interface AgeGateProps {
  title?: string;
  poster?: string;
  onConfirm: () => void;
  onBack: () => void;
}

export default function AgeGate({ title, poster, onConfirm, onBack }: AgeGateProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      >
        {poster && (
          <img
            src={poster}
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-10 blur-2xl scale-110 select-none pointer-events-none"
          />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.1 }}
        className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-gradient-to-b from-[#16060d] via-[#0c0309] to-[#050205] shadow-[0_0_60px_rgba(239,68,68,0.25)] overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />

        <div className="p-6 sm:p-8 text-center space-y-5">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.25 }}
            className="relative mx-auto w-24 h-24 flex items-center justify-center"
          >
            <motion.span
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-red-600/25"
            />
            <span className="absolute inset-2 rounded-full border-2 border-red-500/60" />
            <span className="text-3xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
              18+
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide flex items-center justify-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Kattalar uchun kontent
            </h2>
            {title && (
              <p className="text-sm font-bold text-red-400/90 line-clamp-1">{title}</p>
            )}
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
              Ushbu anime 18 yoshdan kichik tomoshabinlar uchun mo'ljallanmagan sahnalarni o'z
              ichiga olishi mumkin. Davom etish uchun yoshingizni tasdiqlang.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-3 pt-1"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-[#ff006a] text-white text-sm font-black uppercase tracking-wide shadow-[0_8px_30px_rgba(239,68,68,0.35)]"
            >
              <Check className="w-4 h-4" /> Men 18 yoshdan kattaman
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onBack}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/15 bg-white/5 text-white/80 text-sm font-bold uppercase tracking-wide hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Ortga qaytish
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-[10px] text-white/30 uppercase tracking-widest"
          >
            Animem.uz — mas'uliyatli tomosha
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
