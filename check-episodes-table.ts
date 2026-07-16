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
    const [rows]: any = await pool.query("DESCRIBE episodes");
    console.log("Episodes table structure:", rows);
  } catch (err: any) {
    console.error(err.message);
  }
  process.exit(0);
}
run();
