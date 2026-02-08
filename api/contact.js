// api/contact.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields"
      });
    }

    // Transport SMTP Gmail
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Email envoyé au support
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.SUPPORT_EMAIL,
      replyTo: email,
      subject: `[VentesPro Contact] ${subject}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><b>Nom :</b> ${name}</p>
        <p><b>Email :</b> ${email}</p>
        <p><b>Sujet :</b> ${subject}</p>
        <p><b>Message :</b></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `
    });

    // Réponse automatique au client
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Nous avons bien reçu votre message – VentesPro",
      html: `
        <p>Bonjour ${name},</p>
        <p>Merci pour votre message. L’équipe <b>VentesPro</b> l’a bien reçu.</p>
        <p>Nous vous répondrons dans les plus brefs délais.</p>
        <br/>
        <p>Cordialement,<br/>
        <b>Équipe VentesPro</b><br/>
        📧 ${process.env.SUPPORT_EMAIL}</p>
      `
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("CONTACT API ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      detail: err.message
    });
  }
}
