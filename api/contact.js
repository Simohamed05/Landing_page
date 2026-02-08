

// api/contact.js
import nodemailer from "nodemailer";
import { sql } from "./db.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, message: "Method not allowed" });

  try {
    const { name = "", email = "", subject = "", message = "" } = req.body || {};

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanSubject = String(subject).trim();
    const cleanMessage = String(message).trim();

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    // 1) Save to DB (contacts table must exist)
    await sql`
      INSERT INTO contacts (name, email, subject, message)
      VALUES (${cleanName}, ${cleanEmail}, ${cleanSubject}, ${cleanMessage})
    `;

    // 2) SMTP (Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;

    // Email to YOU
    await transporter.sendMail({
      from: fromEmail,
      to: supportEmail,
      subject: `📩 Nouveau message (Contact) — ${cleanSubject}`,
      text:
        `Nom: ${cleanName}\n` +
        `Email: ${cleanEmail}\n` +
        `Sujet: ${cleanSubject}\n\n` +
        `Message:\n${cleanMessage}\n`,
    });

    // Auto reply to user
    await transporter.sendMail({
      from: fromEmail,
      to: cleanEmail,
      subject: "✅ Message reçu — VentesPro",
      html: `
        <div style="font-family: Inter, Arial, sans-serif; line-height:1.6; color:#111827;">
          <h2 style="color:#4f46e5;">Merci pour votre message 👋</h2>
          <p>Bonjour ${cleanName},</p>
          <p>Nous avons bien reçu votre demande (<b>${cleanSubject}</b>).</p>
          <p>Notre équipe vous répondra dans les plus brefs délais.</p>

          <p style="margin:18px 0;">
            <a href="https://calendly.com/simohamedhadi05/ventespro"
               style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                      padding:12px 18px;border-radius:10px;font-weight:600;">
              📅 Réserver un appel
            </a>
          </p>

          <p style="font-size:12px;color:#6b7280;margin-top:28px;">
            Email automatique – VentesPro © 2026
          </p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true, message: "Message sent" });
  } catch (err) {
    console.error("CONTACT ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      detail: err?.message || String(err),
    });
  }
}
