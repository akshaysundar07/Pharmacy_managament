// api/_db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // MUST come from Vercel
  ssl: { rejectUnauthorized: false }
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}
