import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle, ArrowLeft, Headphones, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Aloqa() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xatolik yuz berdi');
      }
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      console.error('Contact form submit error:', err);
      setError(err.message || 'Murojaatni yuborishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-white/90">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Bosh sahifaga qaytish
      </Link>

      <div className="bg-[#111] border border-[#222] p-6 sm:p-8 rounded-lg shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-[#ff006a]">
          <Headphones size={160} />
        </div>
        <div className="flex items-center gap-3 text-[#ff006a] text-sm font-bold uppercase tracking-wider mb-2">
          <MessageSquare size={18} /> Qayta Aloqa Va Qo'llab-Quvvatlash
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">Aloqa va Qo'llab-Quvvatlash</h1>
        <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Savollaringiz, takliflaringiz yoki texnik muammolar bo'yicha biz bilan bog'laning. Biz har bir murojaatni diqqat bilan ko'rib chiqamiz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Cards */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-[#111] border border-[#222] p-5 rounded-lg space-y-3">
            <div className="w-10 h-10 rounded bg-[#ff006a]/10 border border-[#ff006a]/30 flex items-center justify-center text-[#ff006a]">
              <Mail size={20} />
            </div>
            <h3 className="font-bold text-white text-base">Elektron Pochta</h3>
            <p className="text-xs text-white/50">Murojaat va takliflar uchun rasmiy pochtamiz:</p>
            <a href="mailto:admin@animem.uz" className="text-xs text-[#ff006a] font-bold block hover:underline">
              admin@animem.uz
            </a>
            <a href="mailto:support@animem.uz" className="text-xs text-white/60 font-bold block hover:underline">
              support@animem.uz
            </a>
          </div>

          <div className="bg-[#111] border border-[#222] p-5 rounded-lg space-y-3">
            <div className="w-10 h-10 rounded bg-[#0088cc]/10 border border-[#0088cc]/30 flex items-center justify-center text-[#0088cc]">
              <Send size={20} />
            </div>
            <h3 className="font-bold text-white text-base">Telegram Tarmoqlari</h3>
            <p className="text-xs text-white/50">Tezkor xabarlar va jonli qo'llab-quvvatlash:</p>
            <a href="https://t.me/animem_uz2" target="_blank" rel="noreferrer" className="text-xs text-[#0088cc] font-bold block hover:underline">
              @animem_uz2 (Kanal)
            </a>
            <a href="https://t.me/animem_support_bot" target="_blank" rel="noreferrer" className="text-xs text-white/60 font-bold block hover:underline">
              @animem_support_bot (Bot)
            </a>
          </div>

          <div className="bg-[#111] border border-[#222] p-5 rounded-lg space-y-3">
            <div className="w-10 h-10 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Globe size={20} />
            </div>
            <h3 className="font-bold text-white text-base">Rasmiy Domen</h3>
            <p className="text-xs text-white/50">Portali manzili:</p>
            <span className="text-xs text-purple-400 font-bold block">https://animem.uz</span>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="md:col-span-2 bg-[#111] border border-[#222] p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-[#ff006a]" size={18} /> Murojaat Yuborish
          </h2>

          {submitted ? (
            <div className="p-6 bg-[#ff006a]/10 border border-[#ff006a]/40 rounded-lg text-center space-y-3">
              <CheckCircle className="mx-auto text-[#ff006a]" size={48} />
              <h3 className="font-bold text-white text-lg">Murojaatingiz qabul qilindi!</h3>
              <p className="text-xs text-white/70">
                Xabaringiz uchun tashakkur. Tez orada ma'muriyatimiz ko'rib chiqadi.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 bg-[#ff006a] text-white font-bold text-xs rounded hover:bg-[#ff006a]/80 transition-colors"
              >
                Yangi xabar yuborish
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Ismingiz</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  className="w-full bg-black/60 border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff006a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Elektron pochtangiz (Email)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masalan: foydalanuvchi@gmail.com"
                  className="w-full bg-black/60 border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff006a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Xabaringiz / Taklifingiz</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Xabaringiz mazmunini yozing..."
                  className="w-full bg-black/60 border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff006a]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#ff006a] hover:bg-[#e0005d] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Yuborilmoqda...' : (
                  <>
                    <Send size={14} /> Xabarni Yuborish
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
