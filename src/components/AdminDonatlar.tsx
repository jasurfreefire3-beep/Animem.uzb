import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, Trash2, RefreshCw, Check, DollarSign, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DonationItem {
  id: number | string;
  order_id: string;
  amount: number;
  donor_name: string;
  comment: string;
  payment_method: string;
  status: 'pending' | 'paid' | 'canceled';
  pay_url?: string;
  created_at: string;
  paid_at?: string;
}

export default function AdminDonatlar() {
  const { token } = useAuth();
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string>('');

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/donations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.donations)) {
          setDonations(data.donations);
        }
        if (typeof data.total_amount === 'number') {
          setTotalAmount(data.total_amount);
        }
      }
    } catch (err) {
      console.error("Fetch admin donations error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleUpdateStatus = async (order_id: string, status: 'paid' | 'pending' | 'canceled') => {
    setActionMsg('');
    try {
      const res = await fetch('/api/admin/donate/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_id, status })
      });

      if (res.ok) {
        setActionMsg(`Donat #${order_id} maqomi '${status}' ga yangilandi`);
        fetchDonations();
      } else {
        alert("Maqomni yangilashda xatolik.");
      }
    } catch (err) {
      alert("Server xatoligi");
    }
  };

  const handleDeleteDonation = async (id: number | string) => {
    if (!window.confirm("Rostdan ham ushbu donat yozuvini o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/admin/donate/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setActionMsg("Donat yozuvi o'chirildi");
        fetchDonations();
      }
    } catch (err) {
      alert("O'chirishda xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111113] border border-[#1a1a1c] p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="text-[#ff006a]" size={22} />
            <span>Tezcheck.uz Donat Boshqaruvi</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Sayt foydalanuvchilari tomonidan Click va Payme (Tezcheck) orqali yuborilgan donatlar
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#161619] border border-white/10 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] text-white/40 uppercase font-bold">Jami Yig'ilgan Summa</div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {totalAmount.toLocaleString('uz-UZ')} UZS
            </div>
          </div>
          <button
            onClick={fetchDonations}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            title="Yangilash"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          {actionMsg}
        </div>
      )}

      {/* Donations Table */}
      <div className="bg-[#111113] border border-[#1a1a1c] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-white/40">Yuklanmoqda...</div>
        ) : donations.length === 0 ? (
          <div className="p-8 text-center text-xs text-white/40">Donatlar mavjud emas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0c0e] border-b border-[#1a1a1c] text-white/40 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">ID / Order</th>
                  <th className="p-3.5">Homiysi</th>
                  <th className="p-3.5">Summa</th>
                  <th className="p-3.5">Izoh</th>
                  <th className="p-3.5">Tizim</th>
                  <th className="p-3.5">Maqom</th>
                  <th className="p-3.5">Sana</th>
                  <th className="p-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1c] text-white/80">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-[#161619] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#ff006a]">
                      #{d.order_id}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {d.donor_name}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">
                      {d.amount.toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className="p-3.5 max-w-xs truncate text-white/60">
                      {d.comment || '-'}
                    </td>
                    <td className="p-3.5 text-white/50">
                      {d.payment_method}
                    </td>
                    <td className="p-3.5">
                      {d.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          <CheckCircle size={10} /> To'langan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          <Clock size={10} /> Kutilmoqda
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-[10px] text-white/40 font-mono">
                      {new Date(d.created_at).toLocaleString('uz-UZ')}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {d.status !== 'paid' && (
                        <button
                          onClick={() => handleUpdateStatus(String(d.order_id), 'paid')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors"
                          title="To'landi deb belgilash"
                        >
                          To'landi
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDonation(d.id)}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 size={13} />
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
