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

async function checkUser() {
  try {
    const [result] = await pool.query("SELECT * FROM users WHERE email = 'mosinjonovjasurbek28@gmail.com'");
    console.log("User:", result);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkUser();
