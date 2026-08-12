import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Phone, User, X, Loader2, Send, ArrowLeft, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, googleProvider, facebookAuth, facebookProvider } from '../lib/firebase';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [forgotMethod, setForgotMethod] = useState<'email' | 'phone'>('email');
  const [resetPhone, setResetPhone] = useState('');
  const [firebaseUid, setFirebaseUid] = useState('');

  // Forgot password flow states
  const [viewMode, setViewMode] = useState<'login' | 'forgot_email' | 'forgot_code' | 'forgot_password'>('login');
  
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Check for Google Auth redirect result
  useEffect(() => {
    let isMounted = true;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result || !isMounted) return;
        const user = result.user;
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
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
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error("Redirect auth error:", err);
        if (err.code === 'auth/unauthorized-domain') {
          setError(
            `Google tizimiga kirish xatosi (unauthorized domain): Ushbu domen Firebase ruxsat etilgan domenlar ro'yxatida yo'q.`
          );
        } else if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Google orqali kirishda xatolik');
        }
      });

    return () => { isMounted = false; };
  }, [login, navigate]);

  // Telegram Login States
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramSessionId, setTelegramSessionId] = useState('');
  const [telegramStatus, setTelegramStatus] = useState<'pending' | 'pending_phone' | 'authorized' | 'expired' | ''>('');
  const [telegramProgress, setTelegramProgress] = useState(1);

  // Listen for OAuth popup callbacks
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'YANDEX_AUTH_SUCCESS' || event.data?.type === 'DISCORD_AUTH_SUCCESS') {
        const { token: userToken, user: authUser } = event.data;
        if (userToken && authUser) {
          login(userToken, authUser);
          navigate('/');
        }
      } else if (event.data?.type === 'YANDEX_AUTH_ERROR') {
        setError(event.data.error || 'Yandex avtorizatsiyasida xatolik yuz berdi');
      } else if (event.data?.type === 'DISCORD_AUTH_ERROR') {
        setError(event.data.error || 'Discord avtorizatsiyasida xatolik yuz berdi');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [login, navigate]);

  const handleYandexLoginStart = async () => {
    try {
      setError('');
      const res = await fetch('/api/auth/yandex/url');
      const data = await res.json();

      if (data.url) {
        const authWindow = window.open(
          data.url,
          'yandex_oauth_popup',
          'width=600,height=700,top=100,left=100'
        );

        if (!authWindow) {
          window.location.href = data.url;
        }
      } else {
        throw new Error('Yandex avtorizatsiya havolasini olib bo\'lmadi');
      }
    } catch (err: any) {
      setError(err.message || 'Yandex orqali kirishda xatolik');
    }
  };

  const handleDiscordLoginStart = async () => {
    try {
      setError('');
      const res = await fetch('/api/auth/discord/url');
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Discord avtorizatsiya havolasi olinmadi');

      const authWindow = window.open(data.url, 'discord_oauth_popup', 'width=600,height=700,top=100,left=100');
      if (!authWindow) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Discord orqali kirishda xatolik');
    }
  };

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
  }, [telegramSessionId, showTelegramModal, telegramStatus, login, navigate]);

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
        throw new Error('Telegram seansini yaratib bo\'mladi');
      }
    } catch (err: any) {
      setError(err.message || 'Telegram orqali kirishni boshlashda xatolik');
    }
  };

  const formatPhone = (input: string) => {
    let digits = input.replace(/\D/g, '');
    if (!digits.startsWith('998') && digits.length <= 9) {
      digits = '998' + digits;
    }
    return '+' + digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMethod === 'email') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Email yoki parol xato!');
        }

        login(data.token, data.user);
        navigate('/');
      } else {
        // Phone login
        const formatted = formatPhone(phone);
        const res = await fetch('/api/auth/phone-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formatted, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Telefon raqam yoki parol xato!');
        }

        login(data.token, data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);

      if (!result || !result.user) {
        throw new Error('Google foydalanuvchi ma\'lumotlari olinmadi');
      }

      const user = result.user;
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || 'Google User',
          uid: user.uid,
          avatar_url: user.photoURL,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      console.error('Google login popup error:', err);
      setError(err.message || 'Google orqali kirishda xatolik');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setError('');
      const result = await signInWithPopup(facebookAuth, facebookProvider);

      if (!result || !result.user) {
        throw new Error('Facebook foydalanuvchi ma\'lumotlari olinmadi');
      }

      const user = result.user;
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${API_BASE}/api/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || 'Facebook User',
          uid: user.uid,
          avatar_url: user.photoURL,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Facebook login failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      console.error('Facebook login popup error:', err);
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError('Bu email bilan boshqa usulda ro\'yxatdan o\'tilgan. Google yoki email orqali kiring.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Facebook orqali kirishda xatolik');
      }
    }
  };

  // --- FORGOT PASSWORD HANDLERS ---
  const handleForgotSendEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccessMsg('');

    if (!resetEmail || !resetEmail.includes('@')) {
      setError('Iltimos, yaroqli email manzilini kiriting!');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password-send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kodni yuborishda xatolik');
      }

      setResetSuccessMsg(data.message || 'Parolni tiklash kodi emailga yuborildi!');
      setViewMode('forgot_code');
    } catch (err: any) {
      setError(err.message || 'Kodni yuborishda xatolik');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccessMsg('');

    const formatted = formatPhone(resetPhone);
    if (formatted.length < 12) {
      setError('Iltimos, to\'g\'ri telefon raqamini kiriting! (masalan: 901234567)');
      return;
    }

    setForgotLoading(true);
    try {
      // Try Firebase Recaptcha & Phone Auth
      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'login-recaptcha-container', {
            size: 'invisible',
            callback: () => {},
          });
        }
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, formatted, appVerifier);
        window.confirmationResult = confirmationResult;
      } catch (fbErr: any) {
        console.warn("Firebase Phone Auth attempt:", fbErr?.message || fbErr);
      }

      const res = await fetch('/api/auth/phone-send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted, type: 'forgot' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'SMS kod yuborishda xatolik');
      }

      if (data.devCode) {
        setResetCode(data.devCode);
      }

      setResetSuccessMsg(data.message || `SMS tasdiqlash kodi ${formatted} raqamiga yuborildi!`);
      setViewMode('forgot_code');
    } catch (err: any) {
      setError(err.message || 'SMS kod yuborishda xatolik');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetCode || resetCode.trim().length !== 6) {
      setError('Iltimos, 6 xonali tasdiqlash kodini kiriting!');
      return;
    }

    setForgotLoading(true);
    try {
      if (forgotMethod === 'phone') {
        const formatted = formatPhone(resetPhone);

        if (window.confirmationResult) {
          try {
            const result = await window.confirmationResult.confirm(resetCode);
            if (result && result.user) {
              setFirebaseUid(result.user.uid);
            }
          } catch (fbErr: any) {
            console.warn("Firebase confirm error:", fbErr?.message);
          }
        }

        const res = await fetch('/api/auth/phone-verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formatted, code: resetCode, type: 'forgot' }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Kodni tekshirishda xatolik');
        }
      } else {
        const res = await fetch('/api/auth/forgot-password-verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, code: resetCode }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Kodni tekshirishda xatolik');
        }
      }

      setResetSuccessMsg("Tasdiqlash kodi to'g'ri! Endi yangi parolingizni kiriting.");
      setViewMode('forgot_password');
    } catch (err: any) {
      setError(err.message || 'Tasdiqlash kodi xato');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak!");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Kiritilgan parollar bir-biriga mos kelmadi!");
      return;
    }

    setForgotLoading(true);
    try {
      if (forgotMethod === 'phone') {
        const formatted = formatPhone(resetPhone);
        const res = await fetch('/api/auth/phone-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formatted,
            code: resetCode,
            newPassword,
            firebaseUid
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Parolni tiklashda xatolik');
        }

        login(data.token, data.user);
        navigate('/');
      } else {
        const res = await fetch('/api/auth/forgot-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Parolni tiklashda xatolik');
        }

        login(data.token, data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Parolni tiklashda xatolik');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div id="login-recaptcha-container"></div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#111] border border-[#222] rounded-md p-6 sm:p-8 shadow-2xl relative"
      >
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <img 
              src="https://s3.devspace.uz/tirikchilik/local/avatar/14265509_206448_avatar.jpeg" 
              alt="Animem.uz Logo" 
              className="w-16 h-16 rounded-full object-cover border-2 border-[#ff006a] shadow-[0_0_20px_rgba(255,0,106,0.5)]"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            {viewMode === 'login' && 'Tizimga kirish'}
            {viewMode === 'forgot_email' && 'Email orqali tiklash'}
            {viewMode === 'forgot_code' && 'Tasdiqlash kodi'}
            {viewMode === 'forgot_password' && 'Yangi parol'}
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            {viewMode === 'login' && 'Animem.uz akkauntingizga kiring'}
            {viewMode === 'forgot_email' && 'Akkuntingizga ulangan emailni kiriting'}
            {viewMode === 'forgot_code' && 'Yuborilgan 6 xonali tasdiqlash kodini kiriting'}
            {viewMode === 'forgot_password' && "Akkauntingiz uchun yangi xavfsiz parol o'rnating"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-sm mb-5 text-center leading-relaxed">
            {error}
          </div>
        )}

        {resetSuccessMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold p-3 rounded-sm mb-5 text-center leading-relaxed">
            {resetSuccessMsg}
          </div>
        )}

        {/* ------------------- NORMAL LOGIN FORM ------------------- */}
        {viewMode === 'login' && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-white/50 uppercase">Parol</label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot_email');
                      setError('');
                      setResetSuccessMsg('');
                    }}
                    className="text-xs font-bold text-[#ff006a] hover:text-[#d40058] transition-colors cursor-pointer"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff006a] hover:bg-[#d40058] disabled:bg-[#ff006a]/50 text-white font-bold py-3 px-4 rounded-sm transition-colors mt-6 uppercase text-xs tracking-wider cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Kirilmoqda...
                  </>
                ) : (
                  'Kirish'
                )}
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
                type="button"
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
                onClick={handleFacebookLogin}
                className="w-full bg-[#1877F2] hover:bg-[#145fc4] text-white font-bold py-3 px-4 rounded-sm transition-colors mt-3 flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.313 0 2.686.235 2.686.235v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
                Facebook bilan kirish
              </button>

              <button
                type="button"
                onClick={handleDiscordLoginStart}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-4 rounded-sm transition-colors mt-3 flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                  <path d="M20.32 4.37A19.8 19.8 0 0015.55 3l-.6 1.22a18.27 18.27 0 00-5.9 0L8.45 3a19.7 19.7 0 00-4.77 1.37C.66 8.9-.16 13.3.25 17.63A19.9 19.9 0 006.1 20.6l1.42-1.95a12.2 12.2 0 01-2.24-1.08l.54-.42c4.32 2 9 2 13.27 0l.54.42c-.72.43-1.47.79-2.24 1.08l1.42 1.95a19.8 19.8 0 005.85-2.97c.48-5.02-.82-9.38-3.34-13.26zM8.4 15.02c-1.15 0-2.1-1.05-2.1-2.34s.92-2.34 2.1-2.34c1.19 0 2.12 1.06 2.1 2.34.01 1.29-.91 2.34-2.1 2.34zm7.2 0c-1.15 0-2.1-1.05-2.1-2.34s.92-2.34 2.1-2.34c1.19 0 2.12 1.06 2.1 2.34.01 1.29-.91 2.34-2.1 2.34z" />
                </svg>
                Discord bilan kirish
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

              <button
                type="button"
                onClick={handleYandexLoginStart}
                className="w-full bg-[#FC3F1D] hover:bg-[#e03415] text-white font-bold py-3 px-4 rounded-sm transition-colors mt-3 flex items-center justify-center gap-3 cursor-pointer shadow-md"
              >
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrvMGpJrPT4DJ5TfWDgVIIdqcYH3dJpqWJ_HBpvpHw8Q&s=10"
                    alt="Yandex"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                Yandex bilan kirish
              </button>
            </div>

            <div className="mt-8 text-center text-xs font-bold text-white/50">
              Akkuntingiz yo'qmi?{' '}
              <Link to="/register" className="text-[#ff006a] hover:text-[#d40058] transition-colors uppercase tracking-wide">
                Ro'yxatdan o'ting
              </Link>
            </div>
          </>
        )}

        {/* ---------------- FORGOT PASSWORD EMAIL STEP ---------------- */}
        {viewMode === 'forgot_email' && (
          <div>
            <button
              onClick={() => {
                setViewMode('login');
                setError('');
              }}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Kirish sahifasiga qaytish
            </button>

            <form onSubmit={handleForgotSendEmailCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase">
                  Email manzilingiz
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-[#000] border border-[#333] rounded-sm pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a] transition-colors text-sm"
                    placeholder="email@example.com"
                  />
                </div>
                <p className="text-[11px] text-white/40 mt-1.5">
                  Ushbu emailga 6 xonali parolni tiklash kodi yuboriladi.
                </p>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-[#ff006a] hover:bg-[#d40058] disabled:bg-[#ff006a]/50 text-white font-bold py-3 px-4 rounded-sm transition-colors mt-2 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#ff006a]/20 text-xs uppercase tracking-wider"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Kod yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Kod yuborish
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ---------------- FORGOT PASSWORD STEP 2: ENTER CODE ---------------- */}
        {viewMode === 'forgot_code' && (
          <div>
            <button
              onClick={() => {
                setViewMode('forgot_email');
                setError('');
                setResetSuccessMsg('');
              }}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Qaytash ({resetEmail})
            </button>

            <form onSubmit={handleForgotVerifyCode} className="space-y-4">
              <div>
                <div className="text-center mb-4 p-3 bg-white/5 border border-white/10 rounded-sm">
                  <p className="text-xs text-white/70">
                    <strong className="text-white">{resetEmail}</strong> manziliga 6 xonali tiklash kodi yuborildi.
                  </p>
                  <p className="text-[11px] text-white/40 mt-1">
                    Pochtani (va Spam papkasini) tekshiring
                  </p>
                </div>

                <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase text-center">
                  6 xonali tiklash kodi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-[#ff006a]" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#000] border border-[#333] rounded-sm pl-10 pr-4 py-3 text-center text-xl font-black text-[#ff006a] tracking-[10px] placeholder-white/20 focus:outline-none focus:border-[#ff006a] transition-colors"
                    placeholder="123456"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-[#ff006a] hover:bg-[#d40058] text-white font-bold py-3 px-4 rounded-sm transition-colors mt-2 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Kodni tekshirish...
                  </>
                ) : (
                  'Kodni tasdiqlash'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ---------------- FORGOT PASSWORD STEP 3: NEW PASSWORD ---------------- */}
        {viewMode === 'forgot_password' && (
          <div>
            <form onSubmit={handleForgotResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase">
                  Yangi parol
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#000] border border-[#333] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a] transition-colors text-sm"
                    placeholder="Kamida 6 ta belgi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5 uppercase">
                  Yangi parolni takrorlang
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-[#000] border border-[#333] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a] transition-colors text-sm"
                    placeholder="Parolni qayta kiriting"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-[#ff006a] hover:bg-[#d40058] text-white font-bold py-3 px-4 rounded-sm transition-colors mt-4 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Parol yangilanmoqda...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Parolni saqlash va kirish
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>

      {/* Telegram Verification Modal Overlay */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-lg overflow-hidden shadow-2xl relative"
          >
            <button
              onClick={() => setShowTelegramModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            {telegramProgress < 3 ? (
              <div className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#0088cc]/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#0088cc]/20">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0088cc] fill-current">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.34.52-.41-.01-1.21-.23-1.8-.42-.73-.24-1.32-.37-1.27-.78.02-.21.31-.43.87-.67 3.42-1.49 5.71-2.48 6.86-2.96 3.27-1.37 3.95-1.61 4.4-.1.01.03.02.05.02.08.01.12.01.25-.01.37z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Telegram orqali kirish</h2>
                  <p className="text-white/40 text-xs mt-1">Xavfsiz va tezkor avtorizatsiya tizimi</p>
                </div>

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

                {telegramProgress === 1 ? (
                  <div className="space-y-4 text-center">
                    <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
                      Quyidagi tugmani bosing va Telegram botimizni ochib, pastda <strong className="text-[#0088cc]">"START"</strong> (Boshlash) tugmasini bosing:
                    </p>
                    <div className="py-2">
                      <a
                        href={`https://t.me/Animem_register_bot?start=${telegramSessionId}`}
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
