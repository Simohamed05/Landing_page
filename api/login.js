import { sql } from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email = "", password = "" } = req.body || {};
  const cleanEmail = String(email).trim().toLowerCase();

  if (!cleanEmail || !password) {
    return res.status(400).json({ message: "Missing email/password" });
  }

  const ip =
    (req.headers["x-forwarded-for"]?.toString().split(",")[0] || "").trim() ||
    req.socket?.remoteAddress ||
    null;

  const ua = String(req.headers["user-agent"] || "").slice(0, 255);

  try {
    const result = await sql`
      SELECT id, name, email, password_hash, role
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1
    `;

    if (result.rowCount === 0) {
      await sql`
        INSERT INTO login_logs (user_id, email, success, ip, user_agent)
        VALUES (${null}, ${cleanEmail}, ${false}, ${ip}, ${ua})
      `;
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);

    await sql`
      INSERT INTO login_logs (user_id, email, success, ip, user_agent)
      VALUES (${user.id}, ${cleanEmail}, ${ok}, ${ip}, ${ua})
    `;

    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET missing in env" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      ok: true,
      token,
      redirectTo: "https://ventespro.streamlit.app"
    });
  } catch (e) {
    return res.status(500).json({ message: "DB error", detail: e.message });
  }
}
