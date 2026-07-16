import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
  connectionLimit: 10,
  queueLimit: 0,
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
    connection.release();
  } catch (err) {
    console.error("Database connection failed on startup:", err);
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
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    const userPayload = {
      id: result.insertId,
      name,
      email,
      role,
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
    const { email, name } = req.body;
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
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role]
      );
      
      user = {
        id: result.insertId,
        name,
        email,
        role,
      };
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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

// Get all animes
app.get("/api/animes", async (req, res) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM animes ORDER BY id DESC");
    res.json(rows);
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
    res.json(rows[0]);
  } catch (err) {
    console.error("Anime details fetch error:", err);
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

    const anime_id = req.params.animeId;
    const { episode_number, video_url } = req.body;

    // Check if episode already exists
    const [existing]: any = await pool.query(
      "SELECT id FROM episodes WHERE anime_id = ? AND episode_number = ?",
      [anime_id, episode_number]
    );

    if (existing.length > 0) {
      await pool.query(
        "UPDATE episodes SET video_url = ? WHERE anime_id = ? AND episode_number = ?",
        [video_url, anime_id, episode_number]
      );
      res.json({ message: "Qism yangilandi", id: existing[0].id });
    } else {
      const [result]: any = await pool.query(
        "INSERT INTO episodes (anime_id, episode_number, video_url) VALUES (?, ?, ?)",
        [anime_id, episode_number, video_url]
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


// Vite Dev Server / Static Files Setup
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
