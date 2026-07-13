import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

const episodesEndpoint = `
app.get("/api/animes/:id/episodes", async (req, res) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM episodes WHERE anime_id = ? ORDER BY episode_number ASC", [req.params.id]);
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
    const [result]: any = await pool.query(
      "INSERT INTO episodes (anime_id, episode_number, video_url) VALUES (?, ?, ?)",
      [anime_id, episode_number, video_url]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create episode" });
  }
});
`;

if (!content.includes('/api/episodes')) {
  content = content.replace('// --- API Routes ---', '// --- API Routes ---\n' + episodesEndpoint);
  fs.writeFileSync('server.ts', content);
  console.log('Endpoints added');
} else {
  console.log('Endpoints already exist');
}
