import React from 'react';
import { Copyright, ShieldAlert, Mail, ArrowLeft, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DMCA() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-white/90">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Bosh sahifaga qaytish
      </Link>

      <div className="bg-[#111] border border-[#222] p-6 sm:p-8 rounded-lg shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-[#ff006a]">
          <Copyright size={160} />
        </div>
        <div className="flex items-center gap-3 text-[#ff006a] text-sm font-bold uppercase tracking-wider mb-2">
          <ShieldAlert size={18} /> Huquq Egalari Uchun / For Copyright Holders
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">Mualliflik Huquqi va DMCA Siyosati</h1>
        <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Animem.uz mualliflik huquqlarini va intellektual mulk egalarining qonuniy huquqlarini hurmat qiladi. Biz DMCA (Digital Millennium Copyright Act) va xalqaro mualliflik huquqi standartlariga mos ravishda ish yuritamiz.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Copyright className="text-[#ff006a]" size={18} /> 1. Rad etish va Huquqiy Ogohlantirish
          </h2>
          <p>
            Animem.uz sayti o'z serverlarida noqonuniy videofayllar yoki mualliflik huquqi bilan himoyalangan kontentlarni saqlamaydi. Saytdagi barcha videopleyerlar va pleylistlar ochiq internet manbalaridagi (VK, Telegram, Sibnet, Ok.ru va boshqa ochiq pleyerlar) havola va kodlardan (embed) iborat.
          </p>
          <p>
            Biroq, biz mualliflik huquqi egalarining har qanday asosli talablarini ko'rib chiqishga va qoidabuzarlik aniqlangan havolalarni tezkorlik bilan o'chirishga tayyormiz.
          </p>
        </section>

        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckSquare className="text-[#ff006a]" size={18} /> 2. Murojaat Yuborish Tartibi
          </h2>
          <p>
            Agar siz mualliflik huquqi egasi bo'lsangiz va Animem.uz saytidagi biron-bir sahifada huquqlaringiz buzilgan deb hisoblasangiz, quyidagi ma'lumotlarni o'z ichiga olgan rasmiy murojaatni bizga yuborishingiz mumkin:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70 pl-2">
            <li>Mualliflik huquqini tasdiqlovchi rasmiy hujjat nusxasi yoki sertifikat;</li>
            <li>Huquq egalari yoki ularning rasmiy vakilining to'liq ismi-sharifi va aloqa ma'lumotlari;</li>
            <li>Animem.uz saytidagi qoidabuzarlik mavjud bo'lgan aniq sahifa havolasi (URL);</li>
            <li>Kontentni o'chirish yoki bloklash bo'yicha rasmiy so'rov.</li>
          </ul>
        </section>

        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="text-[#ff006a]" size={18} /> 3. Ko'rib Chiqish Muddati va Bog'lanish
          </h2>
          <p>
            Barcha murojaatlar kelib tushgan vaqtdan e'tiboran <strong>24 soat ichida</strong> ko'rib chiqiladi. Asosli murojaat qabul qilingach, ko'rsatilgan materiallar zudlik bilan platformadan olib tashlanadi.
          </p>
          <div className="p-4 bg-black/40 rounded border border-[#333] space-y-2 text-xs">
            <div><strong>Rasmiy email:</strong> <a href="mailto:dmca@animem.uz" className="text-[#ff006a] hover:underline font-bold">dmca@animem.uz</a> / <a href="mailto:admin@animem.uz" className="text-[#ff006a] hover:underline font-bold">admin@animem.uz</a></div>
            <div><strong>Telegram muloqot:</strong> <a href="https://t.me/animem_uz2" target="_blank" rel="noreferrer" className="text-[#ff006a] hover:underline">@animem_uz2</a></div>
          </div>
        </section>
      </div>
    </div>
  );
}
