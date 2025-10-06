-- Insert admin into Admins table
INSERT INTO pharmacy.admins (username, password)
VALUES ('admin', 'admin123');  -- ⚠️ In production, store hashed passwords

-- Insert some sample medicines
INSERT INTO pharmacy.medicines (name, category, manufacturer, price, stock_quantity, batch_no, expiry_date)
VALUES 
('Paracetamol', 'Painkiller', 'ABC Pharma', 20.00, 100, 'B001', '2026-12-31'),
('Amoxicillin', 'Antibiotic', 'XYZ Pharma', 50.00, 50, 'B002', '2025-11-30'),
('Cetirizine', 'Antihistamine', 'HealthCorp', 15.00, 200, 'B003', '2027-01-15'),
('Ibuprofen', 'Painkiller', 'MediCare', 25.00, 150, 'B004', '2026-06-30');
