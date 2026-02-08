// api/chat.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS (optionnel)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    // ✅ ICI : on lit depuis req.body, pas userInput
    const { message, page } = req.body || {};
    const userMsg = String(message || "").trim();

    if (!userMsg) return res.status(400).json({ ok: false, message: "Empty message" });
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ ok: false, message: "OPENAI_API_KEY missing" });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5";

    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You are VentesPro Assistant. Answer briefly and clearly in French. Help with demo, login, signup, features."
        },
        {
          role: "user",
          content: `Page: ${page || "unknown"}\nQuestion: ${userMsg}`
        }
      ]
    });

    return res.status(200).json({ ok: true, reply: response.output_text });
  } catch (err) {
    console.error("CHAT API ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      detail: err?.message || String(err)
    });
  }
}
