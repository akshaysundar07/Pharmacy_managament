import { query } from "../_db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      console.log("📦 Fetching all sales...");
      const rows = await query("SELECT * FROM pharmacy.sales");
      res.status(200).json(rows);
    } catch (err) {
      console.error("❌ Sales GET Error:", err.message);
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  } 
  
  else if (req.method === "POST") {
    const { payment_method, date, total_amount, customer_id } = req.body;
    try {
      console.log("📝 Inserting new sale for customer:", customer_id);
      const rows = await query(
        `INSERT INTO pharmacy.sales (payment_method, date, total_amount, customer_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [payment_method, date, total_amount, customer_id]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("❌ Sales POST Error:", err.message);
      res.status(400).json({ error: "Insert failed", details: err.message });
    }
  } 
  
  else {
    res.status(405).json({ msg: "Method not allowed" });
  }
}
