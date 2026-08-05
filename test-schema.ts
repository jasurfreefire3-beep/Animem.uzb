import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "db.fr-pari1.bengt.wasmernet.com",
    port: Number(process.env.DB_PORT) || 10272,
    user: process.env.DB_USER || "user_b1d5fdb1",
    password: process.env.DB_PASSWORD || "pw_7GNRdocASAIUzobl5Ezatle9fwRC3oYq",
    database: process.env.DB_NAME || "dataanime",
  });
  console.log("Animes:");
  let [rows] = await pool.query("DESCRIBE animes");
  console.log(rows);
  console.log("Episodes:");
  [rows] = await pool.query("DESCRIBE episodes");
  console.log(rows);
  await pool.end();
}
run().catch(console.error);
