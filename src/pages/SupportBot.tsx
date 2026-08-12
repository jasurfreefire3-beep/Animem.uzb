import React, { useState, useEffect, useRef } from 'react';
import { Send, CornerUpLeft, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

type BotMessage = {
  role: 'user' | 'model';
  content: string;
};

export default function SupportBot() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<BotMessage[]>([
    { role: 'model', content: "Salom! Nima kerakligini aytsangiz, men yordam berishga harakat qilaman." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || cooldown > 0 || loading) return;

    const userMsg = input.trim();
    setInput('');
    setCooldown(15);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/support-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
          userName: user?.name || "Mehmon"
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', content: `Xatolik: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-mono flex flex-col relative overflow-hidden font-sans">
      {/* Background styling for visual novel effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at center, #ff006a 0%, transparent 60%)',
      }}></div>
      
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }}></div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-end pb-12 z-10 w-full max-w-4xl mx-auto px-4">
        
        {/* Character Sprite */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-4 w-full max-w-[350px] md:max-w-[450px] aspect-square flex items-end justify-center drop-shadow-[0_0_30px_rgba(255,0,106,0.3)]"
        >
          <img 
            src="/sumire_support_bot.jpg" 
            alt="Sumire" 
            onError={(e) => {
              // Fallback in case the image doesn't exist on their static hosting
              e.currentTarget.src = "https://api.dicebear.com/7.x/lorelei/svg?seed=Sumire&backgroundColor=ff006a";
            }}
            className="object-contain h-[110%] mask-image-bottom-fade"
            style={{ WebkitMaskImage: 'linear-gradient(to top, transparent 5%, black 40%)' }}
          />
        </motion.div>

        {/* Visual Novel Dialogue Box */}
        <div className="w-full">
          {/* Current Message */}
          <div className="bg-[#0f0f15]/90 backdrop-blur-md border border-[#ff006a]/40 p-6 shadow-[0_0_20px_rgba(255,0,106,0.15)] relative min-h-[140px] flex flex-col justify-between">
            {/* Name Tag */}
            <div className="absolute -top-4 left-4 bg-[#ff006a] text-white px-4 py-1 text-sm font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(255,0,106,0.5)]">
              {messages[messages.length - 1]?.role === 'model' ? 'SUMIRE' : (user?.name || 'Siz')}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={messages.length}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-lg md:text-xl text-white/90 leading-relaxed font-mono"
              >
                {loading && messages[messages.length - 1]?.role === 'user' 
                  ? <span className="animate-pulse text-[#ff006a]">Sumire o'ylamoqda...</span> 
                  : messages[messages.length - 1]?.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="mt-4 flex gap-4">
            <div className="flex-1 bg-[#0f0f15]/90 backdrop-blur-md border border-[#ff006a]/30 p-1 flex items-center shadow-[0_0_15px_rgba(255,0,106,0.1)]">
              <span className="text-[#ff006a] pl-4 font-bold">{'>'}</span>
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={cooldown > 0 || loading}
                placeholder={cooldown > 0 ? `Kuting (${cooldown}s)...` : "Xabarni kiriting..."}
                className="w-full bg-transparent border-none outline-none text-white px-4 py-3 font-mono placeholder:text-white/20 disabled:opacity-50"
              />
            </div>
            <button 
              type="submit"
              disabled={cooldown > 0 || loading || !input.trim()}
              className="bg-[#ff006a] hover:bg-[#d40058] disabled:bg-[#ff006a]/30 disabled:cursor-not-allowed text-white px-8 py-4 font-bold tracking-widest uppercase transition-colors shadow-[0_0_15px_rgba(255,0,106,0.3)]"
            >
              Yuborish
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}