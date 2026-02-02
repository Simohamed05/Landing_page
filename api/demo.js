import nodemailer from "nodemailer";
import { sql } from "./db.js"; // (ton db.js vercel postgres)

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
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  try {
    const { name, email, business, message } = req.body || {};

    if (!name || !email || !business) {
      return res.status(400).json({ ok: false, message: "Missing fields (name/email/business)" });
    }

    // 1) Save DB
    await sql`
      INSERT INTO demos (name, email, business, message)
      VALUES (${String(name).trim()}, ${String(email).trim().toLowerCase()}, ${String(business).trim()}, ${message ? String(message).trim() : null})
    `;

    // 2) Send auto email
    const transporter = createTransporter();
    await transporter.verify();

    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const support = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;

    // Email to client
    await transporter.sendMail({
      from,
      to: String(email).trim(),
      subject: "✅ Demande de démo reçue — VentesPro",
      html: `
        <div style="font-family: Inter, Arial, sans-serif; line-height:1.6; color:#111827;">
  <h2 style="color:#6366f1;">Bienvenue chez VentesPro 👋</h2>

  <p>Bonjour,</p>

  <p>
    Merci d’avoir demandé une démonstration de <strong>VentesPro</strong>.
    Votre demande a bien été enregistrée.
  </p>

  <p>
    Un membre de notre équipe vous contactera très prochainement pour organiser
    une démo adaptée à votre activité et à vos enjeux business.
  </p>

  <p style="background:#eef2ff;padding:12px;border-radius:8px;">
    📊 Prévisions de ventes<br>
    🚨 Alertes intelligentes<br>
    📈 Analyses avancées & rapports
  </p>

  <p>
    Nous sommes ravis de vous accompagner dans une approche plus
    <strong>prédictive et data-driven</strong>.
  </p>
  <p>
    Pour gagner du temps, vous pouvez réserver directement le créneau qui vous convient :
  </p>

  <p style="margin: 18px 0;">
    <a href="https://calendly.com/simohamedhadi05/ventespro"
       style="display:inline-block;background:#4f46e5;color:#ffffff;
              text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">
      📅 Réserver ma démo
    </a>
  </p>

  <p style="font-size:14px;color:#374151;">
    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
    <a href="https://calendly.com/simohamedhadi05/ventespro" style="color:#4f46e5;">
      https://calendly.com/simohamedhadi05/ventespro
    </a>
  </p>

  <p style="margin-top:24px;">
    À très bientôt,<br>
    <strong>L’équipe VentesPro</strong><br>
    <a href="https://ventespro.vercel.app" style="color:#6366f1;">ventespro.vercel.app</a>
  </p>

  <p style="font-size:12px;color:#6b7280;margin-top:32px;">
    Email automatique – VentesPro © 2026
  </p>
</div>
      `,
    });

    // Email to you (admin)
    await transporter.sendMail({
      from,
      to: support,
      subject: "📩 Nouvelle demande de démo (VentesPro)",
      text: `New demo request:
Name: ${name}
Email: ${email}
Business: ${business}
Message: ${message || "(none)"}
      `,
    });

    return res.status(200).json({ ok: true, message: "Demo saved + email sent" });
  } catch (e) {
    console.error("DEMO API ERROR:", e);
    return res.status(500).json({ ok: false, message: "Server error", detail: e.message });
  }
}
