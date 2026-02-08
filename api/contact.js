// api/contact.js
import nodemailer from "nodemailer";
import { sql } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    // 1️⃣ Save DB
    await sql`
      INSERT INTO contacts (name, email, subject, message)
      VALUES (${name}, ${email}, ${subject}, ${message})
    `;

    // 2️⃣ SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // auto-reply
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
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

    // admin mail
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.SUPPORT_EMAIL,
      subject: `📩 Nouveau contact — ${subject}`,
      text: `
Nom: ${name}
Email: ${email}

Message:
${message}
      `,
    });

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error("CONTACT ERROR:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
