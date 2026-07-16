import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';
import { motion } from 'motion/react';

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
