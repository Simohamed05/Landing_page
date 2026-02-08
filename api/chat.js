import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INSTRUCTIONS = `
You are "VentesPro Assistant" for the VentesPro landing page.
Goal: answer questions about VentesPro (features, demo, pricing, security, onboarding).
Be concise, helpful, and professional.
If user asks something unrelated, politely redirect to VentesPro topics.
Never request sensitive data (passwords, bank info).
If user asks for account issues, suggest using the login/signup pages or contacting support.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  try {
    const { message = "", history = [] } = req.body || {};
    const userText = String(message).trim();
    if (!userText) return res.status(400).json({ ok: false, message: "Message required" });

    // Limit history size (avoid huge payloads)
    const safeHistory = Array.isArray(history) ? history.slice(-8) : [];

    const input = [
      ...safeHistory.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 2000)
      })),
      { role: "user", content: userText }
    ];

    const response = await client.responses.create({
      model: "gpt-5",
      instructions: INSTRUCTIONS,
      input
    });

    return res.status(200).json({ ok: true, reply: response.output_text || "" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error", detail: e.message });
  }
}
