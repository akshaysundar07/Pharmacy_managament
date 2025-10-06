import { query } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ msg: "Method not allowed" });

  const { username, password } = req.body;
  try {
    console.log("📝 Registering new admin:", username);
    const rows = await query(
      "INSERT INTO pharmacy.admins (username, password) VALUES ($1, $2) RETURNING *",
      [username, password] // ⚠️ in production: hash password
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ Admin register error:", err.message);
    res.status(400).json({ error: "Insert failed", details: err.message });
  }
}
