// pages/api/suggest.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ❶ サーバーでモデルを固定（必要なら Vercel 環境変数で上書き可）
const MODEL = process.env.NUTRIPUP_MODEL || "gpt-4.1-mini";

// ❷ サーバーで “専門家トーン” と出力形式を固定（必要なら env で上書き可）
const SYSTEM_PROMPT =
  process.env.NUTRIPUP_PROMPT ||
  `You are a board-certified canine nutritionist (veterinary nutrition).
Speak in the user's language. Warm, premium, concise. No hedging.
Be specific in grams and kcal when possible (round to 0.1g). 
Respect AAFCO/WSAVA guidance; avoid unsafe foods.
Return evidence-backed, personalized guidance for THIS dog only.`;

function safeArray(v) { return Array.isArray(v) ? v : []; }
function num(v, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d; }

function buildUserPrompt(dogProfile = {}, meals = []) {
  const hf = safeArray(dogProfile.healthFocus);
  const goals = safeArray(dogProfile.goals); // 任意: 目標フィールドがあれば反映
  const ageYears = num(dogProfile.ageYears ?? dogProfile.age, 0);
  const ageMonths = num(dogProfile.ageMonths, 0);

  const safeMeals = safeArray(meals).map(m => ({
    name: m?.name ?? "",
    portion: num(m?.portion),
    protein: num(m?.protein),
    fat: num(m?.fat),
    carbs: num(m?.carbs),
    calories: num(m?.calories),
  }));

  return `
DOG PROFILE
- name: ${dogProfile?.name || "Dog"}
- age: ${ageYears} years ${ageMonths} months
- breed: ${dogProfile?.breed || ""}
- weight: ${dogProfile?.weight || ""} ${dogProfile?.weightUnit || "kg"}
- activity: ${dogProfile?.activityLevel || "Moderate"}
- health_focus: ${hf.join(", ") || "none"}
- goals: ${goals.join(", ") || "none"}

TODAY MEALS (per item; 100g-based scaled)
${safeMeals.length
  ? safeMeals.map(m => `- ${m.name}: ${m.portion}g (P${m.protein}g / F${m.fat}g / C${m.carbs}g, ${m.calories} kcal)`).join("\n")
  : "- none"}

TASK
Return STRICT JSON only:
{
  "summary": "1 sentence tailored to this dog",
  "suggestions": [
    {"title": "Calcium low", "detail": "Add eggshell powder", "amount": 1.2, "unit": "g"},
    {"title": "...", "detail": "...", "amount": 5, "unit": "g"}
  ],
  "sources": ["WSAVA Guidelines", "AAFCO Profiles"]
}
- 2–4 suggestions.
- Concrete amounts in grams/kcal when relevant.
- Consider health_focus and goals.
- If data is insufficient, say so briefly in summary and give safe defaults.
`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { dogProfile, meals } = req.body || {};

    const response = await client.responses.create({
      model: MODEL,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(dogProfile, meals) }
      ],
      max_output_tokens: 400,
      // NOTE: Responses API は text.format で strict JSON も可能だが、
      // ここでは output_text をパースし、失敗時はフォールバックする。
    });

    const text = (response.output_text || "").trim();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      // モデルが JSON 以外を返した時のフォールバック
      json = {
        summary: "Personalized tips",
        suggestions: text.split("\n").filter(Boolean).slice(0, 4).map(s => ({ title: "Tip", detail: s })),
        sources: ["WSAVA", "AAFCO"]
      };
    }

    // 出力の最終バリデーション（欠けは補完）
    json.summary = String(json.summary || "Personalized tips");
    json.suggestions = safeArray(json.suggestions).slice(0, 4).map(it => ({
      title: String(it?.title || "Tip"),
      detail: String(it?.detail || ""),
      amount: it?.amount != null && Number.isFinite(Number(it.amount)) ? Number(it.amount) : undefined,
      unit: it?.unit || undefined,
    }));
    json.sources = safeArray(json.sources).slice(0, 5).map(String);

    res.status(200).json(json);
  } catch (e) {
    // Vercel Runtime Logs で確認できる
    console.error("AI_SUGGESTION_FAILED", e?.response?.data || e?.message || e);
    res.status(500).json({ error: "AI_SUGGESTION_FAILED" });
  }
}
