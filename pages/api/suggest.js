// pages/api/suggest.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const REF_LINKS = [
  {
    title: "WSAVA Global Nutrition – Nutrition for the Life Stages of Dogs and Cats",
    url: "https://wsava.org/wp-content/uploads/2020/01/The-WSAVA-Global-Nutrition-Toolkit-2013.pdf",
  },
  {
    title: "AAFCO Dog Food Nutrient Profiles (Appendix)",
    url: "https://www.aafco.org/wp-content/uploads/2023/05/Guidelines-for-AAFCO-Feeding-Trials-2023.pdf",
  },
];

function safeParseJson(text) {
  if (!text) return null;
  const fence = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  const core = first >= 0 && last > first ? candidate.slice(first, last + 1) : candidate;
  try { return JSON.parse(core); } catch { return null; }
}

function buildSystemPrompt() {
  return `You are a professional canine nutritionist.
Provide concise, personalized, evidence-aware coaching for home-cooked diets.
Base reasoning on AAFCO dog nutrient profiles and WSAVA life-stage guidance.
Avoid medical claims; if disease suspected, advise veterinarian consult.
Use the user's language with a warm, premium tone.`;
}

function buildUserPrompt({ dogProfile = {}, meals = [] }) {
  const hf = Array.isArray(dogProfile.healthFocus) ? dogProfile.healthFocus : [];
  const goals = Array.isArray(dogProfile.goals) ? dogProfile.goals : [];
  const totals = (Array.isArray(meals) ? meals : []).reduce(
    (a, m) => {
      a.protein += Number(m?.protein) || 0;
      a.fat += Number(m?.fat) || 0;
      a.carbs += Number(m?.carbs) || 0;
      a.calories += Number(m?.calories) || 0;
      return a;
    },
    { protein: 0, fat: 0, carbs: 0, calories: 0 }
  );

  return `
DOG
- name: ${dogProfile?.name || "Dog"}
- age_years: ${dogProfile?.age ?? ""}
- weight: ${dogProfile?.weight ?? ""} ${dogProfile?.weightUnit || "kg"}
- breed: ${dogProfile?.breed || ""}
- activity: ${dogProfile?.activityLevel || "Moderate"}
- health_focus: ${hf.join(", ") || "none"}
- owner_goals: ${goals.join(", ") || "none"}

TODAY_MEALS (approx totals)
- protein_g: ${totals.protein.toFixed(1)}
- fat_g: ${totals.fat.toFixed(1)}
- carbs_g: ${totals.carbs.toFixed(1)}
- kcal: ${Math.round(totals.calories)}

Return JSON only.`;
}

// OpenAI JSON Schema (Responses API)
const responseFormat = {
  type: "json_schema",
  json_schema: {
    name: "nutrition_suggestions",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        suggestions: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              detail: { type: "string" },
              amount: { type: ["number", "null"] },
              unit: { type: ["string", "null"], enum: ["g", "kcal", null] },
            },
            required: ["title", "detail", "amount", "unit"],
          },
        },
        checks: { type: "array", items: { type: "string" } },
        references: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              url: { type: "string" },
            },
            required: ["title", "url"],
          },
        },
      },
      required: ["summary", "suggestions", "checks", "references"],
    },
    strict: true,
  },
};

function extractError(e) {
  // OpenAI SDK or fetch系のどちらでも情報を拾う
  const status = e?.status || e?.response?.status || 500;
  const data = e?.response?.data || e?.data || e?.cause || null;
  const msg =
    data?.error?.message ||
    e?.message ||
    "Unknown error";
  const code = data?.error?.code || data?.code || null;
  return { status, message: msg, code, data };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "AI_SUGGESTION_FAILED",
      message: "Missing OPENAI_API_KEY on the server.",
      code: "missing_api_key",
    });
  }

  try {
    const { dogProfile, meals } = req.body || {};

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      max_output_tokens: 500,
      response_format: responseFormat,
      input: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt({ dogProfile, meals }) },
      ],
    });

    const text = (response.output_text || "").trim();
    let json = safeParseJson(text);

    if (!json) {
      // 別経路でJSONが入っていることもある
      const first = response?.output?.[0]?.content?.find?.((c) => c.type === "json");
      if (first?.json) json = first.json;
    }

    if (!json) throw new Error("LLM returned non-JSON");

    if (!Array.isArray(json.references) || !json.references.length) {
      json.references = REF_LINKS;
    }

    res.status(200).json(json);
  } catch (e) {
    const err = extractError(e);
    console.error("AI suggest error:", err);
    res.status(err.status || 500).json({
      error: "AI_SUGGESTION_FAILED",
      message: err.message,
      code: err.code,
    });
  }
}
