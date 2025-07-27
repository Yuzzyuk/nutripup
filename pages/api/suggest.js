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
You are a veterinary nutrition assistant for dogs.
Return concise, factual suggestions.

DOG:
- name: ${dogProfile?.name || "Dog"}
- age: ${dogProfile?.age || ""}
- breed: ${dogProfile?.breed || ""}
- weight: ${dogProfile?.weight || ""} ${dogProfile?.weightUnit || "kg"}
- activity: ${dogProfile?.activityLevel || "Moderate"}
- health_focus: ${hf.join(", ") || "none"}

TODAY_MEALS:
${safeMeals.map(m => `- ${m.name}: ${m.portion}g (P${m.protein}/F${m.fat}/C${m.carbs}, ${m.calories} kcal)`).join("\n") || "- none"}

TASK:
1) Output JSON only:
{
  "summary": "1 short sentence",
  "suggestions": [
    {"title": "Calcium low", "detail": "Add eggshell powder", "amount": 1.2, "unit": "g"},
    {"title": "...", "detail": "...", "amount": 5, "unit": "g"}
  ]
}
2) 2–4 items. Round to 0.1g.
`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { dogProfile, meals } = req.body || {};
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: buildPrompt(dogProfile, meals),
      max_output_tokens: 300
    });
    const text = (response.output_text || "").trim();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = {
        summary: "AI suggestions",
        suggestions: text.split("\n").filter(Boolean).slice(0,4).map(s => ({ title: "Tip", detail: s }))
      };
    }
    res.status(200).json(json);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI_SUGGESTION_FAILED" });
  }
}
