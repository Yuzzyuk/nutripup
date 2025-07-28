// pages/api/suggest.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(dogProfile = {}, meals = []) {
  const safeMeals = (Array.isArray(meals) ? meals : []).map(m => ({
    name: m?.name ?? "",
    portion: Number(m?.portion) || 0,
    protein: Number(m?.protein) || 0,
    fat: Number(m?.fat) || 0,
    carbs: Number(m?.carbs) || 0,
    calories: Number(m?.calories) || 0,
  }));
  const hf = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];

  return `
You are a professional veterinary canine nutritionist.
Write in the user's language (Japanese is fine if inputs suggest it).
Be specific, concise, and quantified. Avoid medical diagnoses.

DOG:
- name: ${dogProfile?.name || "Dog"}
- age_years: ${dogProfile?.ageYears ?? dogProfile?.age ?? ""}
- age_months: ${dogProfile?.ageMonths ?? ""}
- breed: ${dogProfile?.breed || ""}
- weight: ${dogProfile?.weight || ""} ${dogProfile?.weightUnit || "kg"}
- activity: ${dogProfile?.activityLevel || "Moderate"}
- health_focus: ${hf.join(", ") || "none"}
- goals: ${dogProfile?.goals || ""}

TODAY_MEALS (per item: portion g, macros per item, kcal):
${safeMeals.length ? safeMeals.map(m =>
  `- ${m.name}: ${m.portion}g (P${m.protein}g/F${m.fat}g/C${m.carbs}g, ${m.calories} kcal)`
).join("\n") : "- none"}

TASK:
Return structured suggestions tailored to the dog, with grams/kcal where possible.
Keep to 2–4 items.
Use evidence-informed guidance (AAFCO/WSAVA principles); add brief source label names when relevant.
`;
}

// JSON Schema for strict structured output
const OutputSchema = {
  name: "DogNutritionSuggestions",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "One-sentence overview." },
      suggestions: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            detail: { type: "string" },
            amount: { type: ["number", "null"] }, // in grams when applicable
            unit: { type: ["string", "null"] },   // "g", "kcal", etc.
          },
          required: ["title", "detail"]
        }
      },
      sources: {
        type: "array",
        items: { type: "string" },
        description: "Short source labels, e.g. 'WSAVA', 'AAFCO'."
      }
    },
    required: ["summary", "suggestions"]
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { dogProfile, meals } = req.body || {};
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: buildPrompt(dogProfile, meals),
      // ⬇️ 旧 response_format ではなく text.format / text.json_schema を使う
      text: {
        format: "json_schema",
        json_schema: OutputSchema
      },
      max_output_tokens: 500
    });

    // SDKの便利プロパティ（安全に取得）
    const text = (response.output_text || "").trim();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      // もし厳密JSONに失敗した場合のフォールバック
      json = {
        summary: "AI suggestions",
        suggestions: text
          .split("\n")
          .filter(Boolean)
          .slice(0, 4)
          .map(s => ({ title: "Tip", detail: s }))
      };
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("OpenAI error:", e?.response?.data || e.message || e);
    // 代表的なエラーの見やすい返却
    const status = e?.status || e?.response?.status || 500;
    const message =
      e?.response?.data?.error?.message ||
      e?.message ||
      "AI_SUGGESTION_FAILED";
    return res.status(status).json({ error: message });
  }
}
