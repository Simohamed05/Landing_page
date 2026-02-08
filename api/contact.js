import nodemailer from "nodemailer";
import { sql } from "./db.js"; // ton db.js vercel postgres

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const { name, email, subject, message, page } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ ok: false, message: "Missing fields (name/email/subject/message)" });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanSubject = String(subject).trim();
    const cleanMessage = String(message).trim();
    const cleanPage = page ? String(page).trim() : null;

    // 1) Save DB
    await sql`
      INSERT INTO contacts (name, email, subject, message, page)
      VALUES (${cleanName}, ${cleanEmail}, ${cleanSubject}, ${cleanMessage}, ${cleanPage})
    `;

    // 2) Send emails (auto reply + admin)
    const transporter = createTransporter();
    await transporter.verify();

    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const support = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;

    // Email to client (auto reply)
    await transporter.sendMail({
      from,
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

    // Email to admin (you)
    await transporter.sendMail({
      from,
      to: support,
      subject: `📩 Nouveau contact — ${cleanSubject}`,
      text: `New contact message:
Name: ${cleanName}
Email: ${cleanEmail}
Subject: ${cleanSubject}
Page: ${cleanPage || "(unknown)"}

Message:
${cleanMessage}
      `,
    });

    return res.status(200).json({ ok: true, message: "Contact saved + emails sent" });
  } catch (e) {
    console.error("CONTACT API ERROR:", e);
    return res.status(500).json({ ok: false, message: "Server error", detail: e.message });
  }
}
