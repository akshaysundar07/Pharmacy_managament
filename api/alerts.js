// api/alerts.js
import { query } from "./_db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check for low stock (< 10 units)
    const lowStock = await query(
      "SELECT medicine_id, name, stock_quantity FROM pharmacy.medicines WHERE stock_quantity < 10"
    );

    // Check for expired medicines
    const expired = await query(
      "SELECT medicine_id, name, expiry_date FROM pharmacy.medicines WHERE expiry_date < CURRENT_DATE"
    );

    return res.status(200).json({
      lowStock,
      expired
    });
  } catch (err) {
    console.error("❌ Alerts API error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
