// pages/api/suggest.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const REF_LINKS = [
  {
    title: "WSAVA Global Nutrition – Nutrition for the Life Stages of Dogs and Cats",
    url: "https://wsava.org/wp-content/uploads/2020/01/The-WSAVA-Global-Nutrition-Toolkit-2013.pdf",
  },
  {
    title: "AAFCO Dog Food Nutrient Profiles（Appendix）",
    url: "https://www.aafco.org/wp-content/uploads/2023/05/Guidelines-for-AAFCO-Feeding-Trials-2023.pdf",
  },
];

// 万一コードブロック付きで返ってきても抜き出せる保険
function safeParseJson(text) {
  if (!text) return null;
  // ```json ... ``` の中身だけ抜く
  const fence = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;

  // 先頭の最初の { から最後の } までを抽出
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  const core = first >= 0 && last > first ? candidate.slice(first, last + 1) : candidate;

  try {
    return JSON.parse(core);
  } catch {
    return null;
  }
}

function buildSystemPrompt() {
  return `You are a professional canine nutritionist.
Provide concise, personalized, evidence-aware coaching for home-cooked diets.
Base reasoning on AAFCO dog nutrient profiles and WSAVA life-stage guidance.
Do not make medical claims; if disease is suspected, advise veterinarian consult.
Use the user's language. Keep a warm, premium tone.`;
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

Return JSON only (the server enforces a JSON schema).
`;
}

// OpenAIのJSONスキーマ（Responses API）
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
        checks: {
          type: "array",
          items: { type: "string" },
        },
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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

    // 公式は schema 指定時でも output_text に JSON が入る想定
    const text = (response.output_text || "").trim();
    let json = safeParseJson(text);

    if (!json) {
      // 予備: contentからjsonを直接拾える場合
      const first = response?.output?.[0]?.content?.find?.((c) => c.type === "json");
      if (first?.json) json = first.json;
    }

    if (!json) throw new Error("LLM returned non-JSON");

    // 参照が無ければ必ず補う
    if (!Array.isArray(json.references) || !json.references.length) {
      json.references = REF_LINKS;
    }

    res.status(200).json(json);
  } catch (e) {
    console.error("AI suggest error:", e?.response?.data || e.message);
    res.status(500).json({ error: "AI_SUGGESTION_FAILED" });
  }
}
