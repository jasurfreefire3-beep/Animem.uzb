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
app.use(cors());
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
    const [rows]: any = await pool.query(
      "SELECT * FROM messages ORDER BY id DESC LIMIT 50"
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

      
      const [result]: any = await pool.query(
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

      const insertedMessage = {
        id: result.insertId,
        user_id,
        user_name,
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

// Auth Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring!" });
    }

    // Check if email already exists
    const [existing]: any = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Ushbu email bilan allaqachon ro'yxatdan o'tilgan!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Auto-assign admin for matching email or default user
    const role = email === "mosinjonovjasurbek28@gmail.com" ? "admin" : "user";

    const [result]: any = await pool.query(
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

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "30d" });

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

    const [users]: any = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
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

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "30d" });

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

    let [users]: any = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    let user = users[0];

    if (!user) {
      const role = email === "mosinjonovjasurbek28@gmail.com" ? "admin" : "user";
      // Auto generate random password for google users (they won't use it anyway)
      const randomPass = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPass, 10);
      
      const [result]: any = await pool.query(
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
        await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatar_url, user.id]);
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

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Google Login error:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

// Get all notifications from MySQL
app.get("/api/notifications", async (req, res) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM notifications ORDER BY id DESC LIMIT 50");
    res.json(rows);
  } catch (err) {
    console.error("Notifications fetch error:", err);
    res.status(500).json({ error: "Bildirishnomalarni yuklashda xatolik" });
  }
});

// Post a new notification (Admin only)
app.post("/api/notifications", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Xabar matni bo'sh bo'lishi mumkin emas!" });
    }

    const [result]: any = await pool.query(
      "INSERT INTO notifications (message) VALUES (?)",
      [message.trim()]
    );

    res.status(201).json({
      id: result.insertId,
      message: message.trim(),
      created_at: new Date()
    });
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

    await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatar_url, userId]);

    // Get updated user details
    const [rows]: any = await pool.query("SELECT id, name, email, role, avatar_url FROM users WHERE id = ?", [userId]);
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

    await pool.query("UPDATE users SET name = ? WHERE id = ?", [name.trim(), userId]);

    // Get updated user details
    const [rows]: any = await pool.query("SELECT id, name, email, role, avatar_url FROM users WHERE id = ?", [userId]);
    const updatedUser = rows[0];

    // Generate new token with updated user details
    const token = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: "30d" });

    res.json({ message: "Profil yangilandi", user: updatedUser, token });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

// Get recent comments
app.get("/api/comments/recent", async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT c.*, u.name AS user_name, a.title AS anime_title 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      JOIN animes a ON c.anime_id = a.id 
      ORDER BY c.id DESC 
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    console.error("Recent comments fetch error:", err);
    res.status(500).json({ error: "Failed to fetch recent comments" });
  }
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
        const [rows]: any = await pool.query("SELECT * FROM ratings");
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
    const [rows]: any = await pool.query("SELECT * FROM animes ORDER BY id DESC");
    const merged = await mergeRatingsWithAnimes(rows);
    res.json(merged);
  } catch (err) {
    console.error("Animes fetch error:", err);
    res.status(500).json({ error: "Failed to fetch animes" });
  }
});

// Get single anime
app.get("/api/animes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows]: any = await pool.query("SELECT * FROM animes WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Anime topilmadi" });
    }
    const merged = await mergeRatingsWithAnimes(rows);
    res.json(merged[0]);
  } catch (err) {
    console.error("Anime details fetch error:", err);
    res.status(500).json({ error: "Failed to fetch anime details" });
  }
});

// Get single anime by slug
app.get("/api/animes/by-slug/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const [rows]: any = await pool.query("SELECT * FROM animes");
    const toSlugLocal = (text: string): string => {
      if (!text) return "";
      return text
        .toLowerCase()
        .replace(/o['’`‘]/g, "o")
        .replace(/g['’`‘]/g, "g")
        .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "-")
        .replace(/^-+|-+$/g, "");
    };
    const anime = rows.find((r: any) => toSlugLocal(r.title) === slug);
    if (!anime) {
      return res.status(404).json({ error: "Anime topilmadi" });
    }
    const merged = await mergeRatingsWithAnimes([anime]);
    res.json(merged[0]);
  } catch (err) {
    console.error("Anime details by slug fetch error:", err);
    res.status(500).json({ error: "Failed to fetch anime details" });
  }
});

// Get episodes of an anime
app.get("/api/animes/:id/episodes", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows]: any = await pool.query(
      "SELECT * FROM episodes WHERE anime_id = ? ORDER BY episode_number ASC",
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Episodes fetch error:", err);
    res.status(500).json({ error: "Failed to fetch episodes" });
  }
});

// Get comments of an anime
app.get("/api/animes/:id/comments", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows]: any = await pool.query(
      `SELECT c.*, u.name AS user_name 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.anime_id = ? 
       ORDER BY c.id DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Comments fetch error:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
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

    const [result]: any = await pool.query(
      "INSERT INTO comments (anime_id, user_id, content) VALUES (?, ?, ?)",
      [animeId, userId, content]
    );

    res.status(201).json({
      id: result.insertId,
      anime_id: Number(animeId),
      user_id: userId,
      user_name: req.user.name,
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
    const [commentRows]: any = await pool.query("SELECT user_id FROM comments WHERE id = ?", [commentId]);
    if (commentRows.length === 0) {
      return res.status(404).json({ error: "Izoh topilmadi" });
    }

    if (role !== "admin" && commentRows[0].user_id !== userId) {
      return res.status(403).json({ error: "Ruxsat etilmadi" });
    }

    await pool.query("DELETE FROM comments WHERE id = ?", [commentId]);
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
      await pool.query(
        "INSERT INTO ratings (user_id, anime_id, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = ?",
        [userId, animeId, rating, rating]
      );
      await pool.query(
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
        const [rows]: any = await pool.query("SELECT rating, rating_count FROM animes WHERE id = ?", [animeId]);
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

    const [result]: any = await pool.query(
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

    res.status(201).json({ id: result.insertId });
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

    await pool.query(
      `UPDATE animes SET 
      title = ?, description = ?, image_url = ?, banner_url = ?, rating = ?, rating_count = ?, 
      holati = ?, yil = ?, studiyasi = ?, qismlar_soni = ?, korishlar = ?, janrlar = ?, video_url = ?, tavsiya = ?, is_banner = ? 
      WHERE id = ?`,
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
        id,
      ]
    );

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

    await pool.query("DELETE FROM animes WHERE id = ?", [id]);
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

    // Check if episode already exists
    const [existing]: any = await pool.query(
      "SELECT id FROM episodes WHERE anime_id = ? AND episode_number = ?",
      [anime_id, parseInt(episode_number)]
    );

    if (existing.length > 0) {
      await pool.query(
        "UPDATE episodes SET video_url = ? WHERE anime_id = ? AND episode_number = ?",
        [video_url, anime_id, parseInt(episode_number)]
      );
      res.json({ message: "Qism yangilandi", id: existing[0].id });
    } else {
      const [result]: any = await pool.query(
        "INSERT INTO episodes (anime_id, episode_number, video_url) VALUES (?, ?, ?)",
        [anime_id, parseInt(episode_number), video_url]
      );
      res.status(201).json({ message: "Qism yaratildi", id: result.insertId });
    }
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

    await pool.query(
      "DELETE FROM episodes WHERE anime_id = ? AND episode_number = ?",
      [animeId, episodeNumber]
    );
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
    
    const [result]: any = await pool.query(
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

    const [rows]: any = await pool.query("SELECT * FROM messages WHERE id = ?", [result.insertId]);
    const insertedMessage = rows[0];

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
    const [msgRows]: any = await pool.query("SELECT user_id FROM messages WHERE id = ?", [id]);
    if (msgRows.length === 0) {
      return res.status(404).json({ error: "Xabar topilmadi" });
    }

    if (req.user.role !== "admin" && msgRows[0].user_id != req.user.id) {
      return res.status(403).json({ error: "Ruxsat etilmadi" });
    }

    await pool.query("DELETE FROM messages WHERE id = ?", [id]);
    
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

    await pool.query("DELETE FROM messages");
    
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
              const sessionId = chatToSession.get(chat.id);

              if (sessionId && activeSessions.has(sessionId)) {
                const session = activeSessions.get(sessionId);

                if (session.status === "pending_phone") {
                  const phone = contact.phone_number;
                  const tgUser = session.tgUser || {};
                  const tgUserId = tgUser.id || contact.user_id;

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
                  const name = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : "");

                  // Sync to DB
                  let [users]: any = await pool.query("SELECT * FROM users WHERE telegram_id = ? OR email = ?", [String(tgUserId), email]);
                  let user = users[0];

                  if (!user) {
                    const randomPass = Math.random().toString(36).slice(-10);
                    const hashedPassword = await bcrypt.hash(randomPass, 10);
                    const role = email === "mosinjonovjasurbek28@gmail.com" ? "admin" : "user";

                    const [insertRes]: any = await pool.query(
                      "INSERT INTO users (name, email, password, role, avatar_url, telegram_id) VALUES (?, ?, ?, ?, ?, ?)",
                      [name, email, hashedPassword, role, avatar_url, String(tgUserId)]
                    );

                    user = {
                      id: insertRes.insertId,
                      name,
                      email,
                      role,
                      avatar_url,
                      telegram_id: String(tgUserId)
                    };
                  } else {
                    await pool.query(
                      "UPDATE users SET telegram_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?",
                      [String(tgUserId), avatar_url, user.id]
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
                  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "30d" });

                  // Mark session authorized
                  activeSessions.set(sessionId, {
                    status: "authorized",
                    token,
                    user: userPayload,
                    createdAt: session.createdAt
                  });

                  await sendTelegramMessage(chat.id,
                    `<b>Siz ANIMEUZ saytiga muvaffaqiyatli kirdingiz! 🎉</b>\n\n` +
                    `👤 <b>Ism:</b> ${name}\n` +
                    `📞 <b>Telefon:</b> ${phone}\n\n` +
                    `Saytda avtorizatsiya yakunlandi! Endi saytga qaytib tomoshani davom ettirishingiz mumkin.`,
                    { remove_keyboard: true }
                  );
                }
              } else {
                await sendTelegramMessage(chat.id, "Sessiya topilmadi yoki muddati tugagan.");
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
    let [users]: any = await pool.query("SELECT * FROM users WHERE telegram_id = ? OR email = ?", [String(fakeTgUserId), email]);
    let user = users[0];

    if (!user) {
      const randomPass = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPass, 10);
      const role = email === "mosinjonovjasurbek28@gmail.com" ? "admin" : "user";

      const [insertRes]: any = await pool.query(
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
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "30d" });

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

  // Serve public folder directly using express for faster video loading and range requests
  app.use(express.static(publicPath));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
