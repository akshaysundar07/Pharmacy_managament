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
    const { payment_method, customer_id, medicines } = req.body;
    try {
      if (!customer_id || !payment_method || !medicines?.length) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log("📝 Inserting new sale for customer:", customer_id);

      // Calculate total
      let total_amount = 0;
      for (const item of medicines) {
        const medRows = await query(
          "SELECT price FROM pharmacy.medicines WHERE medicine_id=$1",
          [item.medicine_id]
        );
        if (!medRows.length) {
          return res.status(400).json({ error: `Medicine ${item.medicine_id} not found` });
        }
        total_amount += medRows[0].price * item.quantity;
      }

      // Insert sale
      const saleRows = await query(
        `INSERT INTO pharmacy.sales (payment_method, date, total_amount, customer_id)
         VALUES ($1, CURRENT_DATE, $2, $3) RETURNING *`,
        [payment_method, total_amount, customer_id]
      );
      const sale = saleRows[0];

      // Insert sale items
      for (const item of medicines) {
        await query(
          `INSERT INTO pharmacy.sales_contains (sale_id, medicine_id, quantity)
           VALUES ($1, $2, $3)`,
          [sale.sale_id, item.medicine_id, item.quantity]
        );

        // Update stock
        await query(
          `UPDATE pharmacy.medicines
           SET stock_quantity = stock_quantity - $1
           WHERE medicine_id = $2`,
          [item.quantity, item.medicine_id]
        );
      }

      res.status(201).json({ msg: "Sale recorded", sale_id: sale.sale_id, total: total_amount });
    } catch (err) {
      console.error("❌ Sales POST Error:", err.message);
      res.status(400).json({ error: "Insert failed", details: err.message });
    }
  } 
  
  else {
    res.status(405).json({ msg: "Method not allowed" });
  }
}




