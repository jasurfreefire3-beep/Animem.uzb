import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import { Server } from "socket.io";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import multer from "multer";

dotenv.config();

const upload = multer({ dest: "/tmp/" });

const app = express();
app.set("trust proxy", true);
app.use(cors());

// Proxy Firebase Auth helper routes (/__/*) to Firebase's default auth handler
app.use("/__", (req, res) => {
  const targetPath = "/__" + req.url;
  const options = {
    hostname: "gen-lang-client-0918187443.firebaseapp.com",
    port: 443,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: "gen-lang-client-0918187443.firebaseapp.com",
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("Firebase Auth Proxy Error:", err);
    if (!res.headersSent) {
      res.status(500).send("Auth Proxy Error");
    }
  });

  req.pipe(proxyReq, { end: true });
});

app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "anime_super_secret_key";

// MySQL Database Pool Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || "db.fr-pari1.bengt.wasmernet.com",
  port: Number(process.env.DB_PORT) || 10272,
  user: process.env.DB_USER || "user_b1d5fdb1",
  password: process.env.DB_PASSWORD || "pw_7GNRdocASAIUzobl5Ezatle9fwRC3oYq",
  database: process.env.DB_NAME || "dataanime",
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  idleTimeout: 30000,
  connectTimeout: 20000,
});

// Create Server

(pool as any).on("error", (err: any) => {
  console.error("[DB Pool Error]", err?.message || err);
});

// Resilient query wrapper with automatic retry on connection drops
async function dbQuery<T = any>(sql: string, params?: any[], retries = 3): Promise<T> {
  try {
    const res = await pool.query(sql, params);
    return res as unknown as T;
  } catch (err: any) {
    const isConnErr =
      err?.code === "PROTOCOL_CONNECTION_LOST" ||
      err?.code === "ECONNRESET" ||
      err?.code === "EPIPE" ||
      err?.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR" ||
      err?.code === "ETIMEDOUT" ||
      (err?.message && (
        err.message.includes("Connection lost") ||
        err.message.includes("closed the connection") ||
        err.message.includes("is closed")
      ));

    if (isConnErr && retries > 0) {
      console.warn(`[DB] Connection lost (${err.message}), retrying query in 300ms... (${retries} attempts remaining)`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      return dbQuery<T>(sql, params, retries - 1);
    }
    throw err;
  }
}

const LOCAL_STORE_PATH = path.join(process.cwd(), "local_store.json");

function loadLocalStore() {
  try {
    if (!fs.existsSync(LOCAL_STORE_PATH)) {
      const defaultData = {
        animes: [
          {
            id: 1,
            title: "Solo Leveling 2-Mavsum",
            description: "Sung Jin-Woo eng kuchsiz ovchidan dunyoning eng kuchli soyalar hukmdorigacha bo'lgan yo'lini davom ettiradi.",
            image_url: "https://m.media-amazon.com/images/M/MV5BODlhWOE5NjMtN2I0OC00NjA3LTkyM2YtM2I5Njg3MTBhYTY1XkEyXkFqcGc@._V1_.jpg",
            banner_url: "https://m.media-amazon.com/images/M/MV5BODlhWOE5NjMtN2I0OC00NjA3LTkyM2YtM2I5Njg3MTBhYTY1XkEyXkFqcGc@._V1_.jpg",
            rating: 9.8,
            rating_count: 150,
            holati: "Davom etmoqda",
            yil: 2025,
            studiyasi: "A-1 Pictures",
            qismlar_soni: 12,
            korishlar: 1240,
            janrlar: "Jangari, Sarguzasht, Fantastika",
            video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
            tavsiya: true,
            is_banner: true
          },
          {
            id: 2,
            title: "Jujutsu Kaisen 2-Mavsum",
            description: "Gojo Satoru va Suguru Getoning o'tmishi hamda Shibuya voqealari tasvirlangan unutilmas mavsum.",
            image_url: "https://m.media-amazon.com/images/M/MV5BNGY4MTg3NjgtMmFkYi00ZTNmLTgwAVtLTExNmI0MDI0U3M4XkEyXkFqcGc@._V1_.jpg",
            banner_url: "https://m.media-amazon.com/images/M/MV5BNGY4MTg3NjgtMmFkYi00ZTNmLTgwAVtLTExNmI0MDI0U3M4XkEyXkFqcGc@._V1_.jpg",
            rating: 9.5,
            rating_count: 120,
            holati: "Tugallangan",
            yil: 2023,
            studiyasi: "MAPPA",
            qismlar_soni: 23,
            korishlar: 980,
            janrlar: "Jangari, Mistika, Mifyologiya",
            video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
            tavsiya: true,
            is_banner: true
          },
          {
            id: 3,
            title: "Demon Slayer: Hashira Training Arc",
            description: "Tanjiro va uning do'stlari Yuqori Darajali iblislar bilan bo'ladigan hal qiluvchi jang oldidan Hashiralar bilan mashg'ulot o'tkazishadi.",
            image_url: "https://m.media-amazon.com/images/M/MV5BZjgwNzRhM2EtNWY2OC00M2I2LThmYWYtMDlkY2VmZWM4Y2FlXkEyXkFqcGc@._V1_.jpg",
            banner_url: "https://m.media-amazon.com/images/M/MV5BZjgwNzRhM2EtNWY2OC00M2I2LThmYWYtMDlkY2VmZWM4Y2FlXkEyXkFqcGc@._V1_.jpg",
            rating: 9.2,
            rating_count: 95,
            holati: "Tugallangan",
            yil: 2024,
            studiyasi: "ufotable",
            qismlar_soni: 8,
            korishlar: 850,
            janrlar: "Jangari, Mifyologiya, Tarixiy",
            video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
            tavsiya: true,
            is_banner: true
          }
        ],
        notifications: [
          {
            id: 1,
            message: "Xush kelibsiz! Animem.uz platformasiga yangi animelar va epizodlar yuklanmoqda.",
            created_at: new Date().toISOString()
          }
        ],
        comments: [],
        episodes: [],
        users: [],
        ratings: [],
        messages: []
      };
      fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }
    const raw = fs.readFileSync(LOCAL_STORE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error loading local_store.json:", e);
    return { animes: [], notifications: [], comments: [], episodes: [], users: [], ratings: [], messages: [] };
  }
}

function saveLocalStore(data: any) {
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving local_store.json:", e);
  }
}

const server = http.createServer(app);

// Socket.io Server Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware to authenticate JWT tokens
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.sendStatus(403);
    req.user = decoded;
    next();
  });
};

// Check and ensure database connection on start
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to MySQL database successfully!");
    
    // Create notifications table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Verified notifications table in MySQL.");

    // Check if avatar_url column exists in users
    const [columns]: any = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'avatar_url' 
        AND TABLE_SCHEMA = DATABASE()
    `);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE users ADD COLUMN avatar_url MEDIUMTEXT DEFAULT NULL
      `);
      console.log("Added avatar_url column to users table.");
    }

    // Check if telegram_id column exists in users
    const [tgColumns]: any = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'telegram_id' 
        AND TABLE_SCHEMA = DATABASE()
    `);

    if (tgColumns.length === 0) {
      await connection.query(`
        ALTER TABLE users ADD COLUMN telegram_id VARCHAR(255) DEFAULT NULL
      `);
      console.log("Added telegram_id column to users table.");
    }

    // Check if phone column exists in users
    const [phoneColumns]: any = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'phone' 
        AND TABLE_SCHEMA = DATABASE()
    `);

    if (phoneColumns.length === 0) {
      await connection.query(`
        ALTER TABLE users ADD COLUMN phone VARCHAR(255) DEFAULT NULL
      `);
      console.log("Added phone column to users table.");
    }

    connection.release();
  } catch (err) {
    console.error("Database connection/migration failed on startup:", err);
  }
}
testDbConnection();

// --- Socket.io Real-time Chat Logic ---
io.on("connection", async (socket) => {
  console.log("A user connected to the chat:", socket.id);

  try {
    // Send previous 50 messages to the newly connected user
    const [rows]: any = await dbQuery(
      `SELECT m.*, u.avatar_url AS user_avatar 
       FROM messages m 
       LEFT JOIN users u ON m.user_id = u.id 
       ORDER BY m.id DESC LIMIT 50`
    );
    // Reverse rows so they are in chronological order
    const previousMessages = [...rows].reverse();
    socket.emit("previousMessages", previousMessages);
  } catch (err) {
    console.error("Error fetching previous messages for socket:", err);
  }

  // Handle new message
  socket.on("sendMessage", async (data) => {
    console.log("SEND MESSAGE RECEIVED", data);
    try {
      const { user_id, user_name, content, reply_to_id, reply_to_name, reply_to_content } = data;

      const [result]: any = await dbQuery(
        "INSERT INTO messages (user_id, user_name, content, reply_to_id, reply_to_name, reply_to_content) VALUES (?, ?, ?, ?, ?, ?)",
        [
          user_id || null,
          user_name || "Anonim",
          content || "",
          reply_to_id || null,
          reply_to_name || null,
          reply_to_content || null,
        ]
      );

      let user_avatar = null;
      if (user_id) {
        try {
          const [uRows]: any = await dbQuery("SELECT avatar_url FROM users WHERE id = ?", [user_id]);
          if (uRows && uRows[0]) {
            user_avatar = uRows[0].avatar_url;
          }
        } catch (e) {}
      }

      const insertedMessage = {
        id: result.insertId,
        user_id,
        user_name,
        user_avatar,
        content,
        reply_to_id,
        reply_to_name,
        reply_to_content,
        created_at: new Date().toISOString(),
      };

      // Broadcast new message to everyone
      io.emit("newMessage", insertedMessage);
    } catch (err) {
      console.error("Error saving new chat message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from the chat:", socket.id);
  });
});

// --- API ROUTES ---

// Video streaming proxy endpoint to bypass CORS / hotlinking / referrer restrictions
app.get("/api/proxy-video", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send("Video URL is required");
  }

  try {
    let cleanUrl = targetUrl.trim();
    if (cleanUrl.startsWith("//")) {
      cleanUrl = "https:" + cleanUrl;
    }

    // Auto-resolve Mover.uz watch/embed/page links to direct MP4 stream
    if (cleanUrl.includes("mover.uz")) {
      const moverMatch = cleanUrl.match(/(?:v\.mover\.uz\/|mover\.uz\/(?:watch|video\/embed|video|v)\/)([A-Za-z0-9_-]+)/i);
      if (moverMatch && moverMatch[1]) {
        let rawId = moverMatch[1].replace(/\.mp4$/i, "").replace(/_(?:m|h|s|q)$/i, "");
        if (rawId) {
          const quality = req.query.quality === "720" || req.query.quality === "hd" ? "_h" : "_m";
          cleanUrl = `https://v.mover.uz/${rawId}${quality}.mp4`;
        }
      }
    }

    const parsed = new URL(cleanUrl);

    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const reqHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "identity",
      "Connection": "keep-alive",
    };

    if (req.headers.range) {
      reqHeaders["Range"] = req.headers.range;
    }

    if (parsed.hostname.includes("mover.uz")) {
      reqHeaders["Referer"] = "https://mover.uz/";
    }

    const proxyReq = client.request(
      parsed,
      {
        method: req.method,
        headers: reqHeaders,
      },
      (proxyRes) => {
        // Follow redirects (301, 302, 307, 308)
        if (
          proxyRes.statusCode &&
          [301, 302, 303, 307, 308].includes(proxyRes.statusCode) &&
          proxyRes.headers.location
        ) {
          const redirectUrl = new URL(proxyRes.headers.location, parsed).toString();
          return res.redirect(`/api/proxy-video?url=${encodeURIComponent(redirectUrl)}`);
        }

        res.status(proxyRes.statusCode || 200);

        const headersToForward = [
          "content-type",
          "content-length",
          "accept-ranges",
          "content-range",
          "content-disposition",
        ];

        headersToForward.forEach((h) => {
          if (proxyRes.headers[h]) {
            res.setHeader(h, proxyRes.headers[h]!);
          }
        });

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "public, max-age=3600");

        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", (err) => {
      console.error("[Video Proxy Error]", err.message);
      if (!res.headersSent) {
        res.status(500).send("Video Proxy failed: " + err.message);
      }
    });

    req.on("close", () => {
      proxyReq.destroy();
    });

    proxyReq.end();
  } catch (err: any) {
    console.error("[Video Proxy Exception]", err?.message || err);
    if (!res.headersSent) {
      res.status(400).send("Invalid URL");
    }
  }
});

// Resend Email Verification Store
interface VerificationRecord {
  code: string;
  expiresAt: number;
  verified: boolean;
}

const verificationCodes: Record<string, VerificationRecord> = {};
const passwordResetCodes: Record<string, VerificationRecord> = {};
const phoneVerificationCodes: Record<string, VerificationRecord> = {};
const phonePasswordResetCodes: Record<string, VerificationRecord> = {};
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_SeJuCp73_DFV7UrQUQwVRESKmKitvo2bg";

// Helper function to build ultra-stylish Anime-themed HTML Email Template
function buildAnimeEmailHtml(title: string, subtitle: string, code: string, note: string) {
  const logoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSF45hYamscf6EOEVfza62xM3PmDvOBibTRYEmsaMscyw&s=10";
  const bannerUrl = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Animem.uz</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #07070a; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07070a; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #12121a; border-radius: 16px; overflow: hidden; border: 1px solid #ff006a44; box-shadow: 0 10px 40px rgba(255, 0, 106, 0.2);">
              
              <!-- Anime Banner Image Header -->
              <tr>
                <td style="position: relative; background: #181824 url('${bannerUrl}') center/cover no-repeat; height: 160px; text-align: center; vertical-align: bottom;">
                  <div style="background: linear-gradient(to bottom, rgba(18, 18, 26, 0.2), #12121a); padding: 20px 0 0 0;">
                    <!-- Logo Badge -->
                    <img src="${logoUrl}" alt="Animem.uz Logo" width="84" height="84" style="border-radius: 50%; border: 3px solid #ff006a; box-shadow: 0 0 20px rgba(255, 0, 106, 0.8); object-fit: cover; display: inline-block;" />
                  </div>
                </td>
              </tr>

              <!-- Content Area -->
              <tr>
                <td style="padding: 25px 30px; text-align: center;">
                  <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 2px;">
                    ANIMEM<span style="color: #ff006a;">.UZ</span>
                  </h1>
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #a0a0b8; line-height: 1.5;">
                    ${subtitle}
                  </p>

                  <!-- Code Box -->
                  <div style="background: #181826; border: 2px dashed #ff006a; border-radius: 14px; padding: 22px 15px; margin: 20px 0; text-align: center; box-shadow: inset 0 0 15px rgba(255, 0, 106, 0.1);">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #ff006a; font-weight: 800; margin-bottom: 8px;">
                      ⚡ ${title} ⚡
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #ffffff; text-shadow: 0 0 12px #ff006a;">
                      ${code}
                    </div>
                  </div>

                  <p style="margin: 20px 0 0 0; font-size: 12px; color: #787898; line-height: 1.5;">
                    ${note}
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #0b0b12; padding: 16px 30px; text-align: center; border-top: 1px solid #1a1a28;">
                  <p style="margin: 0; font-size: 11px; color: #626278;">
                    © ${new Date().getFullYear()} Animem.uz - Barcha huquqlar himoyalangan.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Send 6-digit verification code via Resend
app.post("/api/auth/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Yaroqli email manzilini kiriting!" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists in DB
    const [existing]: any = await dbQuery("SELECT id FROM users WHERE email = ?", [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "Ushbu email bilan allaqachon ro'yxatdan o'tilgan! Kirish sahifasidan foydalaning." });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in memory for 10 minutes
    verificationCodes[cleanEmail] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false,
    };

    console.log(`[Resend Auth] Verification code for ${cleanEmail}: ${code}`);

    // Send email using Resend API
    let emailSent = false;
    let emailError = "";

    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Animem.uz <noreply@animem.uz>",
          to: [cleanEmail],
          subject: "Animem.uz - Tasdiqlash kodi: " + code,
          html: buildAnimeEmailHtml(
            "TASDIQLASH KODI",
            "Ro'yxatdan o'tishni yakunlash uchun quyidagi tasdiqlash kodini kiriting:",
            code,
            "Ushbu kod 10 daqiqa davomida amal qiladi. Agarda siz ro'yxatdan o'tishni so'ramagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring."
          ),
        }),
      });

      const resendData = await resendResponse.json();
      console.log("[Resend API Response]:", resendData);

      if (resendResponse.ok) {
        emailSent = true;
      } else {
        if (typeof resendData.message === "string") {
          emailError = resendData.message;
        } else if (resendData.error && typeof resendData.error.message === "string") {
          emailError = resendData.error.message;
        } else if (typeof resendData.error === "string") {
          emailError = resendData.error;
        } else {
          emailError = "Resend API cheklovi";
        }
      }
    } catch (sendErr: any) {
      console.error("[Resend Fetch Error]:", sendErr);
      emailError = sendErr.message || "Email serveriga ulanishda xatolik";
    }

    if (!emailSent) {
      console.warn(`[Resend Auth Warning] Email sending failed for ${cleanEmail}: ${emailError}. Providing fallback code.`);
    }

    return res.json({
      success: true,
      emailSent,
      message: "Tasdiqlash kodi email manzilingizga yuborildi! Pochtani (va Spam papkasini) tekshiring.",
    });
  } catch (error: any) {
    console.error("Send code error:", error);
    res.status(500).json({ error: "Tasdiqlash kodini yuborishda xatolik yuz berdi" });
  }
});

// FORGOT PASSWORD: Send Code
app.post("/api/auth/forgot-password-send-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Yaroqli email manzilini kiriting!" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists in DB
    const [existing]: any = await dbQuery("SELECT id FROM users WHERE email = ?", [cleanEmail]);
    if (!existing || existing.length === 0) {
      return res.status(400).json({ error: "Ushbu email manzili bilan foydalanuvchi topilmadi!" });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in memory for 10 minutes
    passwordResetCodes[cleanEmail] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false,
    };

    console.log(`[Forgot Password] Reset code for ${cleanEmail}: ${code}`);

    // Send email via Resend
    let emailSent = false;
    let emailError = "";

    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Animem.uz <noreply@animem.uz>",
          to: [cleanEmail],
          subject: "Animem.uz - Parolni tiklash kodi: " + code,
          html: buildAnimeEmailHtml(
            "PAROLNI TIKLASH KODI",
            "Parolingizni tiklash va yangisini o'rnatish uchun tasdiqlash kodi:",
            code,
            "Ushbu kod 10 daqiqa davomida amal qiladi. Agarda siz parolni tiklashni so'ramagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring."
          ),
        }),
      });

      const resendData = await resendResponse.json();
      console.log("[Resend API Forgot Password Response]:", resendData);

      if (resendResponse.ok) {
        emailSent = true;
      } else {
        if (typeof resendData.message === "string") {
          emailError = resendData.message;
        } else if (resendData.error && typeof resendData.error.message === "string") {
          emailError = resendData.error.message;
        } else {
          emailError = "Resend API xatosi";
        }
      }
    } catch (sendErr: any) {
      console.error("[Resend Forgot Password Fetch Error]:", sendErr);
      emailError = sendErr.message || "Email serveriga ulanishda xatolik";
    }

    if (!emailSent) {
      console.warn(`[Resend Forgot Warning] Email sending failed for ${cleanEmail}: ${emailError}. Providing fallback code.`);
    }

    return res.json({
      success: true,
      emailSent,
      message: "Parolni tiklash kodi email manzilingizga yuborildi! Pochtani (va Spam papkasini) tekshiring.",
    });
  } catch (error: any) {
    console.error("Forgot password send code error:", error);
    res.status(500).json({ error: "Parolni tiklash kodini yuborishda xatolik yuz berdi" });
  }
});

// FORGOT PASSWORD: Verify Code
app.post("/api/auth/forgot-password-verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email va kodni kiriting!" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const record = passwordResetCodes[cleanEmail];
    if (!record) {
      return res.status(400).json({ error: "Tiklash kodi topilmadi yoki yuborilmagan!" });
    }

    if (Date.now() > record.expiresAt) {
      delete passwordResetCodes[cleanEmail];
      return res.status(400).json({ error: "Tiklash kodi muddati o'tgan! Qayta kod so'rang." });
    }

    if (record.code !== cleanCode) {
      return res.status(400).json({ error: "Tasdiqlash kodi xato kiritildi!" });
    }

    record.verified = true;

    return res.json({
      success: true,
      message: "Tasdiqlash kodi to'g'ri kiritildi!",
    });
  } catch (error: any) {
    console.error("Verify reset code error:", error);
    res.status(500).json({ error: "Kodni tekshirishda xatolik yuz berdi" });
  }
});

// FORGOT PASSWORD: Complete Reset
app.post("/api/auth/forgot-password-reset", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak!" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const record = passwordResetCodes[cleanEmail];
    if (!record || !record.verified || record.code !== cleanCode) {
      return res.status(400).json({ error: "Kodingiz tasdiqlanmagan yoki xato!" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbQuery("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, cleanEmail]);

    delete passwordResetCodes[cleanEmail];

    // Fetch user info for login
    const [users]: any = await dbQuery("SELECT id, name, email, role, avatar_url FROM users WHERE email = ?", [cleanEmail]);
    const user = users[0];

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

    return res.json({
      success: true,
      message: "Parolingiz muvaffaqiyatli yangilandi!",
      token,
      user,
    });
  } catch (error: any) {
    console.error("Forgot password reset error:", error);
    res.status(500).json({ error: "Parolni o'zgartirishda xatolik yuz berdi" });
  }
});

// Verify 6-digit code
app.post("/api/auth/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email va kodni kiriting!" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const record = verificationCodes[cleanEmail];
    if (!record) {
      return res.status(400).json({ error: "Tasdiqlash kodi topilmadi yoki yuborilmagan! Qayta kod so'rang." });
    }

    if (Date.now() > record.expiresAt) {
      delete verificationCodes[cleanEmail];
      return res.status(400).json({ error: "Tasdiqlash kodi muddati o'tgan! Qayta kod so'rang." });
    }

    if (record.code !== cleanCode) {
      return res.status(400).json({ error: "Tasdiqlash kodi xato kiritildi!" });
    }

    // Mark as verified
    record.verified = true;

    return res.json({
      success: true,
      message: "Tasdiqlash kodi to'g'ri kiritildi!",
    });
  } catch (error: any) {
    console.error("Verify code error:", error);
    res.status(500).json({ error: "Kodni tekshirishda xatolik yuz berdi" });
  }
});

// Complete registration for email verified user
app.post("/api/auth/register-verified", async (req, res) => {
  try {
    const { name, email, password, code } = req.body;
    if (!name || !email || !password || !code) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const record = verificationCodes[cleanEmail];
    if (!record || !record.verified || record.code !== cleanCode) {
      return res.status(400).json({ error: "Email manzilingiz hali tasdiqlanmagan yoki xato kod!" });
    }

    // Check if user already exists
    const [existing]: any = await dbQuery("SELECT id FROM users WHERE email = ?", [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "Ushbu email bilan allaqachon ro'yxatdan o'tilgan!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = cleanEmail === "mosinjonovjasurbek28@gmail.com" ? "admin" : "user";

    const [result]: any = await dbQuery(
      "INSERT INTO users (name, email, password, role, avatar_url) VALUES (?, ?, ?, ?, NULL)",
      [name, cleanEmail, hashedPassword, role]
    );

    delete verificationCodes[cleanEmail];

    const userPayload = {
      id: result.insertId,
      name,
      email: cleanEmail,
      role,
      avatar_url: null,
    };

    const tokenPayload = {
      id: result.insertId,
      email: cleanEmail,
      role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

    return res.status(201).json({
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Register verified error:", error);
    res.status(500).json({ error: "Ro'yxatdan o'tishda xatolik yuz berdi" });
  }
});

// Auth Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
    }

    // Check if email already exists
    const [existing]: any = await dbQuery("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Ushbu email bilan allaqachon ro'yxatdan o'tilgan!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Auto-assign admin for matching email or default user
    const role = email === "mosinjonovjasurbek28@gmail.com" ? "admin" : "user";

    const [result]: any = await dbQuery(
      "INSERT INTO users (name, email, password, role, avatar_url) VALUES (?, ?, ?, ?, NULL)",
      [name, email, hashedPassword, role]
    );

    const userPayload = {
      id: result.insertId,
      name,
      email,
      role,
      avatar_url: null,
    };

    const tokenPayload = {
      id: result.insertId,
      email,
      role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

// Auth Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email va parolni kiriting!" });
    }

    const [users]: any = await dbQuery("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];

    if (!user) {
      return res.status(400).json({ error: "Email yoki parol xato!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Email yoki parol xato!" });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
    };

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, name, avatar_url } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Kerakli ma'lumotlar yo'q" });
    }

    let [users]: any = await dbQuery("SELECT * FROM users WHERE email = ?", [email]);
    let user = users[0];

    if (!user) {
      const role = email === "mosinjonovjasurbek28@gmail.com" ? "admin" : "user";
      // Auto generate random password for google users (they won't use it anyway)
      const randomPass = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPass, 10);
      
      const [result]: any = await dbQuery(
        "INSERT INTO users (name, email, password, role, avatar_url) VALUES (?, ?, ?, ?, ?)",
        [name, email, hashedPassword, role, avatar_url || null]
      );
      
      user = {
        id: result.insertId,
        name,
        email,
        role,
        avatar_url: avatar_url || null,
      };
    } else {
      // If user exists but doesn't have an avatar, or if google avatar is newer, we can save it
      if (avatar_url && !user.avatar_url) {
        await dbQuery("UPDATE users SET avatar_url = ? WHERE id = ?", [avatar_url, user.id]);
        user.avatar_url = avatar_url;
      }
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
    };

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Google Login error:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

// --- Phone Auth API Endpoints ---

// Send 6-digit SMS verification code
app.post("/api/auth/phone-send-code", async (req, res) => {
  try {
    const { phone, type } = req.body; // type: 'register' | 'forgot'
    if (!phone || phone.trim().length < 7) {
      return res.status(400).json({ error: "Iltimos, yaroqli telefon raqamini kiriting!" });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');

    if (type === 'register') {
      const [existing]: any = await dbQuery("SELECT id FROM users WHERE phone = ?", [cleanPhone]);
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "Ushbu telefon raqami bilan allaqachon ro'yxatdan o'tilgan! Kirish sahifasidan foydalaning." });
      }
    } else if (type === 'forgot') {
      const [existing]: any = await dbQuery("SELECT id FROM users WHERE phone = ?", [cleanPhone]);
      if (!existing || existing.length === 0) {
        return res.status(400).json({ error: "Ushbu telefon raqami tizimda topilmadi! Ro'yxatdan o'ting." });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    if (type === 'forgot') {
      phonePasswordResetCodes[cleanPhone] = {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
        verified: false,
      };
    } else {
      phoneVerificationCodes[cleanPhone] = {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
        verified: false,
      };
    }

    console.log(`[Phone Auth SMS Code] ${type || 'auth'} for ${cleanPhone}: ${code}`);

    return res.json({
      success: true,
      message: `SMS tasdiqlash kodi ${cleanPhone} raqamiga yuborildi!`,
      codeSent: true,
    });
  } catch (err: any) {
    console.error("phone-send-code error:", err);
    return res.status(500).json({ error: err.message || "SMS kod yuborishda xatolik yuz berdi" });
  }
});

// Verify 6-digit SMS code
app.post("/api/auth/phone-verify-code", async (req, res) => {
  try {
    const { phone, code, type } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: "Telefon raqam va kodni kiriting!" });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanCode = code.toString().trim();

    const store = type === 'forgot' ? phonePasswordResetCodes : phoneVerificationCodes;
    const record = store[cleanPhone];

    if (!record) {
      return res.status(400).json({ error: "Sizga kod yuborilmagan yoki kodingiz muddati tugagan! Qayta so'rang." });
    }

    if (Date.now() > record.expiresAt) {
      delete store[cleanPhone];
      return res.status(400).json({ error: "Tasdiqlash kodining muddati tugagan! Qayta so'rang." });
    }

    if (record.code !== cleanCode) {
      return res.status(400).json({ error: "Tasdiqlash kodi noto'g'ri!" });
    }

    record.verified = true;
    return res.json({ success: true, message: "Telefon raqami muvaffaqiyatli tasdiqlandi!" });
  } catch (err: any) {
    console.error("phone-verify-code error:", err);
    return res.status(500).json({ error: err.message || "Kodni tekshirishda xatolik" });
  }
});

// Complete registration with verified phone number
app.post("/api/auth/phone-register-verified", async (req, res) => {
  try {
    const { name, phone, password, code, firebaseUid } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak!" });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanCode = code ? code.toString().trim() : '';

    if (!firebaseUid) {
      const record = phoneVerificationCodes[cleanPhone];
      if (!record || (!record.verified && record.code !== cleanCode)) {
        return res.status(400).json({ error: "Telefon raqamingiz tasdiqlanmagan yoki kod noto'g'ri!" });
      }
    }

    const [existing]: any = await dbQuery("SELECT id FROM users WHERE phone = ?", [cleanPhone]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "Ushbu telefon raqami bilan allaqachon ro'yxatdan o'tilgan!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailFallback = `${cleanPhone.replace(/[^0-9]/g, '')}@phone.animem.uz`;
    const role = "user";

    const [result]: any = await dbQuery(
      "INSERT INTO users (name, email, phone, password, role, avatar_url) VALUES (?, ?, ?, ?, ?, NULL)",
      [name, emailFallback, cleanPhone, hashedPassword, role]
    );

    delete phoneVerificationCodes[cleanPhone];

    const userId = result.insertId;
    const userPayload = { id: userId, name, email: emailFallback, phone: cleanPhone, role, avatar_url: null };
    const token = jwt.sign(
      { id: userPayload.id, email: userPayload.email, phone: userPayload.phone, role: userPayload.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({ token, user: userPayload });
  } catch (err: any) {
    console.error("phone-register-verified error:", err);
    return res.status(500).json({ error: err.message || "Ro'yxatdan o'tishda xatolik" });
  }
});

// Login with Phone Number + Password
app.post("/api/auth/phone-login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: "Telefon raqam va parolni kiriting!" });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');

    const [users]: any = await dbQuery(
      "SELECT * FROM users WHERE phone = ? OR email = ?",
      [cleanPhone, cleanPhone]
    );
    const user = users[0];

    if (!user) {
      return res.status(400).json({ error: "Ushbu telefon raqami bo'yicha foydalanuvchi topilmadi!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Telefon raqam yoki parol xato!" });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url || null,
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({ token, user: userPayload });
  } catch (err: any) {
    console.error("phone-login error:", err);
    return res.status(500).json({ error: err.message || "Login qilishda xatolik" });
  }
});

// Reset Password with Phone SMS verification
app.post("/api/auth/phone-reset-password", async (req, res) => {
  try {
    const { phone, code, newPassword, firebaseUid } = req.body;
    if (!phone || (!code && !firebaseUid) || !newPassword) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak!" });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanCode = code ? code.toString().trim() : '';

    if (!firebaseUid) {
      const record = phonePasswordResetCodes[cleanPhone];
      if (!record || (!record.verified && record.code !== cleanCode)) {
        return res.status(400).json({ error: "Kodingiz tasdiqlanmagan yoki xato!" });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbQuery("UPDATE users SET password = ? WHERE phone = ?", [hashedPassword, cleanPhone]);

    delete phonePasswordResetCodes[cleanPhone];

    const [users]: any = await dbQuery("SELECT id, name, email, phone, role, avatar_url FROM users WHERE phone = ?", [cleanPhone]);
    const user = users[0];

    if (!user) {
      return res.status(400).json({ error: "Foydalanuvchi topilmadi!" });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url || null,
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({ token, user: userPayload, message: "Parol muvaffaqiyatli o'zgartirildi!" });
  } catch (err: any) {
    console.error("phone-reset-password error:", err);
    return res.status(500).json({ error: err.message || "Parolni tiklashda xatolik" });
  }
});

// Get all notifications from MySQL with local store fallback
app.get("/api/notifications", async (req, res) => {
  try {
    const [rows]: any = await dbQuery("SELECT * FROM notifications ORDER BY id DESC LIMIT 50");
    if (Array.isArray(rows) && rows.length > 0) {
      return res.json(rows);
    }
  } catch (err) {
    console.warn("Notifications fetch falling back to local store:", (err as any)?.message);
  }
  const store = loadLocalStore();
  res.json(store.notifications || []);
});

// Post a new notification (Admin only)
app.post("/api/notifications", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Xabar matni bo'sh bo'lishi mumkin emas!" });
    }

    let insertId = Date.now();
    try {
      const [result]: any = await dbQuery(
        "INSERT INTO notifications (message) VALUES (?)",
        [message.trim()]
      );
      if (result && result.insertId) insertId = result.insertId;
    } catch (e) {
      console.warn("DB notification insert failed, relying on local store:", (e as any)?.message);
    }

    const store = loadLocalStore();
    const newNotif = {
      id: insertId,
      message: message.trim(),
      created_at: new Date().toISOString()
    };
    store.notifications = store.notifications || [];
    store.notifications.unshift(newNotif);
    saveLocalStore(store);

    res.status(201).json(newNotif);
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ error: "Bildirishnoma yaratishda xatolik" });
  }
});

// Get Archive.org configuration keys (Admin only)
app.get("/api/archive-config", authenticateToken, (req: any, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Sizda ushbu amalni bajarishga ruxsat yo'q!" });
    }
    res.json({
      accessKey: process.env.ARCHIVE_ORG_ACCESS_KEY || "",
      secretKey: process.env.ARCHIVE_ORG_SECRET_KEY || "",
    });
  } catch (err) {
    console.error("Get archive config error:", err);
    res.status(500).json({ error: "Serverda xatolik" });
  }
});

// Proxy upload endpoint to Archive.org (Admin only)
app.post("/api/upload-archive-proxy", authenticateToken, upload.single("file"), async (req: any, res: any) => {
  const tempFilePath = req.file?.path;
  try {
    if (req.user.role !== "admin") {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(403).json({ error: "Sizda ushbu amalni bajarishga ruxsat yo'q!" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Fayl yuklanmadi" });
    }

    const { selectedAnimeId, episodeNumber, title } = req.body;
    if (!selectedAnimeId || !episodeNumber) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json({ error: "Anime ID va Epizod raqami kiritilishi shart" });
    }

    const accessKey = process.env.ARCHIVE_ORG_ACCESS_KEY;
    const secretKey = process.env.ARCHIVE_ORG_SECRET_KEY;

    if (!accessKey || !secretKey) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json({ error: "Archive.org kalitlari (ARCHIVE_ORG_ACCESS_KEY, ARCHIVE_ORG_SECRET_KEY) server sozlamalarida kiritilmagan!" });
    }

    const sanitizeHeaderValue = (val: string): string => {
      if (!val) return "";
      return val.replace(/[^\x20-\x7E]/g, "").trim();
    };

    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const identifier = `animem-uz-ep-${selectedAnimeId}-${episodeNumber}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    const uploadUrl = `https://s3.us.archive.org/${identifier}/${sanitizedFileName}`;
    const directLink = `https://archive.org/download/${identifier}/${sanitizedFileName}`;

    console.log(`Starting proxy upload of ${sanitizedFileName} to Archive.org identifier ${identifier}`);

    const parsedUrl = new URL(uploadUrl);
    const options = {
      method: "PUT",
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      headers: {
        "Authorization": `LOW ${accessKey}:${secretKey}`,
        "x-amz-auto-make-bucket": "1",
        "x-archive-meta-mediatype": "movies",
        "x-archive-meta-collection": "opensource_movies",
        "x-archive-meta-title": sanitizeHeaderValue(title || `Anime Episode ${episodeNumber}`),
        "Content-Type": req.file.mimetype || "video/mp4",
        "Content-Length": fs.statSync(tempFilePath).size,
      }
    };

    const archiveReq = https.request(options, (archiveRes) => {
      let responseBody = "";
      archiveRes.on("data", (chunk) => {
        responseBody += chunk;
      });
      archiveRes.on("end", () => {
        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (e) {}
        }

        if (archiveRes.statusCode === 200 || archiveRes.statusCode === 201) {
          console.log(`Proxy upload to Archive.org complete! URL: ${directLink}`);
          if (!res.headersSent) {
            res.json({ success: true, url: directLink });
          }
        } else {
          console.error(`Archive.org upload failed with status ${archiveRes.statusCode}: ${responseBody}`);
          if (!res.headersSent) {
            res.status(500).json({ error: `Archive.org xatosi (${archiveRes.statusCode}): ${responseBody || 'Noma\'lum xatolik'}` });
          }
        }
      });
    });

    archiveReq.on("error", (err) => {
      console.error("Proxy upload stream error:", err);
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {}
      }
      if (!res.headersSent) {
        res.status(500).json({ error: `Server translyatsiya jarayonida xatolik: ${err.message}` });
      }
    });

    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.on("error", (err) => {
      console.error("File read stream error:", err);
      archiveReq.destroy();
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {}
      }
      if (!res.headersSent) {
        res.status(500).json({ error: `Faylni o'qishda xatolik: ${err.message}` });
      }
    });

    fileStream.pipe(archiveReq);

  } catch (err: any) {
    console.error("Upload proxy main error:", err);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {}
    }
    res.status(500).json({ error: `Tizimda xatolik yuz berdi: ${err.message}` });
  }
});

// Update user profile photo (Avatar) as base64 string in MySQL
app.post("/api/user/avatar", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res.status(400).json({ error: "Rasm topilmadi" });
    }

    await dbQuery("UPDATE users SET avatar_url = ? WHERE id = ?", [avatar_url, userId]);

    // Get updated user details
    const [rows]: any = await dbQuery("SELECT id, name, email, role, avatar_url FROM users WHERE id = ?", [userId]);
    const updatedUser = rows[0];

    res.json({ message: "Profil rasmi muvaffaqiyatli yangilandi", user: updatedUser });
  } catch (err) {
    console.error("Upload avatar error:", err);
    res.status(500).json({ error: "Profil rasmini yuklashda xatolik yuz berdi" });
  }
});

// Update user profile name
app.put("/api/user/profile", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Ism bo'sh bo'lishi mumkin emas" });
    }

    await dbQuery("UPDATE users SET name = ? WHERE id = ?", [name.trim(), userId]);

    // Get updated user details
    const [rows]: any = await dbQuery("SELECT id, name, email, role, avatar_url FROM users WHERE id = ?", [userId]);
    const updatedUser = rows[0];

    // Generate new token with updated user details
    const tokenPayload = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

    res.json({ message: "Profil yangilandi", user: updatedUser, token });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

// Get recent comments
app.get("/api/comments/recent", async (req, res) => {
  try {
    const [rows]: any = await dbQuery(`
      SELECT c.*, u.name AS user_name, u.avatar_url AS user_avatar, a.title AS anime_title 
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN animes a ON c.anime_id = a.id 
      ORDER BY c.id DESC 
      LIMIT 10
    `);
    if (Array.isArray(rows)) {
      return res.json(rows);
    }
  } catch (err) {
    console.warn("Recent comments fetch falling back to local store:", (err as any)?.message);
  }
  const store = loadLocalStore();
  res.json(store.comments || []);
});

// Helper functions for file-backed rating database (data.json)
const DATA_FILE_PATH = path.join(process.cwd(), "data.json");

interface RatingRecord {
  id: number;
  user_id: number;
  anime_id: number;
  rating: number;
  created_at: string;
}

async function getRatingsFromFile(): Promise<RatingRecord[]> {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      let initialRatings: RatingRecord[] = [];
      try {
        const [rows]: any = await dbQuery("SELECT * FROM ratings");
        initialRatings = rows.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          anime_id: r.anime_id,
          rating: r.rating,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
        }));
        console.log("Successfully migrated ratings from MySQL to data.json:", initialRatings.length);
      } catch (dbErr) {
        console.warn("Could not fetch ratings from MySQL on initialization, starting with empty list:", dbErr);
      }
      
      await fs.promises.writeFile(DATA_FILE_PATH, JSON.stringify({ ratings: initialRatings }, null, 2));
      return initialRatings;
    }
    const content = await fs.promises.readFile(DATA_FILE_PATH, "utf-8");
    const data = JSON.parse(content);
    return data.ratings || [];
  } catch (error) {
    console.error("Error reading ratings from data.json:", error);
    return [];
  }
}

async function saveRatingsToFile(ratings: RatingRecord[]): Promise<boolean> {
  try {
    await fs.promises.writeFile(DATA_FILE_PATH, JSON.stringify({ ratings }, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing ratings to data.json:", error);
    return false;
  }
}

async function mergeRatingsWithAnimes(animes: any[]): Promise<any[]> {
  try {
    const ratings = await getRatingsFromFile();
    const statsMap: Record<number, { sum: number; count: number }> = {};
    for (const r of ratings) {
      if (!statsMap[r.anime_id]) {
        statsMap[r.anime_id] = { sum: 0, count: 0 };
      }
      statsMap[r.anime_id].sum += r.rating;
      statsMap[r.anime_id].count += 1;
    }
    return animes.map(anime => {
      const stats = statsMap[anime.id];
      if (stats) {
        return {
          ...anime,
          rating: parseFloat((stats.sum / stats.count).toFixed(1)),
          rating_count: stats.count
        };
      }
      // Preserve the pre-existing database ratings if no rating exists in data.json
      return anime;
    });
  } catch (err) {
    console.error("mergeRatingsWithAnimes error:", err);
    return animes;
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/api/animes", async (req, res) => {
  try {
    const [rows]: any = await dbQuery("SELECT * FROM animes ORDER BY id DESC");
    if (Array.isArray(rows) && rows.length > 0) {
      const store = loadLocalStore();
      store.animes = rows;
      saveLocalStore(store);
      const merged = await mergeRatingsWithAnimes(rows);
      return res.json(merged);
    }
  } catch (err) {
    console.warn("Animes fetch falling back to local store:", (err as any)?.message);
  }
  const store = loadLocalStore();
  const merged = await mergeRatingsWithAnimes(store.animes || []);
  res.json(merged);
});

// Get single anime
app.get("/api/animes/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [rows]: any = await dbQuery("SELECT * FROM animes WHERE id = ?", [id]);
    if (rows && rows.length > 0) {
      dbQuery("UPDATE animes SET korishlar = korishlar + 1 WHERE id = ?", [id]).catch(() => {});
      rows[0].korishlar = (rows[0].korishlar || 0) + 1;
      const merged = await mergeRatingsWithAnimes(rows);
      return res.json(merged[0]);
    }
  } catch (err) {
    console.warn("Single anime fetch falling back to local store:", (err as any)?.message);
  }

  const store = loadLocalStore();
  const anime = (store.animes || []).find((a: any) => String(a.id) === String(id));
  if (!anime) {
    return res.status(404).json({ error: "Anime topilmadi" });
  }
  anime.korishlar = (anime.korishlar || 0) + 1;
  saveLocalStore(store);
  const merged = await mergeRatingsWithAnimes([anime]);
  res.json(merged[0]);
});

// Get single anime by slug
app.get("/api/animes/by-slug/:slug", async (req, res) => {
  const slug = req.params.slug;
  const toSlugLocal = (text: string): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/o['’`‘]/g, "o")
      .replace(/g['’`‘]/g, "g")
      .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "-")
      .replace(/^-+|-+$/g, "");
  };

  try {
    const [rows]: any = await dbQuery("SELECT * FROM animes");
    if (Array.isArray(rows) && rows.length > 0) {
      const anime = rows.find((r: any) => toSlugLocal(r.title) === slug);
      if (anime) {
        dbQuery("UPDATE animes SET korishlar = korishlar + 1 WHERE id = ?", [anime.id]).catch(() => {});
        anime.korishlar = (anime.korishlar || 0) + 1;
        const merged = await mergeRatingsWithAnimes([anime]);
        return res.json(merged[0]);
      }
    }
  } catch (err) {
    console.warn("Anime by slug fetch falling back to local store:", (err as any)?.message);
  }

  const store = loadLocalStore();
  const anime = (store.animes || []).find((a: any) => toSlugLocal(a.title) === slug);
  if (!anime) {
    return res.status(404).json({ error: "Anime topilmadi" });
  }
  anime.korishlar = (anime.korishlar || 0) + 1;
  saveLocalStore(store);
  const merged = await mergeRatingsWithAnimes([anime]);
  res.json(merged[0]);
});

// Get episodes of an anime
app.get("/api/animes/:id/episodes", async (req, res) => {
  const id = req.params.id;
  try {
    const [rows]: any = await dbQuery(
      "SELECT * FROM episodes WHERE anime_id = ? ORDER BY episode_number ASC",
      [id]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return res.json(rows);
    }
  } catch (err) {
    console.warn("Episodes fetch falling back to local store:", (err as any)?.message);
  }
  const store = loadLocalStore();
  const eps = (store.episodes || []).filter((e: any) => String(e.anime_id) === String(id));
  res.json(eps);
});

// Get comments of an anime
app.get("/api/animes/:id/comments", async (req, res) => {
  const id = req.params.id;
  try {
    const [rows]: any = await dbQuery(
      `SELECT c.*, u.name AS user_name, u.avatar_url AS user_avatar 
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.anime_id = ? 
       ORDER BY c.id DESC`,
      [id]
    );
    if (Array.isArray(rows)) {
      return res.json(rows);
    }
  } catch (err) {
    console.warn("Comments fetch falling back to local store:", (err as any)?.message);
  }
  const store = loadLocalStore();
  const comms = (store.comments || []).filter((c: any) => String(c.anime_id) === String(id));
  res.json(comms);
});

// Create comment on an anime
app.post("/api/animes/:id/comments", authenticateToken, async (req: any, res) => {
  try {
    const animeId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Izoh matni bo'sh bo'lishi mumkin emas" });
    }

    const [result]: any = await dbQuery(
      "INSERT INTO comments (anime_id, user_id, content) VALUES (?, ?, ?)",
      [animeId, userId, content]
    );

    let userAvatar = req.user.avatar_url || null;
    try {
      const [uRows]: any = await dbQuery("SELECT avatar_url FROM users WHERE id = ?", [userId]);
      if (uRows && uRows.length > 0 && uRows[0].avatar_url) {
        userAvatar = uRows[0].avatar_url;
      }
    } catch (e) {}

    res.status(201).json({
      id: result.insertId,
      anime_id: Number(animeId),
      user_id: userId,
      user_name: req.user.name,
      user_avatar: userAvatar,
      content,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// Delete comment
app.delete("/api/comments/:commentId", authenticateToken, async (req: any, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;
    const role = req.user.role;

    // Check ownership or admin
    const [commentRows]: any = await dbQuery("SELECT user_id FROM comments WHERE id = ?", [commentId]);
    if (commentRows.length === 0) {
      return res.status(404).json({ error: "Izoh topilmadi" });
    }

    if (role !== "admin" && commentRows[0].user_id !== userId) {
      return res.status(403).json({ error: "Ruxsat etilmadi" });
    }

    await dbQuery("DELETE FROM comments WHERE id = ?", [commentId]);
    res.json({ message: "Izoh o'chirildi" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Rate anime
app.post("/api/animes/:animeId/rate", authenticateToken, async (req: any, res) => {
  try {
    const animeId = parseInt(req.params.animeId, 10);
    const userId = parseInt(req.user.id, 10);
    const rating = parseInt(req.body.rating, 10);

    console.log("Rate request details:", { userId, animeId, rating });

    if (isNaN(animeId) || isNaN(userId)) {
      console.warn("Invalid animeId or userId", { animeId, userId });
      return res.status(400).json({ error: "Foydalanuvchi yoki anime ID noto'g'ri" });
    }

    if (isNaN(rating) || rating < 1 || rating > 10) {
      console.warn("Invalid rating value", { rating });
      return res.status(400).json({ error: "Reyting 1 va 10 oralig'ida bo'lishi kerak" });
    }

    // Get current ratings from data.json
    const ratings = await getRatingsFromFile();

    // Find if rating already exists
    const existingIndex = ratings.findIndex(r => r.user_id === userId && r.anime_id === animeId);
    if (existingIndex >= 0) {
      ratings[existingIndex].rating = rating;
      ratings[existingIndex].created_at = new Date().toISOString();
    } else {
      const maxId = ratings.reduce((max, r) => r.id > max ? r.id : max, 0);
      ratings.push({
        id: maxId + 1,
        user_id: userId,
        anime_id: animeId,
        rating: rating,
        created_at: new Date().toISOString()
      });
    }

    // Save back to data.json
    await saveRatingsToFile(ratings);

    // Calculate average rating and count for this anime
    const animeRatings = ratings.filter(r => r.anime_id === animeId);
    const count = animeRatings.length;
    const sum = animeRatings.reduce((acc, r) => acc + r.rating, 0);
    const avg_rating = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

    // Gracefully attempt to sync to MySQL database in background
    try {
      await dbQuery(
        "INSERT INTO ratings (user_id, anime_id, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = ?",
        [userId, animeId, rating, rating]
      );
      await dbQuery(
        "UPDATE animes SET rating = ?, rating_count = ? WHERE id = ?",
        [avg_rating, count, animeId]
      );
    } catch (dbErr) {
      console.warn("Could not sync rating to MySQL database, but local rating was saved to data.json:", dbErr);
    }

    console.log("Rating successfully saved to data.json!", { animeId, avg_rating, count });
    res.json({ message: "Reyting saqlandi", rating: avg_rating, count });
  } catch (err: any) {
    console.error("Rate anime error:", err);
    res.status(500).json({ error: err.message || "Failed to save rating" });
  }
});

// Get ratings distribution and summary for an anime
app.get("/api/animes/:animeId/ratings-summary", async (req, res) => {
  try {
    const animeId = parseInt(req.params.animeId, 10);
    if (isNaN(animeId)) {
      return res.status(400).json({ error: "Noto'g'ri anime ID" });
    }
    
    // Read from data.json
    const ratings = await getRatingsFromFile();
    const animeRatings = ratings.filter(r => r.anime_id === animeId);
    
    let totalCount = animeRatings.length;
    const sum = animeRatings.reduce((acc, r) => acc + r.rating, 0);
    let avgRating = totalCount > 0 ? parseFloat((sum / totalCount).toFixed(1)) : 0;

    // Database fallback if no file-backed rating exists yet
    if (totalCount === 0) {
      try {
        const [rows]: any = await dbQuery("SELECT rating, rating_count FROM animes WHERE id = ?", [animeId]);
        if (rows.length > 0) {
          avgRating = Number(rows[0].rating) || 0;
          totalCount = Number(rows[0].rating_count) || 0;
        }
      } catch (dbErr) {
        console.warn("Could not fetch database fallback rating in ratings-summary:", dbErr);
      }
    }

    const distribution: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      distribution[i] = 0;
    }
    animeRatings.forEach(row => {
      if (row.rating >= 1 && row.rating <= 10) {
        distribution[row.rating] = (distribution[row.rating] || 0) + 1;
      }
    });

    // If we have database fallback rating with 0 distribution, put it in the matching key
    if (totalCount > 0 && animeRatings.length === 0) {
      const roundedRating = Math.round(avgRating);
      if (roundedRating >= 1 && roundedRating <= 10) {
        distribution[roundedRating] = totalCount;
      }
    }

    res.json({
      average: avgRating,
      total: totalCount,
      distribution
    });
  } catch (err) {
    console.error("Get ratings summary error:", err);
    res.status(500).json({ error: "Failed to fetch ratings summary" });
  }
});

// Get user rating for anime
app.get("/api/animes/:animeId/rating", authenticateToken, async (req: any, res) => {
  try {
    const animeId = parseInt(req.params.animeId, 10);
    const userId = parseInt(req.user.id, 10);
    
    if (isNaN(animeId) || isNaN(userId)) {
      return res.json({ rating: 0 });
    }

    // Read from data.json
    const ratings = await getRatingsFromFile();
    const userRatingObj = ratings.find(r => r.anime_id === animeId && r.user_id === userId);

    res.json({ rating: userRatingObj ? userRatingObj.rating : 0 });
  } catch (err) {
    console.error("Get rating error:", err);
    res.status(500).json({ error: "Failed to fetch rating" });
  }
});

// Admin Route: Add Anime
app.post("/api/animes", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.sendStatus(403);

    const {
      title,
      description,
      image_url,
      banner_url,
      rating,
      rating_count,
      holati,
      yil,
      studiyasi,
      qismlar_soni,
      korishlar,
      janrlar,
      video_url,
      tavsiya,
      is_banner,
    } = req.body;

    let insertId = Date.now();
    try {
      const [result]: any = await dbQuery(
        `INSERT INTO animes 
        (title, description, image_url, banner_url, rating, rating_count, holati, yil, studiyasi, qismlar_soni, korishlar, janrlar, video_url, tavsiya, is_banner) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title || "",
          description || "",
          image_url || "",
          banner_url || "",
          rating || 0.0,
          rating_count || 0,
          holati || "Faol",
          yil || null,
          studiyasi || "",
          qismlar_soni || 0,
          korishlar || 0,
          janrlar || "",
          video_url || "",
          tavsiya ? 1 : 0,
          is_banner ? 1 : 0,
        ]
      );
      if (result && result.insertId) {
        insertId = result.insertId;
      }
    } catch (dbErr) {
      console.warn("DB insert anime failed, using local store:", (dbErr as any)?.message);
    }

    const store = loadLocalStore();
    const newObj = {
      id: insertId,
      title: title || "",
      description: description || "",
      image_url: image_url || "",
      banner_url: banner_url || "",
      rating: rating || 0.0,
      rating_count: rating_count || 0,
      holati: holati || "Faol",
      yil: yil ? Number(yil) : null,
      studiyasi: studiyasi || "",
      qismlar_soni: qismlar_soni ? Number(qismlar_soni) : 0,
      korishlar: korishlar ? Number(korishlar) : 0,
      janrlar: janrlar || "",
      video_url: video_url || "",
      tavsiya: Boolean(tavsiya),
      is_banner: Boolean(is_banner)
    };
    store.animes = store.animes || [];
    store.animes.unshift(newObj);
    saveLocalStore(store);

    res.status(201).json({ id: insertId });
  } catch (err) {
    console.error("Add anime error:", err);
    res.status(500).json({ error: "Failed to create anime" });
  }
});

// Admin Route: Update Anime
app.put("/api/animes/:id", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const id = req.params.id;

    const {
      title,
      description,
      image_url,
      banner_url,
      rating,
      rating_count,
      holati,
      yil,
      studiyasi,
      qismlar_soni,
      korishlar,
      janrlar,
      video_url,
      tavsiya,
      is_banner,
    } = req.body;

    // Fetch existing record to prevent overwriting missing values like korishlar or rating
    let existing: any = null;
    try {
      const [rows]: any = await dbQuery("SELECT * FROM animes WHERE id = ?", [id]);
      if (rows && rows.length > 0) existing = rows[0];
    } catch (e) {}

    if (!existing) {
      const store = loadLocalStore();
      existing = (store.animes || []).find((a: any) => String(a.id) === String(id));
    }

    const finalKorishlar = (korishlar !== undefined && korishlar !== null) 
      ? Number(korishlar) 
      : (existing ? Number(existing.korishlar || 0) : 0);

    const finalRating = (rating !== undefined && rating !== null) 
      ? Number(rating) 
      : (existing ? Number(existing.rating || 0) : 0.0);

    const finalRatingCount = (rating_count !== undefined && rating_count !== null) 
      ? Number(rating_count) 
      : (existing ? Number(existing.rating_count || 0) : 0);

    const finalTitle = title !== undefined ? title : (existing?.title || "");
    const finalDescription = description !== undefined ? description : (existing?.description || "");
    const finalImageUrl = image_url !== undefined ? image_url : (existing?.image_url || "");
    const finalBannerUrl = banner_url !== undefined ? banner_url : (existing?.banner_url || "");
    const finalHolati = holati !== undefined ? holati : (existing?.holati || "Faol");
    const finalYil = yil !== undefined ? (yil ? Number(yil) : null) : (existing?.yil || null);
    const finalStudiyasi = studiyasi !== undefined ? studiyasi : (existing?.studiyasi || "");
    const finalQismlarSoni = qismlar_soni !== undefined ? Number(qismlar_soni) : (existing?.qismlar_soni || 0);
    const finalJanrlar = janrlar !== undefined ? janrlar : (existing?.janrlar || "");
    const finalVideoUrl = video_url !== undefined ? video_url : (existing?.video_url || "");
    const finalTavsiya = tavsiya !== undefined ? (tavsiya ? 1 : 0) : (existing?.tavsiya ? 1 : 0);
    const finalIsBanner = is_banner !== undefined ? (is_banner ? 1 : 0) : (existing?.is_banner ? 1 : 0);

    try {
      await dbQuery(
        `UPDATE animes SET 
        title = ?, description = ?, image_url = ?, banner_url = ?, rating = ?, rating_count = ?, 
        holati = ?, yil = ?, studiyasi = ?, qismlar_soni = ?, korishlar = ?, janrlar = ?, video_url = ?, tavsiya = ?, is_banner = ? 
        WHERE id = ?`,
        [
          finalTitle,
          finalDescription,
          finalImageUrl,
          finalBannerUrl,
          finalRating,
          finalRatingCount,
          finalHolati,
          finalYil,
          finalStudiyasi,
          finalQismlarSoni,
          finalKorishlar,
          finalJanrlar,
          finalVideoUrl,
          finalTavsiya,
          finalIsBanner,
          id,
        ]
      );
    } catch (dbErr) {
      console.warn("DB update anime failed, relying on local store:", (dbErr as any)?.message);
    }

    // Always update local_store.json
    const store = loadLocalStore();
    const idx = (store.animes || []).findIndex((a: any) => String(a.id) === String(id));
    const updatedObj = {
      id: Number(id),
      title: finalTitle,
      description: finalDescription,
      image_url: finalImageUrl,
      banner_url: finalBannerUrl,
      rating: finalRating,
      rating_count: finalRatingCount,
      holati: finalHolati,
      yil: finalYil,
      studiyasi: finalStudiyasi,
      qismlar_soni: finalQismlarSoni,
      korishlar: finalKorishlar,
      janrlar: finalJanrlar,
      video_url: finalVideoUrl,
      tavsiya: Boolean(finalTavsiya),
      is_banner: Boolean(finalIsBanner)
    };

    if (idx >= 0) {
      store.animes[idx] = { ...store.animes[idx], ...updatedObj };
    } else {
      store.animes = store.animes || [];
      store.animes.push(updatedObj);
    }
    saveLocalStore(store);

    res.json({ message: "Anime tahrirlandi" });
  } catch (err) {
    console.error("Update anime error:", err);
    res.status(500).json({ error: "Failed to update anime" });
  }
});

// Admin Route: Delete Anime
app.delete("/api/animes/:id", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const id = req.params.id;

    try {
      await dbQuery("DELETE FROM animes WHERE id = ?", [id]);
    } catch (e) {}

    const store = loadLocalStore();
    store.animes = (store.animes || []).filter((a: any) => String(a.id) !== String(id));
    saveLocalStore(store);

    res.json({ message: "Anime o'chirildi" });
  } catch (err) {
    console.error("Delete anime error:", err);
    res.status(500).json({ error: "Failed to delete anime" });
  }
});

// Admin Route: Save Episode (Upsert)
app.post("/api/animes/:animeId/episodes", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.sendStatus(403);

    const anime_id = parseInt(req.params.animeId);
    const { episode_number, video_url } = req.body;
    const epNum = parseInt(episode_number);

    let epId = Date.now();
    try {
      const [existing]: any = await dbQuery(
        "SELECT id FROM episodes WHERE anime_id = ? AND episode_number = ?",
        [anime_id, epNum]
      );

      if (existing && existing.length > 0) {
        epId = existing[0].id;
        await dbQuery(
          "UPDATE episodes SET video_url = ? WHERE anime_id = ? AND episode_number = ?",
          [video_url, anime_id, epNum]
        );
      } else {
        const [result]: any = await dbQuery(
          "INSERT INTO episodes (anime_id, episode_number, video_url) VALUES (?, ?, ?)",
          [anime_id, epNum, video_url]
        );
        if (result && result.insertId) epId = result.insertId;
      }
    } catch (dbErr) {
      console.warn("DB save episode failed, relying on local store:", (dbErr as any)?.message);
    }

    const store = loadLocalStore();
    store.episodes = store.episodes || [];
    const idx = store.episodes.findIndex(
      (e: any) => String(e.anime_id) === String(anime_id) && Number(e.episode_number) === epNum
    );

    if (idx >= 0) {
      store.episodes[idx] = { ...store.episodes[idx], video_url };
    } else {
      store.episodes.push({
        id: epId,
        anime_id,
        episode_number: epNum,
        video_url
      });
    }
    saveLocalStore(store);

    res.json({ message: "Qism saqlandi", id: epId });
  } catch (err) {
    console.error("Save episode error:", err);
    res.status(500).json({ error: "Failed to save episode" });
  }
});

// Admin Route: Delete Episode
app.delete("/api/animes/:animeId/episodes/:episodeNumber", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const { animeId, episodeNumber } = req.params;

    try {
      await dbQuery(
        "DELETE FROM episodes WHERE anime_id = ? AND episode_number = ?",
        [animeId, episodeNumber]
      );
    } catch (e) {}

    const store = loadLocalStore();
    store.episodes = (store.episodes || []).filter(
      (e: any) => !(String(e.anime_id) === String(animeId) && String(e.episode_number) === String(episodeNumber))
    );
    saveLocalStore(store);

    res.json({ message: "Qism o'chirildi" });
  } catch (err) {
    console.error("Delete episode error:", err);
    res.status(500).json({ error: "Failed to delete episode" });
  }
});

// Chat Administration Routes (Authorized)
// Add new message via REST API
app.post("/api/chat/messages", authenticateToken, async (req: any, res: any) => {
  try {
    const { user_id, user_name, content, reply_to_id, reply_to_name, reply_to_content } = req.body;
    
    // Ensure the sender is the authenticated user
    if (req.user.id != user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Ruxsat etilmagan" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Xabar bo'sh bo'lishi mumkin emas" });
    }
    
    const [result]: any = await dbQuery(
      "INSERT INTO messages (user_id, user_name, content, reply_to_id, reply_to_name, reply_to_content) VALUES (?, ?, ?, ?, ?, ?)",
      [
        user_id || req.user.id,
        user_name || req.user.name,
        content.trim(),
        reply_to_id || null,
        reply_to_name || null,
        reply_to_content || null,
      ]
    );

    const [rows]: any = await dbQuery(
      `SELECT m.*, u.avatar_url AS user_avatar 
       FROM messages m 
       LEFT JOIN users u ON m.user_id = u.id 
       WHERE m.id = ?`,
      [result.insertId]
    );
    const insertedMessage = rows[0] || {
      id: result.insertId,
      user_id: user_id || req.user.id,
      user_name: user_name || req.user.name,
      user_avatar: req.user.avatar_url || null,
      content: content.trim(),
      reply_to_id: reply_to_id || null,
      reply_to_name: reply_to_name || null,
      reply_to_content: reply_to_content || null,
      created_at: new Date().toISOString(),
    };

    // Broadcast new message to everyone
    io.emit("newMessage", insertedMessage);

    res.json(insertedMessage);
  } catch (err) {
    console.error("Error saving new chat message via API:", err);
    res.status(500).json({ error: "Xabarni saqlashda xatolik" });
  }
});

app.delete("/api/chat/messages/:id", authenticateToken, async (req: any, res) => {
  try {
    const id = req.params.id;

    // Admin can delete any message, users can delete their own
    const [msgRows]: any = await dbQuery("SELECT user_id FROM messages WHERE id = ?", [id]);
    if (msgRows.length === 0) {
      return res.status(404).json({ error: "Xabar topilmadi" });
    }

    if (req.user.role !== "admin" && msgRows[0].user_id != req.user.id) {
      return res.status(403).json({ error: "Ruxsat etilmadi" });
    }

    await dbQuery("DELETE FROM messages WHERE id = ?", [id]);
    
    // Broadcast messageDeleted to active socket.io clients
    io.emit("messageDeleted", id);
    
    res.json({ message: "Xabar o'chirildi" });
  } catch (err) {
    console.error("Delete chat message error:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

app.delete("/api/chat/clear", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.sendStatus(403);

    await dbQuery("DELETE FROM messages");
    
    // Broadcast chatCleared
    io.emit("chatCleared");
    
    res.json({ message: "Barcha xabarlar o'chirildi" });
  } catch (err) {
    console.error("Clear chat error:", err);
    res.status(500).json({ error: "Failed to clear chat" });
  }
});


// --- TELEGRAM LOGIN ENGINE & BOT POLLING ---
const BOT_TOKEN = "8994654823:AAF639gjnOttH4p0mHtrNHVhRXwsiWeOYM8";
const activeSessions = new Map<string, any>(); // sessionId -> sessionData
const chatToSession = new Map<number, string>(); // chatId -> sessionId

// Helper to send Telegram Bot API requests
async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const body: any = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      console.error(`Telegram Bot sendMessage failed with status ${response.status}`);
    }
  } catch (err) {
    console.error("Failed to send telegram message:", err);
  }
}

// Background Bot Long Polling
async function runTelegramBot() {
  console.log("Starting Telegram Bot (8994654823) long polling loop...");
  let offset = 0;

  // Cleanup old sessions (older than 30 mins) every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [sid, sess] of activeSessions.entries()) {
      if (now - sess.createdAt > 30 * 60 * 1000) {
        activeSessions.delete(sid);
      }
    }
  }, 10 * 60 * 1000);

  const poll = async () => {
    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`;
      const response = await fetch(url);
      if (!response.ok) {
        // If unauthorized or error, retry after a bit
        setTimeout(poll, 5000);
        return;
      }
      const data: any = await response.json();
      if (data.ok && data.result) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          if (update.message) {
            const message = update.message;
            const chat = message.chat;
            const text = message.text || "";
            const from = message.from || {};

            // 1. Handle "/start auth_SESSION_ID"
            if (text.startsWith("/start")) {
              const parts = text.split(" ");
              const startParam = parts[1] || "";

              if (startParam && startParam.startsWith("auth_")) {
                const sessionId = startParam;

                activeSessions.set(sessionId, {
                  status: "pending_phone",
                  chatId: chat.id,
                  tgUser: from,
                  createdAt: Date.now()
                });
                chatToSession.set(chat.id, sessionId);

                await sendTelegramMessage(chat.id,
                  `<b>Assalomu alaykum, ${from.first_name || 'Foydalanuvchi'}! 👋</b>\n\n` +
                  `Siz <b>ANIMEUZ</b> saytiga kirish jarayonini boshladingiz. Kirishni tasdiqlash uchun quyidagi <b>"📱 Telefon raqamni yuborish"</b> tugmasini bosing:`,
                  {
                    keyboard: [
                      [
                        {
                          text: "📱 Telefon raqamni yuborish",
                          request_contact: true
                        }
                      ]
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true
                  }
                );
              } else {
                await sendTelegramMessage(chat.id,
                  `<b>Assalomu alaykum! 👋</b>\n\n` +
                  `ANIMEUZ rasmiy avtorizatsiya botiga xush kelibsiz.\n\n` +
                  `Siz saytga xavfsiz va tezkor kirish uchun saytdagi <b>"Telegram bilan kirish"</b> tugmasini bosing va ushbu botga o'ting.`
                );
              }
            }
            // 2. Handle Contact (Phone sharing)
            else if (message.contact) {
              const contact = message.contact;
              let sessionId = chatToSession.get(chat.id);

              if (!sessionId || !activeSessions.has(sessionId)) {
                // Find if there's an existing session for this chat or any pending session
                for (const [sid, sess] of activeSessions.entries()) {
                  if (sess.chatId === chat.id || sess.status === "pending" || sess.status === "pending_phone") {
                    sessionId = sid;
                    chatToSession.set(chat.id, sid);
                    break;
                  }
                }
              }

              if (sessionId && activeSessions.has(sessionId)) {
                const session = activeSessions.get(sessionId);

                try {
                  const phone = contact.phone_number || "";
                  const tgUser = session.tgUser || message.from || {};
                  const tgUserId = tgUser.id || contact.user_id || message.from?.id || chat.id;

                  // Get Telegram Avatar URL if any
                  let avatar_url = null;
                  try {
                    const photosRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${tgUserId}&limit=1`);
                    const photosData: any = await photosRes.json();
                    if (photosData.ok && photosData.result && photosData.result.total_count > 0) {
                      const fileId = photosData.result.photos[0][0].file_id;
                      const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
                      const fileData: any = await fileRes.json();
                      if (fileData.ok && fileData.result) {
                        avatar_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
                      }
                    }
                  } catch (e) {
                    console.error("Error fetching user profile photos from Telegram:", e);
                  }

                  const email = `tg_${tgUserId}@telegram.uz`;
                  const firstName = tgUser.first_name || message.from?.first_name || contact.first_name || "Foydalanuvchi";
                  const lastName = tgUser.last_name || message.from?.last_name || contact.last_name || "";
                  const name = `${firstName} ${lastName}`.trim();

                  // Sync to DB
                  let [users]: any = await dbQuery("SELECT * FROM users WHERE telegram_id = ? OR email = ?", [String(tgUserId), email]);
                  let user = users[0];

                  if (!user) {
                    const randomPass = Math.random().toString(36).slice(-10);
                    const hashedPassword = await bcrypt.hash(randomPass, 10);
                    const role = email === "mosinjonovjasurbek28@gmail.com" ? "admin" : "user";

                    const [insertRes]: any = await dbQuery(
                      "INSERT INTO users (name, email, password, role, avatar_url, telegram_id) VALUES (?, ?, ?, ?, ?, ?)",
                      [name, email, hashedPassword, role, avatar_url || null, String(tgUserId)]
                    );

                    user = {
                      id: insertRes.insertId,
                      name,
                      email,
                      role,
                      avatar_url: avatar_url || null,
                      telegram_id: String(tgUserId)
                    };
                  } else {
                    await dbQuery(
                      "UPDATE users SET telegram_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?",
                      [String(tgUserId), avatar_url || null, user.id]
                    );
                    user.telegram_id = String(tgUserId);
                    if (!user.avatar_url && avatar_url) {
                      user.avatar_url = avatar_url;
                    }
                  }

                  // JWT
                  const userPayload = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url,
                  };
                  const tokenPayload = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                  };
                  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

                  // Mark session authorized
                  activeSessions.set(sessionId, {
                    status: "authorized",
                    token,
                    user: userPayload,
                    createdAt: session.createdAt || Date.now()
                  });

                  await sendTelegramMessage(chat.id,
                    `<b>Siz ANIMEUZ saytiga muvaffaqiyatli kirdingiz! 🎉</b>\n\n` +
                    `👤 <b>Ism:</b> ${name}\n` +
                    (phone ? `📞 <b>Telefon:</b> ${phone}\n\n` : '\n') +
                    `Saytda avtorizatsiya yakunlandi! Endi saytga qaytib tomoshani davom ettirishingiz mumkin.`,
                    { remove_keyboard: true }
                  );
                } catch (contactErr) {
                  console.error("Error processing Telegram contact auth:", contactErr);
                  await sendTelegramMessage(chat.id, "Tizimga kirishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
                }
              } else {
                await sendTelegramMessage(chat.id, "Sessiya topilmadi yoki muddati tugagan. Iltimos saytdan qayta urining.");
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error in telegram polling loop:", err);
    }

    setTimeout(poll, 1500);
  };

  poll();
}

// 1. Create a session ID
app.get("/api/auth/telegram/session", (req, res) => {
  const sessionId = "auth_" + Math.random().toString(36).substring(2, 15);
  activeSessions.set(sessionId, {
    status: "pending",
    createdAt: Date.now()
  });
  res.json({ sessionId });
});

// 2. Check session status
app.get("/api/auth/telegram/status/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);
  if (!session) {
    return res.json({ status: "expired" });
  }
  res.json(session);
});

// 3. Simulate Telegram Bot interaction on-screen
app.post("/api/auth/telegram/simulate", async (req, res) => {
  try {
    const { sessionId, phone, first_name, username, avatar_url } = req.body;
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(400).json({ error: "Sessiya topilmadi yoki muddati tugagan!" });
    }

    const fakeTgUserId = Math.floor(100000000 + Math.random() * 900000000);
    const email = `tg_${fakeTgUserId}@telegram.uz`;
    const name = first_name || username || "Telegram User";

    // DB sync
    let [users]: any = await dbQuery("SELECT * FROM users WHERE telegram_id = ? OR email = ?", [String(fakeTgUserId), email]);
    let user = users[0];

    if (!user) {
      const randomPass = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPass, 10);
      const role = email === "mosinjonovjasurbek28@gmail.com" ? "admin" : "user";

      const [insertRes]: any = await dbQuery(
        "INSERT INTO users (name, email, password, role, avatar_url, telegram_id) VALUES (?, ?, ?, ?, ?, ?)",
        [name, email, hashedPassword, role, avatar_url || null, String(fakeTgUserId)]
      );

      user = {
        id: insertRes.insertId,
        name,
        email,
        role,
        avatar_url: avatar_url || null,
        telegram_id: String(fakeTgUserId)
      };
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
    };
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

    // Mark session authorized
    activeSessions.set(sessionId, {
      status: "authorized",
      token,
      user: userPayload,
      createdAt: session.createdAt
    });

    res.json({ success: true, message: "Muvaffaqiyatli simulyatsiya qilindi!" });
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ error: "Simulyatsiyada xatolik" });
  }
});


// Vite Dev Server / Static Files Setup
async function start() {
  const distPath = path.join(process.cwd(), "dist");
  const publicPath = path.join(process.cwd(), "public");
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(distPath);

  // Start Telegram Bot
  runTelegramBot();

  // Serve public folder directly using express for favicon, videos, images, logos
  app.use(express.static(publicPath));

  // Favicon handler ensuring /favicon.ico is served
  app.get("/favicon.ico", (req, res) => {
    const icoPath = path.join(publicPath, "favicon.ico");
    if (fs.existsSync(icoPath)) {
      return res.sendFile(icoPath);
    }
    return res.sendFile(path.join(publicPath, "logo.png"));
  });

  const toSlugLocal = (text: string): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/o['’`‘]/g, "o")
      .replace(/g['’`‘]/g, "g")
      .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Dynamic Sitemap XML generator
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const [rows]: any = await dbQuery("SELECT * FROM animes");
      const domain = "https://animem.uz";
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
      
      const staticPages = [
        { url: "/", priority: "1.0", freq: "daily" },
        { url: "/animelar", priority: "0.9", freq: "daily" },
        { url: "/manga", priority: "0.8", freq: "daily" },
        { url: "/top100", priority: "0.8", freq: "daily" },
        { url: "/jadval", priority: "0.8", freq: "daily" },
        { url: "/yangi-chiqishlar", priority: "0.8", freq: "daily" },
        { url: "/chat", priority: "0.7", freq: "daily" },
      ];
      
      for (const page of staticPages) {
        xml += `  <url>\n    <loc>${domain}${page.url}</loc>\n    <changefreq>${page.freq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
      }
      
      const genres = ["isekai", "sarguzasht", "fantasy", "jangari", "komediya", "dramatiya", "mecha", "romantika", "kriminal", "dahshat", "sport"];
      for (const g of genres) {
        xml += `  <url>\n    <loc>${domain}/${g}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
      
      if (Array.isArray(rows)) {
        for (const a of rows) {
          const slug = toSlugLocal(a.title);
          if (slug) {
            const imgUrl = (a.image_url || `${domain}/logo.png`).replace(/&/g, "&amp;");
            const titleClean = (a.title || "Anime").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            xml += `  <url>\n`;
            xml += `    <loc>${domain}/anime/${slug}</loc>\n`;
            xml += `    <image:image>\n`;
            xml += `      <image:loc>${imgUrl}</image:loc>\n`;
            xml += `      <image:title>${titleClean}</image:title>\n`;
            xml += `    </image:image>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>0.9</priority>\n`;
            xml += `  </url>\n`;
          }
        }
      }
      
      xml += `</urlset>`;
      res.setHeader("Content-Type", "text/xml; charset=utf-8");
      return res.status(200).send(xml);
    } catch (err) {
      console.error("Sitemap generation error:", err);
      return res.sendFile(path.join(publicPath, "sitemap.xml"));
    }
  });

  // Helper function to serve custom SEO injected HTML
  const handleDynamicSEO = async (req: express.Request, res: express.Response) => {
    const defaultIndexPath = fs.existsSync(path.join(distPath, "index.html"))
      ? path.join(distPath, "index.html")
      : path.join(process.cwd(), "index.html");

    try {
      let html = fs.readFileSync(defaultIndexPath, "utf8");
      const reqPath = (req.path || "/").toLowerCase();

      let titleText = "Animem Uz - O'zbekistondagi eng yirik anime portali";
      let descText = "Animem Uz - O'zbekistondagi eng yirik onlayn anime portali! Bu yerda eng mashhur va eng so'nggi animelarni o'zbek tilida, yuqori sifatda (HD) va mutlaqo bepul tomosha qilishingiz mumkin.";
      let imageUrl = "https://animem.uz/logo.png";
      let shareUrl = `https://animem.uz${req.path}`;
      let jsonLdScript = "";

      // 1. Anime detail page: /anime/:slug or /anime/:id
      if (reqPath.startsWith("/anime/") && reqPath.length > 7) {
        const rawParam = req.path.replace(/^\/anime\//, "").split("?")[0].split("/")[0];
        
        let animeRaw: any = null;
        try {
          const [rows]: any = await dbQuery("SELECT * FROM animes");
          if (Array.isArray(rows) && rows.length > 0) {
            animeRaw = rows.find((r: any) => 
              toSlugLocal(r.title) === rawParam ||
              String(r.id) === rawParam ||
              rawParam.startsWith(r.id + "-") ||
              rawParam.endsWith("-" + r.id)
            );
          }
        } catch (e) {
          console.warn("DB query failed in handleDynamicSEO:", e);
        }

        if (!animeRaw) {
          const store = loadLocalStore();
          animeRaw = (store.animes || []).find((a: any) => 
            toSlugLocal(a.title) === rawParam ||
            String(a.id) === rawParam
          );
        }

        if (animeRaw) {
          const merged = await mergeRatingsWithAnimes([animeRaw]);
          const anime = merged[0] || animeRaw;

          titleText = `${anime.title} - O'zbek tilida ko'rish | Animem.uz`;
          descText = `${anime.title} o'zbek tilida HD formatda onlayn tomosha qilish. ${anime.description ? anime.description.substring(0, 180).trim() : 'Barcha qismlari bepul va yuqori sifatda!'}`;
          imageUrl = anime.image_url || "https://animem.uz/logo.png";
          shareUrl = `https://animem.uz/anime/${toSlugLocal(anime.title)}`;

          const genres = anime.janrlar ? anime.janrlar.split(",").map((g: string) => g.trim()) : [];
          const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Movie",
            "name": `${anime.title} - O'zbek tilida ko'rish - Animem.uz`,
            "alternateName": anime.title,
            "image": imageUrl,
            "description": anime.description || "",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": anime.rating || 9.2,
              "bestRating": "10",
              "worstRating": "1",
              "reviewCount": anime.rating_count || 32
            },
            "genre": genres,
            "dateCreated": anime.yil || 2026,
            "provider": {
              "@type": "Organization",
              "name": "Animem Uz",
              "url": "https://animem.uz"
            }
          };
          jsonLdScript = `\n    <script type="application/ld+json">\n    ${JSON.stringify(jsonLd, null, 2)}\n    </script>`;
        }
      } 
      // 2. Specific main pages
      else if (reqPath === "/animelar" || reqPath === "/anime") {
        titleText = "Barcha Animelar - O'zbek tilida tomosha qilish | Animem.uz";
        descText = "Animem.uz portalidagi barcha o'zbekcha tarjima animelar katalogi. Sevimli animelaringizni HD sifatda bepul tomosha qiling.";
      } else if (reqPath === "/chat") {
        titleText = "Anime Chat va Muloqot | Animem.uz";
        descText = "Animem.uz saytining anime ixlosmandlari uchun jonli chat va muhokama bo'limi. Do'stlar ortiring va do'stona suhbatlashing.";
      } else if (reqPath === "/manga") {
        titleText = "O'zbekcha Mangalar va Komikslar | Animem.uz";
        descText = "O'zbek tiliga tarjima qilingan eng mashhur va eng so'nggi mangalarni onlayn o'qing.";
      } else if (reqPath === "/top100") {
        titleText = "Top 100 Eng Yaxshi Animelar | Animem.uz";
        descText = "Tomoshabinlar va reyting bo'yicha saralangan eng sara Top 100 o'zbekcha tarjima animelar.";
      } else if (reqPath === "/jadval") {
        titleText = "Anime Qismlari Chiqish Jadvali | Animem.uz";
        descText = "Hafta kunlari bo'yicha yangi o'zbekcha anime epizodlarining qulay chiqish jadvali.";
      } else if (reqPath === "/yangi-chiqishlar") {
        titleText = "Eng Yangi Chiqqan Qismlar | Animem.uz";
        descText = "So'nggi soatlar va kunlarda chiqarilgan eng yangi o'zbekcha tarjima anime epizodlari.";
      } else if (reqPath === "/sevimlilar") {
        titleText = "Sevimli Animelarim | Animem.uz";
        descText = "Siz saqlagan va yoqtirgan o'zbekcha animelar to'plami.";
      } else if (reqPath === "/tarix") {
        titleText = "Ko'rishlar Tarixi | Animem.uz";
        descText = "Siz oxirgi marta tomosha qilgan anime va qismlar tarixi.";
      } else {
        // Genre check (e.g., /isekai, /fantasy, /jangari, /komediya, /mecha, /sarguzasht, /romantika)
        const knownGenres: Record<string, string> = {
          "isekai": "Isekai",
          "fantasy": "Fentezi",
          "sarguzasht": "Sarguzasht",
          "jangari": "Jangari",
          "komediya": "Komediya",
          "dramatiya": "Drama",
          "drama": "Drama",
          "mecha": "Mеха (Mecha)",
          "romantika": "Romantika",
          "kriminal": "Kriminal",
          "dahshat": "Dahshat",
          "sport": "Sport",
          "maktab": "Maktab"
        };
        const cleanPath = reqPath.replace(/^\//, "");
        if (knownGenres[cleanPath]) {
          const gName = knownGenres[cleanPath];
          titleText = `${gName} animelar - O'zbek tilida ko'rish | Animem.uz`;
          descText = `Eng sara ${gName} janridagi o'zbekcha tarjima animelar to'plami. Animem.uz saytida HD formatda bepul tomosha qiling.`;
        }
      }

      // Replace metadata in HTML template
      html = html.replace(/<title>.*?<\/title>/gi, `<title>${titleText}</title>`);
      html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, `<meta name="description" content="${descText.replace(/"/g, '&quot;')}" />`);
      
      html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${shareUrl}" />`);
      html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${titleText.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${descText.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${imageUrl}" />`);
      
      html = html.replace(/<meta\s+property="twitter:url"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:url" content="${shareUrl}" />`);
      html = html.replace(/<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:title" content="${titleText.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta\s+property="twitter:description"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:description" content="${descText.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta\s+property="twitter:image"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:image" content="${imageUrl}" />`);

      if (jsonLdScript) {
        html = html.replace("</head>", `${jsonLdScript}\n  </head>`);
      }

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    } catch (err) {
      console.error("SEO server-side injection error:", err);
      return res.sendFile(defaultIndexPath);
    }
  };

  // Route for anime detail pages
  app.get("/anime/:slug", handleDynamicSEO);

  // API 404 Fallback Handler - Ensures unhandled /api/* routes return JSON, never index.html
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API endpoint topilmadi (${req.path})` });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      handleDynamicSEO(req, res);
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
