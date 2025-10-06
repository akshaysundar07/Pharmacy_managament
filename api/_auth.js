// api/_auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Check if request is from admin
export function checkAdmin(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return { error: "Missing token" };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return { error: "Admins only" };
    }
    return { id: decoded.id }; // ✅ return admin ID
  } catch (err) {
    return { error: "Invalid token" };
  }
}
