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

async function run() {
  try {
    const [tables]: any = await pool.query("SHOW TABLES");
    console.log("Tables:", tables);
    for (const t of tables) {
      const tableName = Object.values(t)[0] as string;
      const [columns] = await pool.query(`DESCRIBE ${tableName}`);
      console.log(`Table ${tableName}:`, columns);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

run();
