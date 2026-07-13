import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, X, Send, Maximize2, Minimize2, Trash2, CornerUpLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

export default function ChatWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to the socket when ChatWidget is open
  useEffect(() => {
    if (isOpen) {
      socketRef.current = io();

      socketRef.current.on('previousMessages', (msgs: Message[]) => {
        setMessages(msgs);
        scrollToBottom();
      });

      socketRef.current.on('newMessage', (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      });

      socketRef.current.on('chatCleared', () => {
        setMessages([]);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;
    
    socketRef.current?.emit('sendMessage', {
      user_id: user.id,
      user_name: user.name,
      content: inputValue,
      reply_to_id: replyingTo?.id || null,
      reply_to_name: replyingTo?.user_name || null,
      reply_to_content: replyingTo?.content || null,
    });
    setInputValue('');
    setReplyingTo(null);
  };

  const handleClearChat = async () => {
    if (!token) return;
    if (window.confirm("Haqiqatan ham barcha xabarlarni o'chirmoqchimisiz?")) {
      try {
        const res = await fetch('/api/chat/clear', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          setMessages([]);
        }
      } catch (e) {
        console.error("Failed to clear chat", e);
      }
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-4 bg-gradient-to-r from-[#ff0055] to-[#ff006a] hover:opacity-90 text-white rounded-full shadow-2xl transition-transform hover:scale-110 z-50 flex items-center justify-center shadow-[#ff006a]/20"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[#09090b]/98 backdrop-blur-md border border-[#1a1a1a] rounded-sm shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded ? 'w-[800px] h-[80vh]' : 'w-[calc(100vw-32px)] sm:w-[380px] h-[550px] max-h-[calc(100vh-100px)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[#1a1a1a] bg-[#0c0c0e]">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-[#1a1a1a] rounded text-white/50 hover:text-white transition-colors"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                {user?.role === 'admin' && (
                  <button 
                    onClick={handleClearChat}
                    className="p-1.5 hover:bg-red-950/20 text-red-500/80 hover:text-red-400 rounded transition-colors"
                    title="Tozalash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <Sparkles size={14} className="text-[#ff006a]" />
                <h3 className="font-black text-[#ff006a] tracking-widest text-xs uppercase">CHAT</h3>
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-[#1a1a1a] rounded text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#030303]/40">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-white/30 text-xs">
                  Suhbatni boshlang...
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className="flex flex-col space-y-1 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 rounded-full bg-[#1c1c1e] border border-[#ff006a]/20 flex items-center justify-center text-[10px] text-[#ff006a] font-bold uppercase">
                            {msg.user_name.charAt(0)}
                          </div>
                          <span className={`font-bold text-xs ${isMe ? 'text-[#ff006a]' : 'text-[#4fd1c5]'}`}>{msg.user_name}</span>
                          <span className="text-white/30 text-[9px]">
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </span>
                        </div>

                        {user && (
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-[#ff006a] transition-all p-0.5 rounded"
                            title="Javob berish"
                          >
                            <CornerUpLeft size={12} />
                          </button>
                        )}
                      </div>
                      
                      <div className="pl-7">
                        <div className={`px-3 py-2 text-white/90 text-xs inline-block leading-relaxed max-w-[90%] shadow rounded-sm border ${
                          isMe 
                            ? 'bg-[#111113] border-[#ff006a]/20 text-white rounded-tr-none' 
                            : 'bg-[#161619] border-white/5 text-white/90 rounded-tl-none'
                        }`}>
                          {msg.reply_to_id && (
                            <div className="mb-1.5 text-[10px] bg-black/40 border-l-2 border-[#ff006a] p-1.5 rounded-sm text-left opacity-80">
                              <span className="font-bold text-[#ff006a] text-[8px]">@{msg.reply_to_name}</span>
                              <p className="text-white/60 text-[9px] truncate max-w-[180px]">{msg.reply_to_content}</p>
                            </div>
                          )}
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Replying Preview */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-1.5 bg-[#0c0c0e] border-t border-[#1a1a1a] flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center space-x-2 border-l-2 border-[#ff006a] pl-2">
                    <CornerUpLeft size={10} className="text-[#ff006a]" />
                    <div className="truncate">
                      <span className="font-bold text-[#ff006a]">@{replyingTo.user_name}</span>
                      <span className="text-white/50 ml-2 truncate max-w-[150px] inline-block align-middle">{replyingTo.content}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-white/40 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Input Area */}
            <div className="p-3 border-t border-[#1a1a1a] bg-[#0c0c0e]">
              {user ? (
                <form onSubmit={handleSend} className="relative flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={replyingTo ? "Javob yozing..." : "Fikringizni yozing..."}
                    className="flex-1 bg-[#030303] border border-[#1a1a1a] rounded-sm pl-3 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]/50 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="p-2 text-white bg-[#ff006a] hover:bg-[#d40058] disabled:opacity-30 rounded-sm transition-all flex items-center justify-center shadow shadow-[#ff006a]/10"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="text-center py-2 text-xs text-white/50 font-bold">
                  Suhbatda qatnashish uchun <a href="/login" className="text-[#ff006a] hover:underline">Tizimga kiring</a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
