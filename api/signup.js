import { getPool } from "./db.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name = "", email = "", password = "" } = req.body || {};

  // Validation simple
  if (!email.trim() || password.length < 6) {
    return res.status(400).json({
      message: "Email invalide ou mot de passe trop court (min 6 caractères)"
    });
  }

  try {
    const pool = getPool();

    // Vérifier si l'email existe déjà
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    // Hash du mot de passe
    const password_hash = await bcrypt.hash(password, 10);

    // Insertion utilisateur
    await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name.trim(), email.trim(), password_hash]
    );

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
}
