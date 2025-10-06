// api/admin/login.js
import { query } from "../_db.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Method not allowed" });
  }

  const { username, password } = req.body;
  try {
    console.log("🔑 Admin login attempt:", username);

    // Direct plain-text check
    const rows = await query(
      "SELECT * FROM pharmacy.admins WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ msg: "Invalid username or password" });
    }

    const admin = rows[0];
    const token = jwt.sign(
      { id: admin.admin_id, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ msg: "Login successful", token });
  } catch (err) {
    console.error("❌ Admin login error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
