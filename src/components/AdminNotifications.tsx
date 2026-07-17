import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Send } from 'lucide-react';

export default function AdminNotifications() {
  const { token } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setStatus({ type: '', text: '' });
    
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: message.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Yuborishda xatolik yuz berdi');
      }

      setMessage('');
      setStatus({ type: 'success', text: "Bildirishnoma muvaffaqiyatli yuborildi!" });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      setStatus({ type: 'error', text: error.message || "Xatolik yuz berdi" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-sm p-5 sm:p-8 space-y-6">
      <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center">
        <Bell className="w-4 h-4 text-[#ff006a] mr-2" /> Bildirishnomalar yuborish (MySQL)
      </h2>
      
      {status.text && (
        <div className={`p-4 rounded-sm text-xs font-bold ${
          status.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'
        }`}>
          {status.text}
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Habar matnini yozing..."
        className="w-full bg-[#000] border border-[#222] rounded-sm p-4 text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 min-h-[120px]"
      />
      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-[#ff006a] hover:bg-[#d40058] text-white font-bold py-2.5 px-6 rounded-sm transition-colors flex items-center"
      >
        <Send size={16} className="mr-2" />
        {loading ? 'Yuborilmoqda...' : 'Yuborish'}
      </button>
    </div>
  );
}
