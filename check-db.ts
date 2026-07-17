import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db.fr-pari1.bengt.wasmernet.com",
  port: Number(process.env.DB_PORT) || 10272,
  user: process.env.DB_USER || "user_b1d5fdb1",
  password: process.env.DB_PASSWORD || "pw_7GNRdocASAIUzobl5Ezatle9fwRC3oYq",
  database: process.env.DB_NAME || "dataanime",
});

async function checkDb() {
  try {
    const [[{ count: animeCount }]]: any = await pool.query("SELECT COUNT(*) as count FROM animes");
    const [[{ count: episodeCount }]]: any = await pool.query("SELECT COUNT(*) as count FROM episodes");
    const [[{ count: notificationCount }]]: any = await pool.query("SELECT COUNT(*) as count FROM notifications");
    console.log({ animeCount, episodeCount, notificationCount });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkDb();
