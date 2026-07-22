import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db.fr-pari1.bengt.wasmernet.com",
  port: Number(process.env.DB_PORT) || 10272,
  user: process.env.DB_USER || "user_b1d5fdb1",
  password: process.env.DB_PASSWORD || "pw_7GNRdocASAIUzobl5Ezatle9fwRC3oYq",
  database: process.env.DB_NAME || "dataanime",
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function dbQuery<T = any>(sql: string, params?: any[], retries = 3): Promise<T> {
  try {
    const res = await pool.query(sql, params);
    return res as unknown as T;
  } catch (err: any) {
    if (retries > 0) {
      console.warn(`[DB Test] Retrying query after error: ${err.message} (${retries} left)`);
      await new Promise((r) => setTimeout(r, 500));
      return dbQuery<T>(sql, params, retries - 1);
    }
    throw err;
  }
}

async function checkDb() {
  try {
    const [animeRows]: any = await dbQuery("SELECT COUNT(*) as count FROM animes");
    const [episodeRows]: any = await dbQuery("SELECT COUNT(*) as count FROM episodes");
    const [notificationRows]: any = await dbQuery("SELECT COUNT(*) as count FROM notifications");
    console.log("SUCCESS:", { animeCount: animeRows[0].count, episodeCount: episodeRows[0].count, notificationCount: notificationRows[0].count });
  } catch (error) {
    console.error("FAIL:", error);
  } finally {
    process.exit(0);
  }
}

checkDb();
