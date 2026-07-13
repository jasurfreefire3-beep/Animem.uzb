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

async function alterDb() {
  try {
    await pool.query(`
      ALTER TABLE animes 
      ADD COLUMN holati VARCHAR(50) DEFAULT 'Faol',
      ADD COLUMN yil INT,
      ADD COLUMN studiyasi VARCHAR(255),
      ADD COLUMN qismlar_soni INT DEFAULT 0,
      ADD COLUMN korishlar INT DEFAULT 0,
      ADD COLUMN janrlar VARCHAR(255),
      ADD COLUMN video_url VARCHAR(255),
      ADD COLUMN tavsiya BOOLEAN DEFAULT false
    `);
    console.log("Table altered successfully.");
  } catch (error) {
    console.error("Error altering table:", error);
  } finally {
    process.exit(0);
  }
}

alterDb();
