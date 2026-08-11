# -*- coding: utf-8 -*-
import asyncio
import hashlib
import json
import logging
import re
import sqlite3
import sys
import urllib.error
import urllib.request
from contextlib import closing

from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import (
    Message,
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    LinkPreviewOptions,
    FSInputFile,
)
import os

def load_local_env():
    """Bot papkasidagi .env faylini qo'shimcha kutubxonasiz o'qiydi."""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

load_local_env()

# ======================= CONFIG =======================
BOT_TOKEN = os.environ.get("ANIMEBOT_TOKEN", "")
ADMIN_IDS = [int(value) for value in os.environ.get("ANIMEBOT_ADMIN_IDS", "8991315532").split(",") if value.strip()]
LOG_CHANNEL_ID = int(os.environ.get("ANIMEBOT_LOG_CHANNEL_ID", "-1003717410610"))
DB_PATH = os.path.join(os.path.dirname(__file__), "kawaii.db")

# Sayt bilan ulanish. SITE_SYNC_SECRET serverdagi ANIMEBOT_SYNC_SECRET bilan bir xil bo'lishi kerak.
SITE_API_URL = os.environ.get("SITE_API_URL", "").rstrip("/")
SITE_SYNC_SECRET = os.environ.get("SITE_SYNC_SECRET", "")
BOT_PUBLIC_USERNAME = os.environ.get("ANIMEBOT_USERNAME", "").lstrip("@")

KAWAII_PASS_ENABLED = False
KAWAII_PASS_TEXT = (
    "🎒 <b>Kawaii Pass</b>\n\n"
    "Kawaii Pass orqali barcha epizodlarni bir vaqtda yuklab olish imkoniyatiga ega bo'lasiz.\n"
    "Hozircha bu funksiya faol emas — tez orada!"
)
# ========================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = Router()

def db_init():
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS anime (
            slug TEXT PRIMARY KEY,
            title TEXT NOT NULL
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS episodes (
            slug TEXT NOT NULL,
            ep_num INTEGER NOT NULL,
            file_id TEXT NOT NULL,
            file_type TEXT NOT NULL,
            note TEXT,
            thumb_file_id TEXT,
            cover_file_id TEXT,
            PRIMARY KEY (slug, ep_num)
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS site_links (
            token TEXT PRIMARY KEY,
            slug TEXT NOT NULL,
            ep_num INTEGER NOT NULL
        )
        """)
        cols = [r[1] for r in conn.execute("PRAGMA table_info(episodes)").fetchall()]
        if "note" not in cols:
            conn.execute("ALTER TABLE episodes ADD COLUMN note TEXT")
        if "thumb_file_id" not in cols:
            conn.execute("ALTER TABLE episodes ADD COLUMN thumb_file_id TEXT")
        if "cover_file_id" not in cols:
            conn.execute("ALTER TABLE episodes ADD COLUMN cover_file_id TEXT")
        conn.commit()

def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9а-яёʻʼ']+", "_", text, flags=re.UNICODE)
    text = re.sub(r"_+", "_", text).strip("_")
    return text

def site_slugify(text: str) -> str:
    """React saytidagi toSlug() bilan bir xil URL slug yasaydi."""
    text = text.strip().lower()
    text = re.sub(r"o['’`‘]", "o", text)
    text = re.sub(r"g['’`‘]", "g", text)
    text = re.sub(r"[^a-z0-9а-яё]+", "-", text, flags=re.UNICODE)
    return re.sub(r"^-+|-+$", "", text)

def make_episode_start_param(slug: str, ep_num: int) -> str:
    start_param = f"{slug}_ep_{ep_num}"
    if len(start_param) <= 64:
        return start_param

    # Telegram start parametri 64 belgidan oshmaydi. Uzun nomlar uchun token
    # SQLite'da saqlanadi va /start token orqali yana qismga ochiladi.
    token = "ep_" + hashlib.sha256(start_param.encode("utf-8")).hexdigest()[:32]
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute(
            "INSERT OR REPLACE INTO site_links (token, slug, ep_num) VALUES (?, ?, ?)",
            (token, slug, ep_num),
        )
        conn.commit()
    return token

def get_site_link(token: str):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        return conn.execute("SELECT slug, ep_num FROM site_links WHERE token=?", (token,)).fetchone()

async def sync_episode_to_website(title: str, slug: str, ep_num: int, note: str, bot_username: str):
    """Telegramga kelgan qismni sayt API'siga yuboradi.

    Video Telegramda qoladi; sayt foydalanuvchini aynan tanlangan qismga bot orqali olib boradi.
    Bu usul bot tokenini brauzerga yoki saytdagi videoga oshkor qilmaydi.
    """
    if not SITE_API_URL or not SITE_SYNC_SECRET or not bot_username:
        logger.warning("Sayt sinxronizatsiyasi o'tkazib yuborildi: SITE_API_URL, SITE_SYNC_SECRET yoki ANIMEBOT_USERNAME yo'q")
        return

    telegram_url = f"https://t.me/{bot_username}?start={make_episode_start_param(slug, ep_num)}"
    payload = json.dumps({
        "title": title,
        "slug": site_slugify(title),
        "episode_number": ep_num,
        "note": note,
        "telegram_url": telegram_url,
    }).encode("utf-8")
    request = urllib.request.Request(
        f"{SITE_API_URL}/api/integrations/animebot/episode",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SITE_SYNC_SECRET}",
        },
        method="POST",
    )

    def send_request():
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.read().decode("utf-8")

    try:
        await asyncio.to_thread(send_request)
        logger.info("Saytga sinxronlandi: %s, %s-qism", title, ep_num)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as error:
        logger.error("Sayt sinxronizatsiyasida xato: %s", error)

def save_episode(slug: str, title: str, ep_num: int, file_id: str, file_type: str,
                  note: str = None, thumb_file_id: str = None, cover_file_id: str = None):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute(
            "INSERT INTO anime (slug, title) VALUES (?, ?) "
            "ON CONFLICT(slug) DO UPDATE SET title=excluded.title",
            (slug, title),
        )
        conn.execute(
            "INSERT INTO episodes (slug, ep_num, file_id, file_type, note, thumb_file_id, cover_file_id) "
            "VALUES (?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(slug, ep_num) DO UPDATE SET file_id=excluded.file_id, file_type=excluded.file_type, "
            "note=excluded.note, thumb_file_id=excluded.thumb_file_id, cover_file_id=excluded.cover_file_id",
            (slug, ep_num, file_id, file_type, note, thumb_file_id, cover_file_id),
        )
        conn.commit()

def get_anime_title(slug: str):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        row = conn.execute("SELECT title FROM anime WHERE slug=?", (slug,)).fetchone()
        return row[0] if row else None

def is_new_anime(slug: str) -> bool:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        row = conn.execute("SELECT 1 FROM anime WHERE slug=?", (slug,)).fetchone()
        return row is None

def get_episode(slug: str, ep_num: int):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        row = conn.execute(
            "SELECT file_id, file_type, note, thumb_file_id, cover_file_id FROM episodes WHERE slug=? AND ep_num=?",
            (slug, ep_num),
        ).fetchone()
        return row

def get_all_episode_numbers(slug: str):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        rows = conn.execute(
            "SELECT ep_num FROM episodes WHERE slug=? ORDER BY ep_num", (slug,)
        ).fetchall()
        return [r[0] for r in rows]

def get_total_episodes_declared(slug: str) -> int:
    nums = get_all_episode_numbers(slug)
    return max(nums) if nums else 0

CAPTION_RE = re.compile(r"^\s*(?P<title>.+?)\s*=\s*(?P<ep>\d+)\s*(?:\[(?P<note>.*?)\])?\s*$")

def parse_caption(caption: str):
    if not caption:
        return None
    match = CAPTION_RE.match(caption.strip())
    if not match:
        return None
    title = match.group("title").strip()
    ep = int(match.group("ep"))
    note = match.group("note")
    note = note.strip() if note else None
    return title, ep, note

EPISODES_PER_PAGE = 12
EPISODES_PER_ROW = 4

def build_episode_keyboard(slug: str, total_eps: int, page: int = 0) -> InlineKeyboardMarkup:
    start = page * EPISODES_PER_PAGE
    end = min(start + EPISODES_PER_PAGE, total_eps)

    rows = []
    row = []
    for ep in range(start + 1, end + 1):
        row.append(
            InlineKeyboardButton(
                text=f"💿 {ep} ep",
                callback_data=f"ep:{slug}:{ep}",
                style="primary",
            )
        )
        if len(row) == EPISODES_PER_ROW:
            rows.append(row)
            row = []
    if row:
        rows.append(row)

    total_pages = max(1, (total_eps + EPISODES_PER_PAGE - 1) // EPISODES_PER_PAGE)
    nav_row = [
        InlineKeyboardButton(text="⬅️ Oldingi", callback_data=f"pg:{slug}:{page-1}", style="success"),
        InlineKeyboardButton(text=f"{page+1} / {total_pages}", callback_data="noop", style="primary"),
        InlineKeyboardButton(text="Keyingi ➡️", callback_data=f"pg:{slug}:{page+1}", style="success"),
    ]
    rows.append(nav_row)

    if KAWAII_PASS_ENABLED:
        rows.append([
            InlineKeyboardButton(text="🎒 Animem Pass", callback_data=f"pass:{slug}", style="success")
        ])

    return InlineKeyboardMarkup(inline_keyboard=rows)

def anime_caption_text(title: str, total_eps: int, watching_count: int = 1) -> str:
    return (
        f"📕 <b>{title}</b>\n\n"
        f"📺 Epizod 1 / {total_eps} | 🌐 <a href='https://animem.uz'>Websayt</a>\n\n"
        f"🟢 Hozir tomosha qilinmoqda ({watching_count} kishi)\n\n"
        f"<i>Barcha epizodlarni ko'rish uchun pastdagi raqamlardan birini tanlang 👇</i>"
    )

def episode_video_caption(title: str, ep_num: int, note: str = None) -> str:
    base = f"📕 <b>{title}</b> — {ep_num}-qism"
    if note:
        base += f"\n📝 {note}"
    return base

def extract_cover_file_id(video) -> str:
    """Telegram videoning maxsus 'cover' (muqova) rasmini ajratib oladi.
    Bu thumbnail'dan farq qiladi — cover foydalanuvchi video yuklaganda
    Telegram ilovasida qo'lda tanlagan muqova surati (PhotoSize ro'yxati)."""
    cover_sizes = getattr(video, "cover", None)
    if not cover_sizes:
        return None
    largest = max(cover_sizes, key=lambda p: (p.width or 0) * (p.height or 0))
    return largest.file_id

@router.channel_post(F.chat.id == LOG_CHANNEL_ID, F.video | F.document)
async def on_channel_media(message: Message):
    caption = message.caption or ""
    parsed = parse_caption(caption)
    if not parsed:
        return

    title, ep_num, note = parsed
    slug = slugify(title)
    first_time = is_new_anime(slug)

    if message.video:
        file_id = message.video.file_id
        file_type = "video"
        thumb_file_id = message.video.thumbnail.file_id if message.video.thumbnail else None
        cover_file_id = extract_cover_file_id(message.video)
    else:
        file_id = message.document.file_id
        file_type = "document"
        thumb_file_id = message.document.thumbnail.file_id if message.document.thumbnail else None
        cover_file_id = None  # Documentlarda "cover" funksiyasi mavjud emas

    save_episode(slug, title, ep_num, file_id, file_type, note, thumb_file_id, cover_file_id)
    logger.info(
        f"Saqlandi: {title} - {ep_num} qism (slug: {slug}, note: {note}, "
        f"thumb: {bool(thumb_file_id)}, cover: {bool(cover_file_id)})"
    )

    bot_username = BOT_PUBLIC_USERNAME or (await message.bot.get_me()).username
    await sync_episode_to_website(title, slug, ep_num, note, bot_username)

    if first_time:
        link = f"https://t.me/{bot_username}?start={slug}"
        await message.reply(
            f"✅ Yangi anime qo'shildi: <b>{title}</b>\n"
            f"🔗 Havola: {link}"
        )

@router.message(CommandStart())
async def cmd_start(message: Message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer("Salom! Animelarni ko'rish uchun maxsus havolalardan foydalaning. Havola Animem.uz saytida.")
        return

    start_param = args[1]
    # Saytdan kelgan URL tanlangan qismni bevosita ochadi: <slug>_ep_<raqam>.
    episode_match = re.match(r"^(?P<slug>.+)_ep_(?P<ep>\d+)$", start_param)
    saved_link = get_site_link(start_param)
    if episode_match or saved_link:
        slug = episode_match.group("slug") if episode_match else saved_link[0]
        ep_num = int(episode_match.group("ep")) if episode_match else saved_link[1]
        ep_data = get_episode(slug, ep_num)
        title = get_anime_title(slug)
        if not title or not ep_data:
            await message.answer("Kechirasiz, bu qism topilmadi.")
            return
        file_id, file_type, note, _, cover_file_id = ep_data
        caption = episode_video_caption(title, ep_num, note)
        if file_type == "video":
            await message.answer_video(video=file_id, cover=cover_file_id, caption=caption)
        else:
            await message.answer_document(document=file_id, caption=caption)
        return

    slug = start_param
    title = get_anime_title(slug)
    if not title:
        await message.answer("Kechirasiz, bu anime topilmadi.")
        return

    total_eps = get_total_episodes_declared(slug)
    first_ep = get_episode(slug, 1)

    if not first_ep:
        await message.answer("Bu animening birinchi qismi hali yuklanmagan.")
        return

    file_id, file_type, note, thumb_file_id, cover_file_id = first_ep
    caption = anime_caption_text(title, total_eps)
    reply_markup = build_episode_keyboard(slug, total_eps, page=0)

    if os.path.exists("logo.png"):
        await message.answer_photo(photo=FSInputFile("logo.png"))

    if file_type == "video":
        await message.answer_video(
            video=file_id,
            cover=cover_file_id,
            caption=caption,
            reply_markup=reply_markup,
            link_preview_options=LinkPreviewOptions(is_disabled=True)
        )
    else:
        await message.answer_document(
            document=file_id,
            caption=caption,
            reply_markup=reply_markup,
            link_preview_options=LinkPreviewOptions(is_disabled=True)
        )

@router.callback_query(F.data.startswith("pg:"))
async def process_page_callback(callback: CallbackQuery):
    _, slug, page_str = callback.data.split(":")
    page = int(page_str)
    
    total_eps = get_total_episodes_declared(slug)
    total_pages = max(1, (total_eps + EPISODES_PER_PAGE - 1) // EPISODES_PER_PAGE)
    
    if page < 0 or page >= total_pages:
        await callback.answer()
        return

    title = get_anime_title(slug) or "Anime"
    caption = anime_caption_text(title, total_eps)
    reply_markup = build_episode_keyboard(slug, total_eps, page=page)

    await callback.message.edit_caption(
        caption=caption,
        reply_markup=reply_markup,
        link_preview_options=LinkPreviewOptions(is_disabled=True)
    )
    await callback.answer()

@router.callback_query(F.data.startswith("ep:"))
async def process_episode_callback(callback: CallbackQuery):
    _, slug, ep_str = callback.data.split(":")
    ep_num = int(ep_str)

    ep_data = get_episode(slug, ep_num)
    if not ep_data:
        await callback.answer("Bu qism hali yuklanmagan!", show_alert=True)
        return

    file_id, file_type, note, thumb_file_id, cover_file_id = ep_data
    title = get_anime_title(slug) or "Anime"
    await callback.answer(f"{ep_num}-qism yuklanmoqda...")

    if os.path.exists("logo.png"):
        await callback.message.answer_photo(photo=FSInputFile("logo.png"))

    caption = episode_video_caption(title, ep_num, note)

    if file_type == "video":
        await callback.message.answer_video(
            video=file_id, cover=cover_file_id, caption=caption
        )
    else:
        await callback.message.answer_document(document=file_id, caption=caption)

@router.callback_query(F.data == "noop")
async def process_noop(callback: CallbackQuery):
    await callback.answer()

@router.callback_query(F.data.startswith("pass:"))
async def process_pass(callback: CallbackQuery):
    if KAWAII_PASS_ENABLED:
        await callback.message.answer(KAWAII_PASS_TEXT)
    await callback.answer()

async def main():
    print("\n=== BOT ISHGA TUSHIRILMOQDA ===")
    try:
        if not BOT_TOKEN:
            raise RuntimeError("ANIMEBOT_TOKEN topilmadi. Uni environment o'zgaruvchisi sifatida kiriting.")
        db_init()
        print("[1/3] Ma'lumotlar bazasi muvaffaqiyatli ulandi.")
        
        bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
        dp = Dispatcher()
        dp.include_router(router)
        print("[2/3] Aiogram sozlamalari yuklandi.")
        
        print("[3/3] Bot muvaffaqiyatli ishga tushdi va xabarlarni kutmoqda... (To'xtatish uchun Ctrl+C bosing)")
        logger.info("Bot ishga tushdi...")
        await dp.start_polling(bot)
    except Exception as e:
        print(f"❌ XATOLIK YUZ BERDI: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBot foydalanuvchi tomonidan to'xtatildi.")
        sys.exit(0)
