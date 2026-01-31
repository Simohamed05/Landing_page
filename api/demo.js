import { sql } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name = "", email = "", business = "", message = "" } = req.body || {};
  if (!String(email).trim()) {
    return res.status(400).json({ message: "Email required" });
  }

  try {
    await sql`
      INSERT INTO demos (name, email, business, message)
      VALUES (${name.trim()}, ${email.trim()}, ${business.trim()}, ${message.trim()})
    `;
    return res.status(200).json({ ok: true });
  } catch (e) {
    // IMPORTANT : on renvoie le detail pour diagnostiquer si besoin
    return res.status(500).json({
      ok: false,
      message: "DB error",
      detail: e.message
    });
  }
}
