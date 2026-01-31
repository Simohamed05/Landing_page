import { sql } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS demos (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        business VARCHAR(255),
        message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    return res.status(200).json({ ok: true, message: "migrated" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
}
