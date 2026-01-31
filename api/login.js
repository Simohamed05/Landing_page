// pages/api/login.js – exécute du côté serveur
import { sql } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { email = '', password = '' } = req.body;
  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail || !password) return res.status(400).json({ message: 'Missing email/password' });

  try {
    const result = await sql`SELECT id, name, email, password_hash, role FROM users WHERE email = ${cleanEmail} LIMIT 1`;
    if (!result.rowCount) {
      await sql`INSERT INTO login_logs (user_id, email, success) VALUES (${null}, ${cleanEmail}, ${false})`;
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordOK = await bcrypt.compare(String(password), user.password_hash);
    await sql`INSERT INTO login_logs (user_id, email, success) VALUES (${user.id}, ${cleanEmail}, ${passwordOK})`;
    if (!passwordOK) return res.status(401).json({ message: 'Invalid credentials' });

    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'JWT_SECRET missing in env' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ message: 'DB error', detail: e.message });
  }
}
