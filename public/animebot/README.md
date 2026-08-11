# Animebot va sayt sinxronizatsiyasi

Bot kanalga `Anime nomi = 1 [ixtiyoriy izoh]` captioni bilan yuborilgan video yoki
documentni qabul qiladi. U qismni Telegram botida saqlaydi va sayt API'sida anime hamda
qismni avtomatik yaratadi. Saytdagi qism tugmasi foydalanuvchini botning aynan shu qismiga
ochadi.

`public/animebot/.env.example` faylidan `public/animebot/.env` yarating va quyidagi qiymatlarni kiriting (bot bu faylni avtomatik o'qiydi):

```bash
ANIMEBOT_TOKEN="telegram-bot-token"
ANIMEBOT_USERNAME="sizning_bot_username"
ANIMEBOT_LOG_CHANNEL_ID="-100..."
ANIMEBOT_ADMIN_IDS="8991315532"
SITE_API_URL="https://animem.uz"
SITE_SYNC_SECRET="saytdagi-ANIMEBOT_SYNC_SECRET-bilan-bir-xil-maxfiy-kalit"
```

Sayt serverining `.env` fayliga esa quyidagini qo'shing:

```bash
ANIMEBOT_SYNC_SECRET="uzun-va-tasodifiy-maxfiy-kalit"
```

Keyin sayt serveri va bot jarayonini qayta ishga tushiring. Botni loyiha papkasidan
quyidagicha ishga tushiring:

```bash
cd public/animebot
sudo apt-get install python3.14-venv  # faqat bir marta, agar venv yo'q bo'lsa
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python main.py
```

Yoki shu environment qiymatlarini beradigan systemd service orqali ishga tushirish mumkin.

Eslatma: `SITE_SYNC_SECRET` hech qachon frontend (`VITE_*`) o'zgaruvchisi sifatida
berilmasin. Telegram tokeni ham faqat bot jarayonida qoladi.
