import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";
import admin from "firebase-admin";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

dotenv.config();

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId
  });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "anime_super_secret_key";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db.fr-pari1.bengt.wasmernet.com",
  port: Number(process.env.DB_PORT) || 10272,
  user: process.env.DB_USER || "user_b1d5fdb1",
  password: process.env.DB_PASSWORD || "pw_7GNRdocASAIUzobl5Ezatle9fwRC3oYq",
  database: process.env.DB_NAME || "dataanime",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initDb() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS animes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        banner_url VARCHAR(255),
        rating FLOAT DEFAULT 0,
        rating_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS episodes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        anime_id INT NOT NULL,
        episode_number INT NOT NULL,
        video_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        anime_id INT,
        user_id INT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (anime_id) REFERENCES animes(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        user_name VARCHAR(255),
        content TEXT,
        reply_to_id INT DEFAULT NULL,
        reply_to_name VARCHAR(255) DEFAULT NULL,
        reply_to_content TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await connection.query("ALTER TABLE messages ADD COLUMN reply_to_id INT DEFAULT NULL");
    } catch (e) {}
    try {
      await connection.query("ALTER TABLE messages ADD COLUMN reply_to_name VARCHAR(255) DEFAULT NULL");
    } catch (e) {}
    try {
      await connection.query("ALTER TABLE messages ADD COLUMN reply_to_content TEXT DEFAULT NULL");
    } catch (e) {}
    connection.release();
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

initDb();

// --- Auth Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Helper to resolve anime ID from parameter (numeric ID or title slug)
async function getAnimeIdFromParam(param: string): Promise<number | null> {
  if (/^\d+$/.test(param)) {
    return parseInt(param);
  }
  const [allAnimes]: any = await pool.query("SELECT id, title FROM animes");
  const toSlugHelper = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/o['’`‘]/g, "o")
      .replace(/g['’`‘]/g, "g")
      .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "-")
      .replace(/^-+|-+$/g, "");
  };
  const matched = allAnimes.find((a: any) => toSlugHelper(a.title) === param);
  return matched ? matched.id : null;
}

app.get("/api/animes/:id/episodes", async (req, res) => {
  try {
    const animeId = await getAnimeIdFromParam(req.params.id);
    if (!animeId) return res.status(404).json({ error: "Anime not found" });
    const [rows]: any = await pool.query("SELECT * FROM episodes WHERE anime_id = ? ORDER BY episode_number ASC", [animeId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch episodes" });
  }
});

app.post("/api/episodes", authenticateToken, async (req: any, res: any) => {
  try {
    const [users]: any = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    if (!users[0] || users[0].role !== "admin") return res.sendStatus(403);

    const { anime_id, episode_number, video_url } = req.body;
    const [existing]: any = await pool.query(
      "SELECT id FROM episodes WHERE anime_id = ? AND episode_number = ?", 
      [anime_id, episode_number]
    );

    if (existing.length > 0) {
      await pool.query(
        "UPDATE episodes SET video_url = ? WHERE anime_id = ? AND episode_number = ?",
        [video_url, anime_id, episode_number]
      );
      res.json({ success: true, message: "Episode updated successfully" });
    } else {
      const [result]: any = await pool.query(
        "INSERT INTO episodes (anime_id, episode_number, video_url) VALUES (?, ?, ?)",
        [anime_id, episode_number, video_url]
      );
      res.status(201).json({ id: result.insertId, success: true, message: "Episode created successfully" });
    }
  } catch (error) {
    console.error("Failed to save episode:", error);
    res.status(500).json({ error: "Failed to save episode" });
  }
});

app.delete("/api/episodes/:anime_id/:episode_number", authenticateToken, async (req: any, res: any) => {
  try {
    const [users]: any = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    if (!users[0] || users[0].role !== "admin") return res.sendStatus(403);

    const { anime_id, episode_number } = req.params;
    await pool.query(
      "DELETE FROM episodes WHERE anime_id = ? AND episode_number = ?",
      [anime_id, episode_number]
    );
    res.json({ success: true, message: "Episode deleted successfully" });
  } catch (error) {
    console.error("Failed to delete episode:", error);
    res.status(500).json({ error: "Failed to delete episode" });
  }
});


app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result]: any = await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users]: any = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(400).json({ error: "User not found" });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/firebase", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token);
    const email = decodedToken.email;
    const name = decodedToken.name || email?.split('@')[0] || "User";

    if (!email) return res.status(400).json({ error: "Email not found in token" });

    const [existingUsers]: any = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    let user = existingUsers[0];
    
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const [result]: any = await pool.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
      );
      user = { id: result.insertId, name, email, role: "user" };
    }
    
    const jwtToken = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET);
    res.json({ token: jwtToken, user: { id: user.id, name: user.name, role: user.role } });

  } catch (error) {
    console.error("Firebase auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

app.get("/api/animes", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM animes ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch animes" });
  }
});

app.post("/api/animes", authenticateToken, async (req: any, res: any) => {
  try {
    const [users]: any = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    if (!users[0] || users[0].role !== "admin") return res.sendStatus(403);

    const { title, description, image_url, banner_url, holati, yil, studiyasi, qismlar_soni, janrlar, video_url, tavsiya } = req.body;
    const [result]: any = await pool.query(
      "INSERT INTO animes (title, description, image_url, banner_url, holati, yil, studiyasi, qismlar_soni, janrlar, video_url, tavsiya) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [title, description, image_url, banner_url, holati || 'Faol', yil || null, studiyasi || null, qismlar_soni || 0, janrlar || null, video_url || null, tavsiya || false]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create anime" });
  }
});

app.put("/api/animes/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const [users]: any = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    if (!users[0] || users[0].role !== "admin") return res.sendStatus(403);

    const animeId = req.params.id;
    const { title, description, image_url, banner_url, holati, yil, studiyasi, qismlar_soni, janrlar, video_url, tavsiya } = req.body;

    await pool.query(
      `UPDATE animes SET 
        title = ?, 
        description = ?, 
        image_url = ?, 
        banner_url = ?, 
        holati = ?, 
        yil = ?, 
        studiyasi = ?, 
        qismlar_soni = ?, 
        janrlar = ?, 
        video_url = ?, 
        tavsiya = ?
      WHERE id = ?`,
      [
        title, 
        description, 
        image_url, 
        banner_url, 
        holati || 'Faol', 
        yil ? parseInt(yil) : null, 
        studiyasi || null, 
        qismlar_soni ? parseInt(qismlar_soni) : 0, 
        janrlar || null, 
        video_url || null, 
        tavsiya || false,
        animeId
      ]
    );

    res.json({ success: true, message: "Anime updated successfully" });
  } catch (error) {
    console.error("Failed to update anime:", error);
    res.status(500).json({ error: "Failed to update anime" });
  }
});

app.delete("/api/animes/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const [users]: any = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    if (!users[0] || users[0].role !== "admin") return res.sendStatus(403);

    const animeId = req.params.id;
    // Delete episodes first
    await pool.query("DELETE FROM episodes WHERE anime_id = ?", [animeId]);
    // Delete comments
    await pool.query("DELETE FROM comments WHERE anime_id = ?", [animeId]);
    // Delete anime
    await pool.query("DELETE FROM animes WHERE id = ?", [animeId]);

    res.json({ success: true, message: "Anime deleted successfully" });
  } catch (error) {
    console.error("Failed to delete anime:", error);
    res.status(500).json({ error: "Failed to delete anime" });
  }
});

app.get("/api/animes/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (/^\d+$/.test(idParam)) {
      const [rows]: any = await pool.query("SELECT * FROM animes WHERE id = ?", [idParam]);
      if (rows.length > 0) {
        return res.json(rows[0]);
      }
    }
    
    // Fallback: match by title slug
    const [allAnimes]: any = await pool.query("SELECT * FROM animes");
    const toSlugHelper = (text: string) => {
      if (!text) return "";
      return text
        .toLowerCase()
        .replace(/o['’`‘]/g, "o")
        .replace(/g['’`‘]/g, "g")
        .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "-")
        .replace(/^-+|-+$/g, "");
    };
    
    const matched = allAnimes.find((a: any) => toSlugHelper(a.title) === idParam);
    if (matched) {
      return res.json(matched);
    }
    
    res.status(404).json({ error: "Anime not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch anime" });
  }
});

app.get("/api/comments/recent", async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT comments.*, users.name as user_name, animes.title as anime_title, animes.id as anime_id
      FROM comments
      JOIN users ON comments.user_id = users.id
      JOIN animes ON comments.anime_id = animes.id
      ORDER BY comments.created_at DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch recent comments:", error);
    res.status(500).json({ error: "Failed to fetch recent comments" });
  }
});

app.get("/api/animes/:id/comments", async (req, res) => {
  try {
    const animeId = await getAnimeIdFromParam(req.params.id);
    if (!animeId) return res.status(404).json({ error: "Anime not found" });
    const [rows]: any = await pool.query(
      "SELECT comments.*, users.name as user_name FROM comments JOIN users ON comments.user_id = users.id WHERE anime_id = ? ORDER BY created_at DESC",
      [animeId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

app.post("/api/animes/:id/comments", authenticateToken, async (req: any, res: any) => {
  try {
    const animeId = await getAnimeIdFromParam(req.params.id);
    if (!animeId) return res.status(404).json({ error: "Anime not found" });
    const { content } = req.body;
    await pool.query(
      "INSERT INTO comments (anime_id, user_id, content) VALUES (?, ?, ?)",
      [animeId, req.user.id, content]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to post comment" });
  }
});

app.post("/api/animes/:id/rate", authenticateToken, async (req: any, res: any) => {
  try {
    const animeId = await getAnimeIdFromParam(req.params.id);
    if (!animeId) return res.status(404).json({ error: "Anime not found" });
    const { rating } = req.body; // 1 to 5
    const [anime]: any = await pool.query("SELECT rating, rating_count FROM animes WHERE id = ?", [animeId]);
    if (anime.length === 0) return res.status(404).json({ error: "Anime not found" });

    const currentRating = anime[0].rating;
    const currentCount = anime[0].rating_count;
    
    const newCount = currentCount + 1;
    const newRating = ((currentRating * currentCount) + rating) / newCount;

    await pool.query("UPDATE animes SET rating = ?, rating_count = ? WHERE id = ?", [newRating, newCount, animeId]);
    res.json({ success: true, rating: newRating });
  } catch (error) {
    res.status(500).json({ error: "Failed to rate" });
  }
});

// Dynamic XML Sitemap for SEO Indexing
app.get("/sitemap.xml", async (req, res) => {
  try {
    const [rows]: any = await pool.query("SELECT title, created_at FROM animes");
    const toSlugHelper = (text: string) => {
      if (!text) return "";
      return text
        .toLowerCase()
        .replace(/o['’`‘]/g, "o")
        .replace(/g['’`‘]/g, "g")
        .replace(/[^a-z0-9\u0400-\u04FF]+/gi, "-")
        .replace(/^-+|-+$/g, "");
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://animem.uz/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://animem.uz/animelar</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://animem.uz/jadval</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://animem.uz/yangi-chiqishlar</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://animem.uz/top100</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://animem.uz/chat</loc>
    <changefreq>always</changefreq>
    <priority>0.5</priority>
  </url>`;

    rows.forEach((anime: any) => {
      const slug = toSlugHelper(anime.title);
      const date = anime.created_at ? new Date(anime.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `
  <url>
    <loc>https://animem.uz/anime/${slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).send("Error generating sitemap");
  }
});

app.delete("/api/chat/clear", authenticateToken, async (req: any, res: any) => {
  try {
    const [users]: any = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    if (!users[0] || users[0].role !== "admin") return res.sendStatus(403);

    await pool.query("DELETE FROM messages");
    io.emit("chatCleared");
    res.json({ success: true, message: "Chat muvaffaqiyatli tozalandi" });
  } catch (error) {
    console.error("Failed to clear chat:", error);
    res.status(500).json({ error: "Failed to clear chat" });
  }
});

app.delete("/api/chat/messages/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const messageId = req.params.id;
    const [messages]: any = await pool.query("SELECT * FROM messages WHERE id = ?", [messageId]);
    if (messages.length === 0) return res.status(404).json({ error: "Message not found" });

    const message = messages[0];
    const [users]: any = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    const isAdmin = users[0] && users[0].role === "admin";

    if (message.user_id !== req.user.id && !isAdmin) {
      return res.sendStatus(403);
    }

    await pool.query("DELETE FROM messages WHERE id = ?", [messageId]);
    io.emit("messageDeleted", messageId);
    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Failed to delete message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

app.delete("/api/comments/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const commentId = req.params.id;
    const [comments]: any = await pool.query("SELECT * FROM comments WHERE id = ?", [commentId]);
    if (comments.length === 0) return res.status(404).json({ error: "Comment not found" });

    const comment = comments[0];
    const [users]: any = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    const isAdmin = users[0] && users[0].role === "admin";

    if (comment.user_id !== req.user.id && !isAdmin) {
      return res.sendStatus(403);
    }

    await pool.query("DELETE FROM comments WHERE id = ?", [commentId]);
    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// --- Socket.IO Chat ---
io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  // Send previous messages
  try {
    const [messages] = await pool.query("SELECT * FROM messages ORDER BY created_at ASC LIMIT 100");
    socket.emit("previousMessages", messages);
  } catch (e) {
    console.error("Failed to load messages", e);
  }

  socket.on("sendMessage", async (data) => {
    try {
      const { user_id, user_name, content, reply_to_id, reply_to_name, reply_to_content } = data;
      const [result]: any = await pool.query(
        "INSERT INTO messages (user_id, user_name, content, reply_to_id, reply_to_name, reply_to_content) VALUES (?, ?, ?, ?, ?, ?)",
        [user_id, user_name, content, reply_to_id || null, reply_to_name || null, reply_to_content || null]
      );
      
      const [newMsg]: any = await pool.query("SELECT * FROM messages WHERE id = ?", [result.insertId]);
      
      io.emit("newMessage", newMsg[0]);
    } catch (e) {
      console.error("Failed to save message", e);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// --- Vite Middleware ---
async function start() {
  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(distPath);

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
