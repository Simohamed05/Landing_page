import { sql } from "./db.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name = "", email = "", password = "" } = req.body || {};
  const cleanEmail = String(email).trim().toLowerCase();

  if (!cleanEmail || String(password).length < 6) {
    return res.status(400).json({ message: "Invalid email or password too short (min 6)" });
  }

  try {
    // check exists
    const { rowCount } = await sql`SELECT 1 FROM users WHERE email = ${cleanEmail}`;
    if (rowCount > 0) return res.status(409).json({ message: "Email already used" });

    const password_hash = await bcrypt.hash(String(password), 12);

    await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name.trim() || null}, ${cleanEmail}, ${password_hash})
    `;

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: "DB error", detail: e.message });
  }
}
