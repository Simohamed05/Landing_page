import { getPool } from "./db.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email = "", password = "" } = req.body || {};

  if (!email.trim() || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  try {
    const pool = getPool();

    // Récupérer l'utilisateur
    const [rows] = await pool.query(
      "SELECT id, password_hash FROM users WHERE email = ?",
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // Comparer les mots de passe
    const validPassword = await bcrypt.compare(
      password,
      rows[0].password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // Login OK
    return res.status(200).json({
      success: true,
      userId: rows[0].id
    });

  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
}
