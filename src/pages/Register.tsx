import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Phone, X, Loader2, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Telegram Login States
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramSessionId, setTelegramSessionId] = useState('');
  const [telegramStatus, setTelegramStatus] = useState<'pending' | 'pending_phone' | 'authorized' | 'expired' | ''>('');
  const [telegramProgress, setTelegramProgress] = useState(1); // 1: go to bot, 2: send contact, 3: success

  // Poll Telegram auth session status
  useEffect(() => {
    if (!telegramSessionId || showTelegramModal === false || telegramStatus === 'authorized') return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/telegram/status/${telegramSessionId}`);
        const data = await res.json();
        
        if (!isMounted) return;

        if (data.status) {
          setTelegramStatus(data.status);
          if (data.status === 'pending_phone') {
            setTelegramProgress(2);
          } else if (data.status === 'authorized') {
            setTelegramProgress(3);
            clearInterval(interval);
            
            // Wait 2.5 seconds to show the beautiful checkmark animation, then login!
            setTimeout(() => {
              login(data.token, data.user);
              setShowTelegramModal(false);
              navigate('/');
            }, 2500);
          } else if (data.status === 'expired') {
            setError('Telegram avtorizatsiya vaqti tugadi.');
            setShowTelegramModal(false);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error polling Telegram session:', err);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [telegramSessionId, showTelegramModal, telegramStatus]);

  const handleTelegramLoginStart = async () => {
    try {
      setError('');
      setTelegramProgress(1);
      setTelegramStatus('pending');
      
      const res = await fetch('/api/auth/telegram/session');
      const data = await res.json();
      
      if (data.sessionId) {
        setTelegramSessionId(data.sessionId);
        setShowTelegramModal(true);
      } else {
        throw new Error('Telegram seansini yaratib bo\'lmadi');
      }
    } catch (err: any) {
      setError(err.message || 'Telegram orqali kirishni boshlashda xatolik');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const API_BASE = '';
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const API_BASE = '';
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: user.email, 
          name: user.displayName || 'Google User', 
          uid: user.uid,
          avatar_url: user.photoURL
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google orqali kirishda xatolik');
    }
  };



  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#111] border border-[#222] rounded-sm p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#ff006a]/10 rounded-sm flex items-center justify-center mx-auto mb-4 border border-[#ff006a]/20">
            <UserPlus className="w-8 h-8 text-[#ff006a]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Create Account</h1>
          <p className="text-white/50 text-sm">Join the largest anime community</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold p-3 rounded-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-white/30" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                placeholder="Otaku123"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-white/30" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-white/30" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#ff006a] hover:bg-[#d40058] text-white font-bold py-3 px-4 rounded-sm transition-colors mt-6"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#222]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-[#111] px-2 text-white/40">yoki</span>
            </div>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black hover:bg-gray-100 font-bold py-3 px-4 rounded-sm transition-colors mt-6 flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google bilan kirish
          </button>

          <button
            type="button"
            onClick={handleTelegramLoginStart}
            className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-3 px-4 rounded-sm transition-colors mt-3 flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.34.52-.41-.01-1.21-.23-1.8-.42-.73-.24-1.32-.37-1.27-.78.02-.21.31-.43.87-.67 3.42-1.49 5.71-2.48 6.86-2.96 3.27-1.37 3.95-1.61 4.4-.1.01.03.02.05.02.08.01.12.01.25-.01.37z" />
            </svg>
            Telegram bilan kirish
          </button>
        </div>

        <div className="mt-8 text-center text-xs font-bold text-white/50">
          Already have an account?{' '}
          <Link to="/login" className="text-[#ff006a] hover:text-[#d40058] transition-colors uppercase tracking-wide">
            Sign in
          </Link>
        </div>
      </motion.div>

      {/* Telegram Verification Modal Overlay */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-lg overflow-hidden shadow-2xl relative"
          >
            {/* Close */}
            <button
              onClick={() => setShowTelegramModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            {telegramProgress < 3 ? (
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#0088cc]/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#0088cc]/20">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0088cc] fill-current">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.34.52-.41-.01-1.21-.23-1.8-.42-.73-.24-1.32-.37-1.27-.78.02-.21.31-.43.87-.67 3.42-1.49 5.71-2.48 6.86-2.96 3.27-1.37 3.95-1.61 4.4-.1.01.03.02.05.02.08.01.12.01.25-.01.37z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Telegram orqali kirish</h2>
                  <p className="text-white/40 text-xs mt-1">Xavfsiz va tezkor avtorizatsiya tizimi</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center items-center gap-2 mb-8">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                    telegramProgress === 1 
                      ? 'bg-[#0088cc]/10 border-[#0088cc]/30 text-[#0088cc]' 
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-[#0088cc] text-white flex items-center justify-center text-[9px] font-black">1</span>
                    Botga o'tish
                  </div>
                  <div className="w-4 h-[1px] bg-white/10"></div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                    telegramProgress === 2 
                      ? 'bg-[#0088cc]/10 border-[#0088cc]/30 text-[#0088cc]' 
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-[#0088cc] text-white flex items-center justify-center text-[9px] font-black">2</span>
                    Kontaktni yuborish
                  </div>
                </div>

                {/* Step contents */}
                {telegramProgress === 1 ? (
                  <div className="space-y-4 text-center">
                    <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
                      Quyidagi tugmani bosing va Telegram botimizni ochib, pastda <strong className="text-[#0088cc]">"START"</strong> (Boshlash) tugmasini bosing:
                    </p>
                    <div className="py-2">
                      <a
                        href={`https://t.me/Animemuz_register_bot?start=${telegramSessionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 text-white font-bold rounded-sm shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.03] uppercase text-[10px] tracking-wider cursor-pointer"
                      >
                        <Send size={12} />
                        Telegram Botga o'tish
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
                      Botda paydo bo'lgan <strong className="text-green-400">"📱 Telefon raqamni yuborish"</strong> tugmasini bosing.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-sm text-xs font-bold">
                      <Loader2 size={12} className="animate-spin" />
                      Telefon raqami kutilmoqda...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Success checkmark view with beautiful drawing green path checkmark animation */
              <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-green-500/10 rounded-full"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 border border-green-400"
                  >
                    <motion.svg
                      viewBox="0 0 24 24"
                      className="w-8 h-8 text-white fill-none stroke-current"
                      strokeWidth={3}
                      initial={{ strokeDasharray: 100, strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  </motion.div>
                </div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-black text-white uppercase tracking-wider mb-2"
                >
                  Muvaffaqiyatli!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xs text-green-400 font-bold max-w-sm leading-relaxed"
                >
                  Siz saytga muvaffaqiyatli kirdingiz! 🎉
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-[10px] text-white/30 mt-6 animate-pulse"
                >
                  Bosh sahifaga yo'naltirilmoqda...
                </motion.p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
