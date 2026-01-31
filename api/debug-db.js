import { getPool } from "./db.js";

export default async function handler(req, res) {
  try {
    const pool = await getPool();
    await pool.query("SELECT 1");
    res.status(200).json({ ok: true, message: "DB CONNECTED" });
  } catch (e) {
    res.status(200).json({ ok: false, message: e.message, code: e.code || null });
  }
}
