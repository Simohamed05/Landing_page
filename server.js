import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendDemoAutoReply } from "./mailer.js";
import nodemailer from "nodemailer";




// Par (si vous n'utilisez pas getPool, vous pouvez supprimer la seconde ligne)
import { db, getPool } from "./db.js";



const app = express();
app.use(cors());
app.use(express.json());
// ============================
// ADMIN KEY middleware
// ============================
function adminKey(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ message: "Unauthorized (admin key)" });
  }
  next();
}
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static site
app.use(express.static(path.join(__dirname, "public")));
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Missing email/password" });

  const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
  if (exists.length) return res.status(409).json({ message: "Email already used" });

  const password_hash = await bcrypt.hash(password, 12);

  await db.query(
    "INSERT INTO users (name, email, password_hash) VALUES (?,?,?)",
    [name || null, email, password_hash]
  );

  res.json({ ok: true });
});


// API: demo
app.post("/api/demo", async (req, res) => {
  const { name, email, business, message } = req.body || {};
  if (!name || !email || !business) {
    return res.status(400).json({ message: "Missing fields (name/email/business)" });
  }

  await db.query(
    "INSERT INTO demo_requests (name, email, business, message) VALUES (?,?,?,?)",
    [name, email, business, message || null]
  );

  res.json({ ok: true });
});



// API: login (demo)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Missing email/password" });

  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress;
  const ua = (req.headers["user-agent"] || "").toString().slice(0, 255);

  const [rows] = await db.query(
    "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
    [email]
  );

  // user not found => log failed
  if (!rows.length) {
    await db.query(
      "INSERT INTO login_logs (user_id, email, success, ip, user_agent) VALUES (NULL, ?, 0, ?, ?)",
      [email, ip || null, ua || null]
    );
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);

  // log attempt
  await db.query(
    "INSERT INTO login_logs (user_id, email, success, ip, user_agent) VALUES (?, ?, ?, ?, ?)",
    [user.id, email, ok ? 1 : 0, ip || null, ua || null]
  );

  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    ok: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// Fallback (optional): if you browse /login etc.
app.get("/api/me", auth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Admin: stats
app.get("/api/admin/stats", adminKey, async (req, res) => {
  const [[u]] = await db.query("SELECT COUNT(*) as total FROM users");
  const [[d]] = await db.query("SELECT COUNT(*) as total FROM demo_requests");
  const [[l]] = await db.query("SELECT COUNT(*) as total FROM login_logs");
  const [[ok]] = await db.query("SELECT COUNT(*) as total FROM login_logs WHERE success=1");
  res.json({
    users: u.total,
    demos: d.total,
    logins: l.total,
    login_success: ok.total
  });
});

// Admin: list users (signups)
app.get("/api/admin/users", adminKey, async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 500"
  );
  res.json(rows);
});

// Admin: list demo requests
app.get("/api/admin/demos", adminKey, async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, name, email, business, message, created_at FROM demo_requests ORDER BY created_at DESC LIMIT 500"
  );
  res.json(rows);
});

// Admin: list login logs
app.get("/api/admin/logins", adminKey, async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, user_id, email, success, ip, user_agent, created_at FROM login_logs ORDER BY created_at DESC LIMIT 500"
  );
  res.json(rows);
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running: http://localhost:${PORT}`));

// 1) Demander un code (email)
app.post("/api/password/forgot", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, message: "Email requis" });

  // Toujours répondre ok (anti-enumeration), mais on envoie seulement si user existe
  const [users] = await db.query("SELECT id, email FROM users WHERE email = ?", [email]);
  if (!users.length) return res.json({ ok: true });

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 chiffres
  const code_hash = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.query(
    "INSERT INTO password_resets (email, code_hash, expires_at) VALUES (?,?,?)",
    [email, code_hash, expires.toISOString()]
  );

  // Envoi email
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "VentesPro — Code de réinitialisation",
    text: `Votre code de vérification VentesPro est : ${code}\nIl expire dans 10 minutes.`,
  });

  res.json({ ok: true });
});

// 2) Vérifier le code
app.post("/api/password/verify", async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ ok: false, message: "Email + code requis" });

  const [rows] = await db.query(
    `SELECT id, code_hash, expires_at, used_at
     FROM password_resets
     WHERE email = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [email]
  );

  if (!rows.length) return res.status(400).json({ ok: false, message: "Code invalide" });

  const r = rows[0];
  if (r.used_at) return res.status(400).json({ ok: false, message: "Code déjà utilisé" });

  const exp = new Date(r.expires_at);
  if (Date.now() > exp.getTime()) return res.status(400).json({ ok: false, message: "Code expiré" });

  const ok = await bcrypt.compare(String(code), r.code_hash);
  if (!ok) return res.status(400).json({ ok: false, message: "Code invalide" });

  // Crée un token reset (15 min) lié à cet email + resetId
  const token = jwt.sign(
    { purpose: "pwd_reset", email, resetId: r.id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  res.json({ ok: true, token });
});

// 3) Changer le mot de passe
app.post("/api/password/reset", async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ ok: false, message: "Token + nouveau mot de passe requis" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ ok: false, message: "Mot de passe trop court (min 6)" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ ok: false, message: "Token invalide/expiré" });
  }

  if (payload.purpose !== "pwd_reset") {
    return res.status(401).json({ ok: false, message: "Token invalide" });
  }

  const { email, resetId } = payload;

  // Vérifie reset toujours valide et non utilisé
  const [rows] = await db.query(
    "SELECT id, expires_at, used_at FROM password_resets WHERE id = ? AND email = ?",
    [resetId, email]
  );
  if (!rows.length) return res.status(400).json({ ok: false, message: "Reset invalide" });

  const r = rows[0];
  if (r.used_at) return res.status(400).json({ ok: false, message: "Reset déjà utilisé" });

  const exp = new Date(r.expires_at);
  if (Date.now() > exp.getTime()) return res.status(400).json({ ok: false, message: "Reset expiré" });

  const password_hash = await bcrypt.hash(newPassword, 12);

  await db.query("UPDATE users SET password_hash = ? WHERE email = ?", [password_hash, email]);
  await db.query("UPDATE password_resets SET used_at = NOW() WHERE id = ?", [resetId]);

  res.json({ ok: true });
});

app.post("/api/demo", async (req, res) => {
  const { name, email, business, message } = req.body || {};
  if (!name || !email || !business) {
    return res.status(400).json({ message: "Missing fields (name/email/business)" });
  }

  await db.query(
    "INSERT INTO demo_requests (name, email, business, message) VALUES (?,?,?,?)",
    [name, email, business, message || null]
  );

  // ✅ auto reply email (ne bloque pas la réponse si l’email échoue)
  sendDemoAutoReply({ to: email, name, business })
    .catch((e) => console.error("Auto-reply failed:", e.message));

  res.json({ ok: true, message: "✅ Demande envoyée !" });
});

// après l’INSERT DB
sendDemoAutoReply({ to: email, name, business })
  .catch(err => console.error("Email failed:", err.message));
