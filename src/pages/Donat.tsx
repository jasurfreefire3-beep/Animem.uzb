import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  CreditCard, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  Award, 
  Zap, 
  ExternalLink, 
  Loader2, 
  Gift, 
  DollarSign, 
  Flame,
  User,
  MessageSquare,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000, 100000, 200000];

export default function Donat() {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  
  const [loadingInvoice, setLoadingInvoice] = useState<boolean>(false);
  const [activeInvoice, setActiveInvoice] = useState<DonationItem | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(2000000);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Auto fill user name if logged in
  useEffect(() => {
    if (user && user.name && !donorName) {
      setDonorName(user.name);
    }
  }, [user]);

  // Fetch donations list
  const fetchDonations = async () => {
    try {
      const res = await fetch('/api/donations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.donations)) {
          setDonations(data.donations);
        }
        if (typeof data.total_amount === 'number') {
          setTotalAmount(data.total_amount);
        }
        if (typeof data.monthly_goal === 'number') {
          setMonthlyGoal(data.monthly_goal);
        }
      }
    } catch (err) {
      console.error("Fetch donations error:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // Poll status when invoice modal is active
  useEffect(() => {
    if (!activeInvoice || activeInvoice.status === 'paid' || !showInvoiceModal) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/donate/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: activeInvoice.order_id })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'paid') {
            setActiveInvoice(prev => prev ? { ...prev, status: 'paid' } : null);
            fetchDonations();
          }
        }
      } catch (e) {
        // silent
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeInvoice, showInvoiceModal]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    if (val) {
      setSelectedAmount(Number(val));
    }
  };

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!finalAmount || finalAmount < 1000) {
      setErrorMsg("Eng kam donat miqdori 1,000 UZS bo'lishi kerak.");
      return;
    }

    setLoadingInvoice(true);
    try {
      const res = await fetch('/api/donate/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          donor_name: donorName.trim() || (user ? user.name : 'Saxiy otaku'),
          comment: comment.trim() || 'Animeuz platformasi va dublyajini qo\'llab-quvvatlash',
          payment_method: 'Click / Payme (Tezcheck)'
        })
      });

      const data = await res.json();
      if (res.ok && data.ok && data.donation) {
        setActiveInvoice(data.donation);
        setShowInvoiceModal(true);
        fetchDonations();

        // Open Tezcheck payment link automatically
        if (data.pay_url) {
          window.open(data.pay_url, '_blank');
        }
      } else {
        setErrorMsg(data.error || "To'lov invoysini yaratishda xatolik yuz berdi.");
      }
    } catch (err: any) {
      console.error("Create invoice error:", err);
      setErrorMsg("Server bilan bog'lanishda xatolik yuz berdi.");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleManualCheckStatus = async () => {
    if (!activeInvoice) return;
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/donate/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: activeInvoice.order_id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'paid') {
          setActiveInvoice(prev => prev ? { ...prev, status: 'paid' } : null);
          fetchDonations();
        } else {
          alert("To'lov hali amalga oshirilmadi yoki kutilmoqda.");
        }
      }
    } catch (err) {
      alert("Holatni tekshirishda xatolik yuz berdi.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyPayUrl = () => {
    if (activeInvoice?.pay_url) {
      navigator.clipboard.writeText(activeInvoice.pay_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Paid donations sorted for supporters table
  const paidDonations = donations.filter(d => d.status === 'paid');
  const topSupporters = [...paidDonations].sort((a, b) => b.amount - a.amount).slice(0, 5);

  const goalPercentage = Math.min(100, Math.round((totalAmount / monthlyGoal) * 100));

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#120818] via-[#1a0c24] to-[#0d0914] border border-[#ff006a]/20 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff006a]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff006a]/10 border border-[#ff006a]/30 text-[#ff006a] text-xs font-bold uppercase tracking-wider mb-4">
            <Heart size={14} className="fill-[#ff006a] animate-pulse" />
            <span>Loyiha Rivoji uchun Donat</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight mb-3">
            Animeuz Platformasiga Bag'ishlangan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff006a] via-purple-400 to-[#0088cc]">Donat Tizimi</span>
          </h1>

          <p className="text-sm md:text-base text-white/70 leading-relaxed mb-6">
            Sizning donatingiz tezkor video serverlar, anime tarjimalari va dublyaj jamoasi ishini qo'llab-quvvatlaydi. Barcha to'lovlar <strong>Tezcheck.uz</strong> tizimi orqali Click hamda Payme kartalari orqali 100% xavfsiz amalga oshiriladi.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white/80">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Tezcheck.uz Kassa Integratsiyasi</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
              <Zap size={16} className="text-amber-400" />
              <span>Click & Payme Qo'llab-quvvatlanadi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Goal Card */}
        <div className="md:col-span-2 bg-[#111113] border border-[#1a1a1c] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-[#ff006a]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">Oylik Server va Tarjima Maqsadi</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#ff006a] bg-[#ff006a]/10 px-2.5 py-1 rounded-full border border-[#ff006a]/20">
              {goalPercentage}% Bajarildi
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-black text-white font-mono">
              {totalAmount.toLocaleString('uz-UZ')} UZS
            </span>
            <span className="text-xs font-mono text-white/40">
              Maqsad: {monthlyGoal.toLocaleString('uz-UZ')} UZS
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-[#1c1c1e] rounded-full overflow-hidden p-0.5 border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${goalPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[#ff006a] via-purple-500 to-[#0088cc] rounded-full shadow-[0_0_12px_rgba(255,0,106,0.5)]"
            />
          </div>

          <p className="text-[11px] text-white/40 mt-3">
            Oylik maqsadga erishish orqali yangi anime fasllari reklamasiz va yuqori HD sifatda taqdim etiladi!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="bg-[#111113] border border-[#1a1a1c] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-wider mb-2">
              <Award size={16} className="text-amber-400" />
              <span>Jami Donatlar Soni</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {paidDonations.length} ta
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-xs">
            <span className="text-white/50">Eng katta donat:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {topSupporters.length > 0 ? `${topSupporters[0].amount.toLocaleString('uz-UZ')} UZS` : '0 UZS'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Donation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Donation Form */}
        <div className="lg:col-span-7 bg-[#111113] border border-[#1a1a1c] rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-[#1a1a1c] pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <CreditCard className="text-[#ff006a]" size={22} />
              <span>Donat Miqdorini Tanlang</span>
            </h2>
            <p className="text-xs text-white/50 mt-1">
              O'zingizga ma'qul miqdorni tanlang yoki o'z miqdoringizni kiriting
            </p>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-6">
            
            {/* Amount Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = selectedAmount === amt && !customAmount;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountSelect(amt)}
                    className={`py-3 px-3 rounded-xl font-mono font-bold text-xs sm:text-sm border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#ff006a] border-[#ff006a] text-white shadow-[0_0_15px_rgba(255,0,106,0.3)] scale-[1.02]'
                        : 'bg-[#161619] border-white/10 text-white/80 hover:border-white/30 hover:bg-[#1f1f23]'
                    }`}
                  >
                    {amt.toLocaleString('uz-UZ')} UZS
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/70 block uppercase tracking-wider">
                Yoki boshqa miqdor kiriting (UZS)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Masalan: 75000"
                  className="w-full bg-[#161619] border border-white/10 focus:border-[#ff006a] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none transition-colors placeholder:text-white/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 font-mono">
                  UZS
                </span>
              </div>
            </div>

            {/* Donor Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/70 block uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-[#ff006a]" />
                <span>Ismingiz yoki Taxallusingiz (Ixtiyoriy)</span>
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Masalan: Jasurbek yoki Anonim Otaku"
                className="w-full bg-[#161619] border border-white/10 focus:border-[#ff006a] rounded-xl px-4 py-3 text-white text-xs focus:outline-none transition-colors placeholder:text-white/20"
              />
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/70 block uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={13} className="text-[#ff006a]" />
                <span>Izoh yoki Ezgu Tilak (Ixtiyoriy)</span>
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Masalan: Solo Leveling va Naruto dublyajiga katta rahmat!"
                className="w-full bg-[#161619] border border-white/10 focus:border-[#ff006a] rounded-xl p-3 text-white text-xs focus:outline-none transition-colors placeholder:text-white/20 resize-none"
              />
            </div>

            {/* Payment Gateway Info Badge */}
            <div className="p-4 rounded-xl bg-[#161619] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0088cc]/20 border border-[#0088cc]/30 flex items-center justify-center text-[#0088cc]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Tezcheck.uz Merchant Integratsiyasi</h4>
                  <p className="text-[10px] text-white/40">Click & Payme orqali bir zumda to'lang</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-[#0088cc]/20 text-[#0088cc] px-2 py-1 rounded border border-[#0088cc]/30">
                  CLICK
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">
                  PAYME
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loadingInvoice}
              className="w-full py-4 bg-gradient-to-r from-[#ff006a] to-purple-600 hover:from-[#d40058] hover:to-purple-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#ff006a]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingInvoice ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Tezcheck Invoysi Yaratilmoqda...</span>
                </>
              ) : (
                <>
                  <Heart size={18} className="fill-current" />
                  <span>{finalAmount.toLocaleString('uz-UZ')} UZS Donat Qilish (Click / Payme)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Sidebar: Top Supporters & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Top Supporters */}
          <div className="bg-[#111113] border border-[#1a1a1c] rounded-2xl p-6">
            <div className="flex items-center gap-2 border-b border-[#1a1a1c] pb-3 mb-4">
              <Award className="text-amber-400" size={20} />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Top Homiylar (Eng Katta Donatlar)
              </h3>
            </div>

            {topSupporters.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-xs">
                Hali donatlar yo'q. Birinchi saxiy donat qiluvchi bo'ling!
              </div>
            ) : (
              <div className="space-y-3">
                {topSupporters.map((item, idx) => {
                  const crowns = ['🥇', '🥈', '🥉'];
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-[#161619] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{crowns[idx] || `#${idx + 1}`}</span>
                        <div>
                          <div className="text-xs font-bold text-white">{item.donor_name}</div>
                          <div className="text-[10px] text-white/40 truncate max-w-[160px]">
                            {item.comment}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {item.amount.toLocaleString('uz-UZ')} UZS
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Donations Feed */}
          <div className="bg-[#111113] border border-[#1a1a1c] rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-[#1a1a1c] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="text-[#0088cc]" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  So'nggi Donatlar
                </h3>
              </div>
              <button
                onClick={fetchDonations}
                className="p-1 text-white/40 hover:text-white transition-colors"
                title="Yangilash"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {donations.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-xs">
                Donatlar ro'yxati bo'sh.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {donations.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 rounded-xl bg-[#161619] border border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white/90">{item.donor_name}</span>
                      <span className="text-xs font-mono font-bold text-[#ff006a]">
                        +{item.amount.toLocaleString('uz-UZ')} UZS
                      </span>
                    </div>
                    {item.comment && (
                      <p className="text-[11px] text-white/60 bg-black/20 p-2 rounded-lg italic">
                        "{item.comment}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[9px] text-white/30">
                      <span>{item.payment_method}</span>
                      <span>{new Date(item.created_at).toLocaleString('uz-UZ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoiceModal && activeInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#111113] border border-[#ff006a]/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#ff006a]/10 border border-[#ff006a]/30 mx-auto flex items-center justify-center text-[#ff006a]">
                  {activeInvoice.status === 'paid' ? (
                    <CheckCircle size={36} className="text-emerald-400" />
                  ) : (
                    <CreditCard size={32} />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">
                    {activeInvoice.status === 'paid' ? "To'lov Muvaffaqiyatli Amalga Oshirildi!" : "Tezcheck.uz To'lov Invoysi Yaratildi"}
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Buyurtma kodi: <span className="font-mono text-white font-bold">#{activeInvoice.order_id}</span>
                  </p>
                </div>

                <div className="bg-[#161619] border border-white/10 p-4 rounded-xl text-center space-y-1">
                  <div className="text-xs text-white/40 uppercase tracking-wider font-bold">Donat Summasi</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {activeInvoice.amount.toLocaleString('uz-UZ')} UZS
                  </div>
                </div>

                {activeInvoice.status === 'paid' ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold space-y-2">
                    <p>Rahmat! Donatingiz loyihamiz va dublyaj jamoasiga yetib keldi. Siz saxiy homiylar ro'yxatiga qo'shildingiz!</p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-white/70">
                      Click yoki Payme dasturlari orqali to'lovni yakunlash uchun quyidagi tugmani bosing:
                    </p>

                    {activeInvoice.pay_url && (
                      <a
                        href={activeInvoice.pay_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <ExternalLink size={16} />
                        <span>Tezcheck Sahifasida To'lash (Click / Payme)</span>
                      </a>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleManualCheckStatus}
                        disabled={checkingStatus}
                        className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {checkingStatus ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        <span>Holatni tekshirish</span>
                      </button>

                      <button
                        type="button"
                        onClick={copyPayUrl}
                        className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition-colors cursor-pointer"
                        title="Havolani nusxalash"
                      >
                        {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-white/40 pt-2">
                      <Loader2 size={12} className="animate-spin text-[#ff006a]" />
                      <span>To'lov holati avtomatik tekshirilmoqda...</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="w-full py-2.5 bg-[#161619] hover:bg-[#222] text-white/60 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2"
                >
                  Yopish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
