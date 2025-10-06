// server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const cron = require("node-cron");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------
// JWT Config
// -----------------------
const JWT_SECRET = "super-secret-key"; // Change to process.env.JWT_SECRET in production

// -----------------------
// MySQL Connection Helper
// -----------------------
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "Bommisetty@123", // change if needed
    database: "pharmacy"
};

async function getDbConnection() {
    return await mysql.createConnection(dbConfig);
}

// -----------------------
// Admin-only middleware
// -----------------------
const adminRequired = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Missing token" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== "admin") return res.status(403).json({ msg: "Admins only" });
        req.adminId = decoded.id;
        next();
    } catch (err) {
        console.error("Auth error:", err);
        return res.status(401).json({ msg: "Invalid token" });
    }
};

// -----------------------
// Background Scheduler
// -----------------------
cron.schedule("*/5 * * * *", async () => {
    try {
        const db = await getDbConnection();

        const [lowStock] = await db.execute("SELECT * FROM Medicines WHERE Stock_Quantity < 10");
        if (lowStock.length > 0) console.log("[ALERT] Low stock medicines:", lowStock.map(m => m.Name));

        const today = new Date().toISOString().split("T")[0];
        const [expired] = await db.execute("SELECT * FROM Medicines WHERE Expiry_Date < ?", [today]);
        if (expired.length > 0) console.log("[ALERT] Expired medicines:", expired.map(m => m.Name));

        await db.end();
    } catch (err) {
        console.error("Cron error:", err);
    }
});

// -----------------------
// Test route
// -----------------------
app.get("/", (req, res) => {
    res.send("Express server is running!");
});

// -----------------------
// Admin Auth
// -----------------------
app.post("/api/admin/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashed = await bcrypt.hash(password, 10);
        const db = await getDbConnection();
        const [result] = await db.execute("INSERT INTO Admins (Username, Password) VALUES (?, ?)", [username, hashed]);
        await db.end();
        res.status(201).json({ msg: "Admin registered", admin_id: result.insertId });
    } catch (err) {
        console.error("Register error:", err);
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = await getDbConnection();
        const [admins] = await db.execute("SELECT * FROM Admins WHERE Username = ?", [username]);
        await db.end();

        if (admins.length === 0) {
            return res.status(401).json({ msg: "Invalid username or password" });
        }

        const admin = admins[0];
        const match = await bcrypt.compare(password, admin.Password);

        if (!match) {
            return res.status(401).json({ msg: "Invalid username or password" });
        }

        const token = jwt.sign({ id: admin.Admin_ID, role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
        return res.json({ msg: "Login successful", token });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// -----------------------
// Customers CRUD
// -----------------------
app.get("/api/customers", adminRequired, async (req, res) => {
    try {
        const db = await getDbConnection();
        const [customers] = await db.execute("SELECT * FROM Customers");
        await db.end();
        res.json(customers);
    } catch (err) {
        console.error("Customers fetch error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/customers", adminRequired, async (req, res) => {
    const { Name, Phone_Number, Email } = req.body;
    try {
        const db = await getDbConnection();
        const [result] = await db.execute(
            "INSERT INTO Customers (Name, Phone_Number, Email) VALUES (?, ?, ?)",
            [Name, Phone_Number, Email]
        );
        await db.end();
        res.status(201).json({ msg: "Customer added", customer_id: result.insertId });
    } catch (err) {
        console.error("Customer add error:", err);
        res.status(400).json({ error: err.message });
    }
});

// -----------------------
// Medicines CRUD
// -----------------------
app.get("/api/medicines", async (req, res) => {
    try {
        const db = await getDbConnection();
        const [medicines] = await db.execute("SELECT * FROM Medicines");
        await db.end();
        res.status(200).json(medicines);
    } catch (err) {
        console.error("Medicines fetch error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/medicines", adminRequired, async (req, res) => {
    const { Name, Category, Manufacturer, Price, Stock_Quantity, Batch_No, Expiry_Date } = req.body;
    try {
        const db = await getDbConnection();
        const [result] = await db.execute(
            "INSERT INTO Medicines (Name, Category, Manufacturer, Price, Stock_Quantity, Batch_No, Expiry_Date) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [Name, Category, Manufacturer, Price, Stock_Quantity, Batch_No, Expiry_Date]
        );
        await db.end();
        res.status(201).json({ msg: "Medicine added", medicine_id: result.insertId });
    } catch (err) {
        console.error("Medicine add error:", err);
        res.status(400).json({ error: err.message });
    }
});

// -----------------------
// Prescriptions CRUD
// -----------------------
app.post("/api/prescriptions", adminRequired, async (req, res) => {
    const data = req.body;
    try {
        const db = await getDbConnection();
        const [presResult] = await db.execute(
            "INSERT INTO Prescriptions (Doctor_Name, Date_Issued, Customer_ID, Duration) VALUES (?, ?, ?, ?)",
            [data.Doctor_Name, new Date().toISOString().split("T")[0], data.Customer_ID, data.Duration]
        );
        const prescriptionId = presResult.insertId;

        for (let med of data.medicines) {
            await db.execute(
                "INSERT INTO Prescription_Medicines (Prescription_ID, Medicine_ID, Dosage) VALUES (?, ?, ?)",
                [prescriptionId, med.Medicine_ID, med.Dosage]
            );
        }

        await db.end();
        res.status(201).json({ msg: "Prescription added", prescription_id: prescriptionId });
    } catch (err) {
        console.error("Prescription add error:", err);
        res.status(400).json({ error: err.message });
    }
});

app.get("/api/prescriptions", adminRequired, async (req, res) => {
    try {
        const db = await getDbConnection();
        const [prescriptions] = await db.execute(`
            SELECT p.Prescription_ID, p.Doctor_Name, p.Date_Issued, p.Duration, c.Name AS Customer_Name
            FROM Prescriptions p
            JOIN Customers c ON p.Customer_ID = c.Customer_ID
        `);

        for (let pres of prescriptions) {
            const [meds] = await db.execute(`
                SELECT m.Name AS Medicine_Name, pm.Dosage
                FROM Prescription_Medicines pm
                JOIN Medicines m ON pm.Medicine_ID = m.Medicine_ID
                WHERE pm.Prescription_ID = ?
            `, [pres.Prescription_ID]);
            pres.Medicines = meds;
            pres.Date_Issued = pres.Date_Issued.toISOString().split("T")[0];
        }

        await db.end();
        res.json(prescriptions);
    } catch (err) {
        console.error("Prescription fetch error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// -----------------------
// Sales
// -----------------------
app.post("/api/sales", adminRequired, async (req, res) => {
    const data = req.body;
    try {
        const db = await getDbConnection();
        let totalAmount = 0;

        // Calculate total
        for (let item of data.medicines) {
            const [medRows] = await db.execute("SELECT Stock_Quantity, Price FROM Medicines WHERE Medicine_ID=?", [item.Medicine_ID]);
            if (medRows.length === 0) return res.status(404).json({ error: "Medicine not found" });
            if (medRows[0].Stock_Quantity < item.Quantity) return res.status(400).json({ error: `Not enough stock for medicine ${item.Medicine_ID}` });
            totalAmount += parseFloat(medRows[0].Price) * parseInt(item.Quantity);
        }

        // Insert Sale
        const [saleResult] = await db.execute(
            "INSERT INTO Sales (Payment_Method, Date, Total_Amount, Customer_ID) VALUES (?, ?, ?, ?)",
            [data.Payment_Method, new Date().toISOString().split("T")[0], totalAmount, data.Customer_ID]
        );
        const saleId = saleResult.insertId;

        // Insert medicines into Sales_Contains and update stock
        for (let item of data.medicines) {
            const [priceRow] = await db.execute("SELECT Price FROM Medicines WHERE Medicine_ID=?", [item.Medicine_ID]);
            const price = priceRow[0].Price;
            await db.execute(
                "INSERT INTO Sales_Contains (Sale_ID, Medicine_ID, Unit_Price, Quantity) VALUES (?, ?, ?, ?)",
                [saleId, item.Medicine_ID, price, item.Quantity]
            );
            await db.execute("UPDATE Medicines SET Stock_Quantity = Stock_Quantity - ? WHERE Medicine_ID=?", [item.Quantity, item.Medicine_ID]);
        }

        await db.end();
        res.status(201).json({ msg: "Sale recorded", sale_id: saleId });
    } catch (err) {
        console.error("Sales error:", err);
        res.status(400).json({ error: err.message });
    }
});

// -----------------------
// Run Server
// -----------------------
const PORT = process.env.PORT || 5001; // use 5001 locally to avoid macOS conflict
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
