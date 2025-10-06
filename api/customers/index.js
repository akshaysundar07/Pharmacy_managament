import { query } from "../_db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      console.log("📦 Fetching all customers...");
      const rows = await query("SELECT * FROM pharmacy.customers");
      res.status(200).json(rows);
    } catch (err) {
      console.error("❌ Customers GET Error:", err.message);
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  } 
  
  else if (req.method === "POST") {
    const { name, phone_number, email } = req.body;
    try {
      console.log("📝 Inserting new customer:", name);
      const rows = await query(
            "INSERT INTO pharmacy.customers (name, phone_number, email) VALUES ($1, $2, $3) RETURNING *",
            [name, phone_number, email]
    );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("❌ Customers POST Error:", err.message);
      res.status(400).json({ error: "Insert failed", details: err.message });
    }
  } 
  
  else {
    res.status(405).json({ msg: "Method not allowed" });
  }
}
