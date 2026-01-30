import { getPool } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { name = "", email = "", business = "", message = "" } = req.body || {};
  if (!email.trim()) return res.status(400).json({ message: "Email required" });

  try {
    const pool = getPool();
    await pool.query(
      "INSERT INTO demos (name, email, business, message) VALUES (?, ?, ?, ?)",
      [name.trim(), email.trim(), business.trim(), message.trim()]
    );
    return res.status(200).json({ success: true });
  } } catch (e) {
  return res.status(500).json({
    message: "DB error",
    detail: e.message,
    code: e.code || null
  });
}

}

