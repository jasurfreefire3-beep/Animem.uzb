import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types';
import { io, Socket } from 'socket.io-client';
import { Send, Users, Sparkles, Trash2, CornerUpLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Chat() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [activeMsgId, setActiveMsgId] = useState<string | number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Connect to the socket server
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on('previousMessages', (prevMsgs: Message[]) => {
      setMessages(prevMsgs);
      scrollToBottom();
    });

    socket.on('newMessage', (newMsg: Message) => {
      setMessages((prev) => {
        if (prev.some(m => String(m.id) === String(newMsg.id))) return prev;
        return [...prev, newMsg];
      });
      scrollToBottom();
    });

    socket.on('messageDeleted', (deletedId: any) => {
      setMessages((prev) => prev.filter(msg => String(msg.id) !== String(deletedId)));
    });

    socket.on('chatCleared', () => {
      setMessages([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !socketRef.current) return;

    try {
      const payload = {
        user_id: user.id,
        user_name: user.name,
        content: input,
        reply_to_id: replyingTo ? String(replyingTo.id) : null,
        reply_to_name: replyingTo ? replyingTo.user_name : null,
        reply_to_content: replyingTo ? replyingTo.content : null
      };
      
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error("Failed to send message via API");
      }
      
      setInput('');
      setReplyingTo(null);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("Haqiqatan ham barcha xabarlarni o'chirmoqchimisiz? (Bu chatni butunlay tozalaydi)")) {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${API_BASE}/api/chat/clear`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error("Chatni tozalashda xatolik yuz berdi");
        }
      } catch (e) {
        console.error("Failed to clear chat", e);
      }
    }
  };

  const handleDeleteMessage = async (msgId: string | number) => {
    if (window.confirm("Ushbu xabarni o'chirmoqchimisiz?")) {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${API_BASE}/api/chat/messages/${msgId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error("Xabarni o'chirishda xatolik yuz berdi");
        }
      } catch (e) {
        console.error("Failed to delete message", e);
      }
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 bg-[#ff006a]/10 rounded-full flex items-center justify-center mb-4">
          <Users className="w-10 h-10 text-[#ff006a]" />
        </div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Global Anime Chat</h2>
        <p className="text-white/50 max-w-md text-sm">Join the conversation with thousands of anime fans. Please login to access the chat room.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-[#09090b] shadow-2xl border border-[#1a1a1a] rounded-sm h-[80vh] flex flex-col text-white">
      {/* Header */}
      <div className="bg-[#0c0c0e] p-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#ff006a]/10 rounded-sm flex items-center justify-center border border-[#ff006a]/20">
            <Sparkles className="w-5 h-5 text-[#ff006a]" />
          </div>
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wider text-white">Global Otaku Lounge</h2>
            <p className="text-[10px] text-white/50">Xabarlar bazada xavfsiz saqlanadi</p>
          </div>
        </div>

        {/* Clear Chat for Admins */}
        {user.role === 'admin' && (
          <button
            onClick={handleClearChat}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-950/20 text-red-400 hover:bg-red-900/30 rounded-sm text-xs font-bold transition-all border border-red-500/20"
            title="Chatni Tozalash"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Tozalash</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#030303]/50">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-white/30 text-xs">
            Hali xabarlar yo'q. Birinchi bo'lib yozing!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.user_id === user.id;
            const avatarSrc = msg.user_avatar || msg.avatar_url;
            const isActive = activeMsgId === msg.id;

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id || i}
                onClick={() => setActiveMsgId(isActive ? null : msg.id)}
                className={`flex flex-col group cursor-pointer ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-start gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Link to={`/user/${msg.user_id}`} onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
                    {avatarSrc ? (
                      <img loading="lazy" decoding="async" 
                        src={avatarSrc} 
                        alt={msg.user_name} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#ff006a]/30 hover:border-[#ff006a] transition-all shadow-md" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2a2a2e] to-[#151518] border-2 border-[#ff006a]/30 flex items-center justify-center text-xs text-[#ff006a] font-extrabold shadow-md hover:text-white transition-colors">
                        {msg.user_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <Link to={`/user/${msg.user_id}`} onClick={(e) => e.stopPropagation()} className={`text-xs font-bold hover:underline ${isMe ? 'text-[#ff006a]' : 'text-[#4fd1c5]'}`}>
                        {msg.user_name}
                      </Link>
                      <span className="text-[9px] text-white/30">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMe && (
                        <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}
                            className="p-1.5 text-white/50 hover:text-[#ff006a] hover:bg-white/10 rounded-full transition-all shrink-0 cursor-pointer"
                            title="Javob berish"
                          >
                            <CornerUpLeft size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                            className="p-1.5 text-white/50 hover:text-red-500 hover:bg-white/10 rounded-full transition-all shrink-0 cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}

                      <div
                        className={`px-4 py-2.5 text-[13px] leading-relaxed shadow relative ${
                          isMe
                            ? 'bg-[#111113] border border-[#ff006a]/30 text-white rounded-l-xl rounded-br-xl'
                            : 'bg-[#161619] border border-white/10 text-white/90 rounded-r-xl rounded-bl-xl'
                        }`}
                      >
                        {msg.reply_to_id && (
                          <div className="mb-2 text-xs bg-black/40 border-l-2 border-[#ff006a] p-1.5 rounded-md text-left opacity-80">
                            <span className="font-bold text-[#ff006a] text-[9px]">@{msg.reply_to_name}</span>
                            <p className="text-white/60 text-[10px] truncate max-w-[240px] mt-0.5">{msg.reply_to_content}</p>
                          </div>
                        )}
                        {msg.content}
                      </div>

                      {!isMe && (
                        <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}
                            className="p-1.5 text-white/50 hover:text-[#ff006a] hover:bg-white/10 rounded-full transition-all shrink-0 cursor-pointer"
                            title="Javob berish"
                          >
                            <CornerUpLeft size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Replying Status Bar */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-[#0c0c0e] border-t border-[#1a1a1a] flex items-center justify-between text-xs"
          >
            <div className="flex items-center space-x-2 border-l-2 border-[#ff006a] pl-2.5">
              <CornerUpLeft size={12} className="text-[#ff006a]" />
              <div className="truncate">
                <span className="font-bold text-[#ff006a]">@{replyingTo.user_name}</span>
                <span className="text-white/50 ml-2 truncate block sm:inline max-w-[300px]">{replyingTo.content}</span>
              </div>
            </div>
            <button 
              onClick={() => setReplyingTo(null)}
              className="p-1 text-white/40 hover:text-white hover:bg-white/5 rounded"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-[#0c0c0e] border-t border-[#1a1a1a]">
        <div className="relative flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={replyingTo ? "Javob yozing..." : "Xabar yozing..."}
            className="flex-1 bg-[#030303] border border-[#1a1a1a] rounded-sm pl-4 pr-4 py-3 text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 bg-[#ff006a] hover:bg-[#d40058] disabled:opacity-30 disabled:hover:bg-[#ff006a] text-white rounded-sm font-bold shadow flex items-center justify-center transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
