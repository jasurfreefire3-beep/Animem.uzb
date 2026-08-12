import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  ShieldCheck,
  User,
  Send,
  Mail,
  Phone,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Crown
} from 'lucide-react';

interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  avatar_url?: string;
  telegram_id?: string;
  yandex_id?: string;
  discord_id?: string;
  facebook_id?: string;
  created_at: string;
  provider: 'telegram' | 'yandex' | 'discord' | 'facebook' | 'google' | 'phone' | 'email';
  provider_label: string;
}

interface AdminUsersProps {
  token: string;
}

export default function AdminUsers({ token }: AdminUsersProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'telegram' | 'google' | 'facebook' | 'yandex' | 'discord' | 'phone' | 'email' | 'admin'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Foydalanuvchilarni yuklashda xatolik');
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleDeleteUser = async (userId: number | string, name: string) => {
    if (!window.confirm(`Haqiqatan ham "${name}" foydalanuvchisini o'chirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "O'chirishda xatolik yuz berdi");
      }
      setMessage({ type: 'success', text: `"${name}" muvaffaqiyatli o'chirildi!` });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleRole = async (userId: number | string, currentRole: string, name: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`"${name}" ning rolini "${newRole.toUpperCase()}" ga o'zgartirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Rolni o'zgartirishda xatolik");
      }
      setMessage({ type: 'success', text: `"${name}" ning roli o'zgartirildi!` });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Stats calculation
  const totalCount = users.length;
  const telegramCount = users.filter(u => u.provider === 'telegram').length;
  const googleCount = users.filter(u => u.provider === 'google').length;
  const yandexCount = users.filter(u => u.provider === 'yandex').length;
  const discordCount = users.filter(u => u.provider === 'discord').length;
  const facebookCount = users.filter(u => u.provider === 'facebook').length;
  const phoneCount = users.filter(u => u.provider === 'phone').length;
  const emailCount = users.filter(u => u.provider === 'email').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  // Filtering users
  const filteredUsers = users.filter(u => {
    const matchSearch =
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      (u.telegram_id && u.telegram_id.includes(searchQuery)) ||
      (u.discord_id && u.discord_id.includes(searchQuery));

    if (!matchSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'admin') return u.role === 'admin';
    return u.provider === activeFilter;
  });

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'telegram':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#0088cc]/15 text-[#0088cc] border border-[#0088cc]/30">
            <Send size={12} className="shrink-0" />
            Telegram
          </span>
        );
      case 'google':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <Mail size={12} className="shrink-0" />
            Google Email
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#1877F2]/15 text-[#6ca8f7] border border-[#1877F2]/30">
            <span className="w-3 h-3 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px] font-black shrink-0">f</span>
            Facebook
          </span>
        );
      case 'yandex':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FC3F1D]/15 text-[#FC3F1D] border border-[#FC3F1D]/30">
            <span className="w-3 h-3 rounded-full bg-[#FC3F1D] text-white flex items-center justify-center text-[9px] font-black shrink-0">Я</span>
            Yandex ID
          </span>
        );
      case 'discord':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#5865F2]/15 text-[#8ea1ff] border border-[#5865F2]/30">
            <span className="w-3 h-3 rounded-sm bg-[#5865F2] text-white flex items-center justify-center text-[9px] font-black shrink-0">D</span>
            Discord
          </span>
        );
      case 'phone':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Phone size={12} className="shrink-0" />
            Telefon
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white/70 border border-white/20">
            <Mail size={12} className="shrink-0" />
            Email / Parol
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#ff006a] text-xs font-bold uppercase tracking-wider mb-1">
            <Users size={16} /> Foydalanuvchilar Boshqaruvi
          </div>
          <h2 className="text-xl font-black text-white">Barcha Ro'yxatdan O'tgan Foydalanuvchilar</h2>
          <p className="text-xs text-white/50 mt-1">
            Telegram, Discord, Google, Yandex va Email orqali kirgan barcha foydalanuvchilar statistikasi va ro'yxati.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="self-start md:self-auto bg-[#222] hover:bg-[#333] text-white text-xs font-bold px-4 py-2.5 rounded-sm flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-sm text-xs font-bold flex items-center justify-between ${
          message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-white/50 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <div className="bg-[#111] border border-[#222] p-4 rounded-sm">
          <div className="text-xs text-white/50 font-medium">Jami A'zolar</div>
          <div className="text-xl font-black text-white mt-1">{totalCount}</div>
        </div>

        <div className="bg-[#111] border border-[#0088cc]/30 p-4 rounded-sm">
          <div className="text-xs text-[#0088cc] font-medium flex items-center gap-1">
            <Send size={12} /> Telegram
          </div>
          <div className="text-xl font-black text-white mt-1">{telegramCount}</div>
        </div>

        <div className="bg-[#111] border border-red-500/30 p-4 rounded-sm">
          <div className="text-xs text-red-400 font-medium flex items-center gap-1">
            <Mail size={12} /> Google Email
          </div>
          <div className="text-xl font-black text-white mt-1">{googleCount}</div>
        </div>

        <div className="bg-[#111] border border-[#1877F2]/30 p-4 rounded-sm">
          <div className="text-xs text-[#6ca8f7] font-medium flex items-center gap-1">
            <span className="font-bold">f</span> Facebook
          </div>
          <div className="text-xl font-black text-white mt-1">{facebookCount}</div>
        </div>

        <div className="bg-[#111] border border-[#FC3F1D]/30 p-4 rounded-sm">
          <div className="text-xs text-[#FC3F1D] font-medium flex items-center gap-1">
            <span className="font-bold">Я</span> Yandex ID
          </div>
          <div className="text-xl font-black text-white mt-1">{yandexCount}</div>
        </div>

        <div className="bg-[#111] border border-[#5865F2]/30 p-4 rounded-sm">
          <div className="text-xs text-[#8ea1ff] font-medium flex items-center gap-1">
            <span className="font-bold">D</span> Discord
          </div>
          <div className="text-xl font-black text-white mt-1">{discordCount}</div>
        </div>

        <div className="bg-[#111] border border-purple-500/30 p-4 rounded-sm">
          <div className="text-xs text-purple-400 font-medium flex items-center gap-1">
            <Phone size={12} /> Telefon / SMS
          </div>
          <div className="text-xl font-black text-white mt-1">{phoneCount + emailCount}</div>
        </div>

        <div className="bg-[#111] border border-amber-500/30 p-4 rounded-sm">
          <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <Crown size={12} /> Adminlar
          </div>
          <div className="text-xl font-black text-amber-400 mt-1">{adminCount}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#111] border border-[#222] p-4 rounded-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-white/30" />
            <input
              type="text"
              placeholder="Ismi, email yoki telefon bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-[#333] rounded-sm pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#ff006a]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'all' ? 'bg-[#ff006a] text-white' : 'bg-[#222] text-white/60 hover:text-white'
              }`}
            >
              Barchasi ({totalCount})
            </button>
            <button
              onClick={() => setActiveFilter('telegram')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'telegram' ? 'bg-[#0088cc] text-white' : 'bg-[#222] text-white/60 hover:text-white'
              }`}
            >
              Telegram ({telegramCount})
            </button>
            <button
              onClick={() => setActiveFilter('google')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'google' ? 'bg-red-600 text-white' : 'bg-[#222] text-white/60 hover:text-white'
              }`}
            >
              Google ({googleCount})
            </button>
            <button
              onClick={() => setActiveFilter('facebook')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'facebook' ? 'bg-[#1877F2] text-white' : 'bg-[#222] text-white/60 hover:text-white'
              }`}
            >
              Facebook ({facebookCount})
            </button>
            <button
              onClick={() => setActiveFilter('yandex')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'yandex' ? 'bg-[#FC3F1D] text-white' : 'bg-[#222] text-white/60 hover:text-white'
              }`}
            >
              Yandex ({yandexCount})
            </button>
            <button
              onClick={() => setActiveFilter('discord')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'discord' ? 'bg-[#5865F2] text-white' : 'bg-[#222] text-white/60 hover:text-white'
              }`}
            >
              Discord ({discordCount})
            </button>
            <button
              onClick={() => setActiveFilter('admin')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'admin' ? 'bg-amber-500 text-black' : 'bg-[#222] text-white/60 hover:text-white'
              }`}
            >
              Adminlar ({adminCount})
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="py-12 text-center text-white/40 text-xs">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#ff006a]" />
            Foydalanuvchilar ro'yxati yuklanmoqda...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-white/40 text-xs border border-dashed border-[#333] rounded-sm">
            Foydalanuvchilar topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#222] text-white/40 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Foydalanuvchi</th>
                  <th className="py-3 px-3">Email / Telefon</th>
                  <th className="py-3 px-3">Kirish Usuli</th>
                  <th className="py-3 px-3">Rol</th>
                  <th className="py-3 px-3">Sana</th>
                  <th className="py-3 px-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#181818] transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#333] shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center font-bold text-white shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {u.role === 'admin' && (
                              <Crown size={12} className="text-amber-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-white/40">ID: #{u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email / Phone */}
                    <td className="py-3 px-3">
                      <div className="text-white/80 font-medium">
                        {u.email || u.phone || u.telegram_id ? (
                          u.email || u.phone || `TG ID: ${u.telegram_id}`
                        ) : (
                          <span className="text-white/30 italic">Ko'rsatilmagan</span>
                        )}
                      </div>
                    </td>

                    {/* Auth Method */}
                    <td className="py-3 px-3">
                      {getProviderBadge(u.provider)}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role, u.name)}
                        title="Rolni o'zgartirish uchun bosing"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-bold text-[11px] cursor-pointer transition-opacity hover:opacity-80 ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-white/5 text-white/60 border border-white/10'
                        }`}
                      >
                        {u.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                        {u.role.toUpperCase()}
                      </button>
                    </td>

                    {/* Reg Date */}
                    <td className="py-3 px-3 text-white/50 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('uz-UZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-sm transition-colors cursor-pointer"
                        title="Foydalanuvchini o'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
