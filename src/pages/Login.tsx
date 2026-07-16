import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
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
          uid: user.uid 
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
            <LogIn className="w-8 h-8 text-[#ff006a]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Welcome Back</h1>
          <p className="text-white/50 text-sm">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold p-3 rounded-sm mb-6 text-center">
            {error}
          </div>
        )}

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
                className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-white/50 uppercase">Password</label>
              <a href="#" className="text-xs font-bold text-[#ff006a] hover:text-[#d40058] transition-colors">Forgot password?</a>
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
                className="w-full bg-[#000] border border-[#222] rounded-sm pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#ff006a] hover:bg-[#d40058] text-white font-bold py-3 px-4 rounded-sm transition-colors mt-6"
          >
            Sign In
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
            className="w-full bg-white text-black hover:bg-gray-100 font-bold py-3 px-4 rounded-sm transition-colors mt-6 flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google bilan kirish
          </button>
        </div>

        <div className="mt-8 text-center text-xs font-bold text-white/50">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#ff006a] hover:text-[#d40058] transition-colors uppercase tracking-wide">
            Create one
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
