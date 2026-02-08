// api/chat.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** 1) Réponses rapides sans IA (FAQ locale) */
const FAQ = [
  {
    match: ["demo", "démo", "demande", "rendez", "rdv", "calendly"],
    reply:
      "Pour une démo VentesPro : allez sur la page Démo et envoyez votre demande. Ensuite, vous pouvez réserver un créneau via Calendly (si disponible sur la page).",
  },
  {
    match: ["fonction", "features", "fonctionnalités", "fait quoi", "capable"],
    reply:
      "VentesPro aide à analyser et prévoir les ventes : import CSV/Excel, dashboard KPI, prévisions IA, alertes et rapports/export.",
  },
  {
    match: ["login", "connexion", "se connecter", "mot de passe", "token"],
    reply:
      "Pour accéder : utilisez la page Connexion. Si vous avez un souci d’accès, vérifiez votre email, puis réessayez ou contactez le support.",
  },
  {
    match: ["signup", "inscription", "créer un compte", "register"],
    reply:
      "Pour créer un compte : allez sur la page Inscription, puis connectez-vous. Après connexion, vous serez redirigé vers l’app VentesPro.",
  },
  {
    match: ["sécur", "security", "ssl", "données", "privacy", "rgpd"],
    reply:
      "VentesPro applique de bonnes pratiques : communications sécurisées (HTTPS) et stockage contrôlé. Pour plus de détails, demandez une démo.",
  },
];

/** 2) Filtre strict : si hors VentesPro => pas d'appel OpenAI */
const ALLOW_KEYWORDS = [
  "ventespro",
  "prévision",
  "forecast",
  "vente",
  "sales",
  "stock",
  "dashboard",
  "kpi",
  "démo",
  "demo",
  "calendly",
  "prix",
  "pricing",
  "tarif",
  "plan",
  "abonnement",
  "login",
  "connexion",
  "signup",
  "inscription",
  "compte",
  "csv",
  "excel",
  "import",
  "export",
  "rapport",
  "report",
  "alerte",
  "alert",
  "ia",
  "modèle",
  "model",
  "sécurité",
  "security",
  "support",
  "streamlit",
];

function isRelatedToVentesPro(text) {
  const t = text.toLowerCase();
  return ALLOW_KEYWORDS.some((k) => t.includes(k));
}

const SYSTEM = `
Tu es "VentesPro Assistant", assistant officiel du site VentesPro.
Tu réponds UNIQUEMENT à propos de VentesPro (fonctionnalités, démo, pricing, sécurité, onboarding, connexion/inscription).
Règles strictes :
- Si la question n’est pas liée à VentesPro : réponds poliment que tu ne réponds que sur VentesPro et propose 3 suggestions.
- Réponses courtes, claires, orientées action.
- Ne demande jamais de données sensibles (mot de passe, carte, etc.).
`;

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const { message, page } = req.body || {};
    const userMsg = String(message || "").trim();
    const lower = userMsg.toLowerCase();

    if (!userMsg) return res.status(400).json({ ok: false, message: "Empty message" });

    /** A) FAQ locale */
    const hit = FAQ.find((x) => x.match.some((m) => lower.includes(m)));
    if (hit) {
      return res.status(200).json({ ok: true, reply: hit.reply });
    }

    /** B) Filtre strict VentesPro-only */
    if (!isRelatedToVentesPro(userMsg)) {
      return res.status(200).json({
        ok: true,
        reply:
          "Je peux répondre uniquement sur VentesPro 🙂\n" +
          "Essayez par exemple :\n" +
          "1) “Quelles sont les fonctionnalités de VentesPro ?”\n" +
          "2) “Comment demander une démo ?”\n" +
          "3) “Comment se connecter / créer un compte ?”",
      });
    }

    /** C) Appel OpenAI (si quota OK) */
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ ok: false, message: "OPENAI_API_KEY missing" });
    }

    // Modèle par défaut moins coûteux et stable
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Page: ${page || "unknown"}\nQuestion: ${userMsg}`,
        },
      ],
    });

    return res.status(200).json({ ok: true, reply: response.output_text || "" });
  } catch (err) {
    // 429 quota / rate limit => message clair au front
    const msg = String(err?.message || "");
    if (msg.includes("429") || err?.status === 429) {
      return res.status(200).json({
        ok: true,
        reply:
          "⚠️ Le service IA est temporairement indisponible (quota atteint). " +
          "Je peux quand même vous aider sur : Démo, Connexion, Fonctionnalités, Pricing.",
      });
    }

    console.error("CHAT API ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error",
      detail: err?.message || String(err),
    });
  }
}
