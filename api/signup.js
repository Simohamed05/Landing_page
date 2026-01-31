import { sql } from "./db.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { name = "", email = "", password = "" } = req.body || {};
  const cleanEmail = String(email).trim().toLowerCase();

  if (!cleanEmail || password.length < 6) {
    return res.status(400).json({
      ok: false,
      message: "Invalid email or password too short"
    });
  }

  try {
    // ✅ PostgreSQL-safe check
    const result = await sql`
      SELECT id FROM users WHERE email = ${cleanEmail} LIMIT 1
    `;

    if (result.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "Email already used"
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name || null}, ${cleanEmail}, ${password_hash})
    `;

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("SIGNUP DB ERROR:", e);
    return res.status(500).json({
      ok: false,
      message: "DB error"
    });
  }
}
