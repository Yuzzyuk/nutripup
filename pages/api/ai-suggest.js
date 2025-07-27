// pages/api/ai-suggest.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { meals, dogProfile, model = "gpt-4o-mini", promptText = "" } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 入力を短く要約（コスト節約）
    const mealsBrief = (Array.isArray(meals) ? meals : [])
      .slice(0, 20)
      .map((m) => ({
        name: m.name,
        portion: m.portion,
        protein: m.protein,
        fat: m.fat,
        carbs: m.carbs,
        calories: m.calories,
        method: m.cookingMethod,
      }));

    const profileBrief = {
      name: dogProfile?.name || "",
      age: dogProfile?.age || "",
      breed: dogProfile?.breed || "",
      weight: dogProfile?.weight || "",
      activityLevel: dogProfile?.activityLevel || "",
      healthFocus: Array.isArray(dogProfile?.healthFocus)
        ? dogProfile.healthFocus
        : [],
    };

    const systemPrompt = `
You are a canine nutrition assistant for homemade diets.
Be warm but concise. Use specific gram-level recommendations.
If something is excessive, say how many grams to reduce.
Base reasoning on AAFCO-style completeness (approximate if exact data absent).
Return at most 3 bullet points.
`;

    const userPrompt = `
Profile: ${JSON.stringify(profileBrief)}
Today's meals (first 20 shown): ${JSON.stringify(mealsBrief)}
Goal: Provide balanced, actionable guidance for today. If protein/fat/energy look high or low, suggest concrete (±g) adjustments and example foods. If omega-3 is likely low, suggest salmon or fish oil with a safe dose estimate.
Extra instruction from user (optional):
${promptText}
`;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() },
      ],
    });

    const text = completion.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
