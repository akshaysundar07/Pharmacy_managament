// api/admin/register.js
import { query } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Method not allowed" });
  }

  const { username, password } = req.body;
  try {
    const result = await query(
      "INSERT INTO pharmacy.admins (username, password) VALUES ($1, $2) RETURNING admin_id",
      [username, password]
    );

    return res.status(201).json({ msg: "Admin registered", admin_id: result[0].admin_id });
  } catch (err) {
    console.error("❌ Admin register error:", err.message);
    return res.status(400).json({ error: err.message });
  }
}
