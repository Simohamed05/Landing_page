import { getPool } from "./db.js";

export default async function handler(req, res) {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return res.status(200).json({ ok: true, message: "DB connection OK" });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      message: e.message,
      code: e.code || null,
      errno: e.errno || null,
      sqlState: e.sqlState || null
    });
  }
}
