import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-white/90">
      {/* Top back button */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Bosh sahifaga qaytish
      </Link>

      {/* Header */}
      <div className="bg-[#111] border border-[#222] p-6 sm:p-8 rounded-lg shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-[#ff006a]">
          <ShieldCheck size={160} />
        </div>
        <div className="flex items-center gap-3 text-[#ff006a] text-sm font-bold uppercase tracking-wider mb-2">
          <Lock size={18} /> Animem.uz Huquqiy Hujjatlari
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">Maxfiylik Siyosati (Privacy Policy)</h1>
        <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Ushbu Maxfiylik siyosati Animem.uz foydalanuvchilarining shaxsiy ma'lumotlarini to'plash, qayta ishlash, saqlash va himoya qilish tartibini belgilaydi. Biz foydalanuvchilarimizning xavfsizligi va maxfiyligini oliy o'ringa qo'yamiz.
        </p>
        <div className="mt-4 text-[11px] text-white/40">So'nggi yangilanish: 2026-yil 1-avgust</div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="text-[#ff006a]" size={18} /> 1. Qanday ma'lumotlar to'planadi?
          </h2>
          <p>Animem.uz saytidan foydalanish jarayonida quyidagi turdagi ma'lumotlar to'planishi mumkin:</p>
          <ul className="list-disc list-inside space-y-1 text-white/70 pl-2">
            <li><strong>Ro'yxatdan o'tish ma'lumotlari:</strong> Taxallus (Username), elektron pochta manzili (Email), profil rasmi va parol (shifrlangan ko'rinishda).</li>
            <li><strong>Texnik ma'lumotlar:</strong> IP manzil, brauzer turi va versiyasi, operatsion tizim, kirish vaqti hamda tashrif buyurilgan sahifalar.</li>
            <li><strong>Foydalanish tarixi:</strong> Ko'rilgan animelar, saqlangan sevimli ro'yxatlar hamda qoldirilgan izohlar va sharhlar.</li>
          </ul>
        </section>

        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="text-[#ff006a]" size={18} /> 2. Cookie fayllari va Analitika
          </h2>
          <p>Saytimiz samaradorligini oshirish va qulaylik yaratish maqsadida Cookie (kuki) fayllari hamda analitik tizimlardan foydalaniladi:</p>
          <ul className="list-disc list-inside space-y-1 text-white/70 pl-2">
            <li>Saytda avtorizatsiyadan o'tganlik holatini va foydalanuvchi sozlamalarini saqlab qolish uchun funksional cookie-fayllar ishlatiladi.</li>
            <li>Saytga tashriflar statistikasi va foydalanuvchi xatti-harakatlarini tahlil qilish uchun <strong>Yandex Metrika</strong> va <strong>Google Analytics</strong> xizmatlaridan foydalaniladi.</li>
            <li>Saytda uchinchi tomon reklama tarmoqlari (jumladan <strong>Yandex Advertising Network / РСЯ</strong> va hamkorlar) tomonidan qiziqishlarga mos reklamalarni ko'rsatish uchun reklama cookie-fayllari qo'llanilishi mumkin.</li>
          </ul>
        </section>

        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-[#ff006a]" size={18} /> 3. Ma'lumotlarni xavfsiz saqlash va Himoya
          </h2>
          <p>Biz foydalanuvchi ma'lumotlarini ruxsatsiz kirish, o'zgartirish yoki oshkor qilishdan himoya qilish uchun barcha zamonaviy SSL shifrlash sertifikatlari va xavfsiz protokollardan foydalanamiz.</p>
          <p>Animem.uz hech qachon foydalanuvchilarning shaxsiy ma'lumotlarini (email, parollar) uchinchi shaxslarga sotmaydi yoki taqdim etmaydi, qonunchilikda belgilangan alohida holatlar bundan mustasno.</p>
        </section>

        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="text-[#ff006a]" size={18} /> 4. Foydalanuvchilarning huquqlari
          </h2>
          <p>Har bir foydalanuvchi quyidagi huquqlarga ega:</p>
          <ul className="list-disc list-inside space-y-1 text-white/70 pl-2">
            <li>O'z profil ma'lumotlarini va parolini istalgan vaqtda o'zgartirish yoki yangilash;</li>
            <li>O'z hisobini va unga bog'liq barcha ma'lumotlarni to'liq o'chirishni so'rash;</li>
            <li>Brauzer sozlamalari orqali Cookie fayllarini o'chirish yoki bloklash.</li>
          </ul>
        </section>

        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="text-[#ff006a]" size={18} /> 5. Bog'lanish
          </h2>
          <p>Maxfiylik siyosati yoki shaxsiy ma'lumotlar bo'yicha savollaringiz bo'lsa, biz bilan bog'lanishingiz mumkin:</p>
          <div className="p-4 bg-black/40 rounded border border-[#333] space-y-1 text-xs">
            <div><strong>Elektron pochta:</strong> support@animem.uz / admin@animem.uz</div>
            <div><strong>Telegram qo'llab-quvvatlash:</strong> <a href="https://t.me/animem_uz2" target="_blank" rel="noreferrer" className="text-[#ff006a] hover:underline">@animem_uz2</a></div>
          </div>
        </section>
      </div>
    </div>
  );
}
