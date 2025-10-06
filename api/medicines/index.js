import { query } from "../_db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      console.log("📦 Fetching all medicines...");
      const rows = await query("SELECT * FROM pharmacy.medicines");
      res.status(200).json(rows);
    } catch (err) {
      console.error("❌ Medicines GET Error:", err.message);
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  } 
  
  else if (req.method === "POST") {
    const { name, category, manufacturer, price, stock_quantity, batch_no, expiry_date } = req.body;
    try {
      console.log("📝 Inserting new medicine:", name);
      const rows = await query(
        `INSERT INTO pharmacy.medicines (name, category, manufacturer, price, stock_quantity, batch_no, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, category, manufacturer, price, stock_quantity, batch_no, expiry_date]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("❌ Medicines POST Error:", err.message);
      res.status(400).json({ error: "Insert failed", details: err.message });
    }
  } 
  
  else {
    res.status(405).json({ msg: "Method not allowed" });
  }
}
