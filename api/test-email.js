import nodemailer from "nodemailer";

export default async function handler(req, res) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify(); // test SMTP

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.SMTP_USER,
      subject: "✅ Test email VentesPro",
      text: "Si tu reçois cet email, SMTP fonctionne.",
    });

    return res.status(200).json({ ok: true, message: "Email sent" });
  } catch (e) {
    console.error("SMTP TEST ERROR:", e);
    return res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
}
