import { query } from "../_db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      console.log("📦 Fetching all prescriptions...");
      const rows = await query("SELECT * FROM pharmacy.prescriptions");
      res.status(200).json(rows);
    } catch (err) {
      console.error("❌ Prescriptions GET Error:", err.message);
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  } 
  
  else if (req.method === "POST") {
    const { doctor_name, date_issued, customer_id, duration } = req.body;
    try {
      console.log("📝 Inserting new prescription for customer:", customer_id);
      const rows = await query(
        `INSERT INTO pharmacy.prescriptions (doctor_name, date_issued, customer_id, duration)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [doctor_name, date_issued, customer_id, duration]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("❌ Prescriptions POST Error:", err.message);
      res.status(400).json({ error: "Insert failed", details: err.message });
    }
  } 
  
  else {
    res.status(405).json({ msg: "Method not allowed" });
  }
}
