// api/ping.js
import { query } from "./_db.js";

export default async function handler(req, res) {
  try {
    const dbCheck = await query("SELECT NOW()");
    res.status(200).json({
      msg: "✅ API is alive!",
      dbTime: dbCheck[0].now
    });
  } catch (err) {
    res.status(500).json({
      msg: "❌ API is alive but DB connection failed",
      error: err.message
    });
  }
}
