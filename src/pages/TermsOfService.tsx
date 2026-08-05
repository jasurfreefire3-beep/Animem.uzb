import React from 'react';
import { BookOpen, CheckCircle, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-white/90">
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Bosh sahifaga qaytish
      </Link>

      <div className="bg-[#111] border border-[#222] p-6 sm:p-8 rounded-lg shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-[#ff006a]">
          <BookOpen size={160} />
        </div>
        <div className="flex items-center gap-3 text-[#ff006a] text-sm font-bold uppercase tracking-wider mb-2">
          <Shield size={18} /> Animem.uz Huquqiy Hujjatlari
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">Foydalanish Shartlari (Terms of Service)</h1>
        <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Animem.uz saytiga tashrif buyurish va undan foydalanish ushbu Foydalanish shartlariga to'liq rozi bo'lganingizni anglatadi. Iltimos, saytdan foydalanishdan oldin shartlar bilan diqqat bilan tanishib chiqing.
        </p>
        <div className="mt-4 text-[11px] text-white/40">So'nggi yangilanish: 2026-yil 1-avgust</div>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle className="text-[#ff006a]" size={18} /> 1. Umumiy Qoidalar va Yoshi Cheklovi
          </h2>
          <p>
            Animem.uz — anime, manga va sharhlarni taqdim etuvchi axborot-ko'ngilochar platformadir. Saytdagi materiallar yoshi 16 yoshdan oshgan (16+) auditoriya uchun mo'ljallangan. 16 yoshga to'lmagan foydalanuvchilar platformadan ota-onalari yoki qonuniy vakillari nazorati ostida foydalanishlari tavsiya etiladi.
          </p>
        </section>

        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="text-[#ff006a]" size={18} /> 2. Hisob va Xavfsizlik
          </h2>
          <p>Saytda ro'yxatdan o'tishda foydalanuvchi quyidagi majburiyatlarni o'z zimmasiga oladi:</p>
          <ul className="list-disc list-inside space-y-1 text-white/70 pl-2">
            <li>To'g'ri va xavfsiz ma'lumotlarni kiritish;</li>
            <li>O'z paroli va profilining xavfsizligini ta'minlash;</li>
            <li>Boshqa shaxslar nomidan soxta profillar yaratmaslik.</li>
          </ul>
        </section>

        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-[#ff006a]" size={18} /> 3. Saytda Taqiqlar va Izohlar Qoidasi
          </h2>
          <p>Foydalanuvchilarga saytdagi sharhlar, chat va forumlarda quyidagilar qat'iyan man etiladi:</p>
          <ul className="list-disc list-inside space-y-1 text-white/70 pl-2">
            <li>Haqoratli, odobsiz yoki tajovuzkor so'zlarni ishlatish;</li>
            <li>Spam, reklama, uchinchi tomon havola va resurslarini tarqatish;</li>
            <li>Diniy, milliy yoki irqiy nizolarni keltirib chiqaruvchi mazmundagi xabarlar qoldirish;</li>
            <li>Ruxsatsiz spoilerlar (syujet sirlari) yozish (spoiler tegi ishlatilishi shart).</li>
          </ul>
        </section>

        <section className="bg-[#111]/60 border border-[#222] p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="text-[#ff006a]" size={18} /> 4. Mas'uliyatni Cheklash
          </h2>
          <p>
            Animem.uz ma'muriyati saytning uzluksiz va xatosiz ishlashini ta'minlashga harakat qiladi, biroq uchinchi tomon serverlari va texnik uzilishlar uchun javobgarlikni o'z zimmasiga olmaydi.
          </p>
        </section>
      </div>
    </div>
  );
}
