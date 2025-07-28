// pages/api/ai-suggest.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { meals = [], dogProfile = {}, model = "gpt-4o-mini", promptText } = req.body || {};
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY on server. Add it to .env.local (local) or Vercel Project Settings > Environment Variables (production).",
    });
  }

  // 合計（安全化）
  const totals = (Array.isArray(meals) ? meals : []).reduce(
    (a, m) => ({
      protein: a.protein + (Number(m?.protein) || 0),
      fat: a.fat + (Number(m?.fat) || 0),
      carbs: a.carbs + (Number(m?.carbs) || 0),
      calories: a.calories + (Number(m?.calories) || 0),
      fiber: a.fiber + (Number(m?.fiber) || 0),
      calcium: a.calcium + (Number(m?.calcium) || 0),
      phosphorus: a.phosphorus + (Number(m?.phosphorus) || 0),
    }),
    { protein: 0, fat: 0, carbs: 0, calories: 0, fiber: 0, calcium: 0, phosphorus: 0 }
  );

  const hf = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];

  // 既定プロンプト（上書き可）
  const systemPrompt = (promptText || `
You are a professional veterinary nutritionist for dogs.
- Personalize strictly to the dog's profile and the owner's goals.
- Use WSAVA & AAFCO style principles for balance (no brand endorsements).
- Be specific with grams (e.g., "卵殻カルシウム 1.2g 追加") and kcal adjustments.
- If something is excessive, say exactly how many grams to reduce.
- Tone: premium, warm, concise. Up to 3 bullet points. Output in user's language.

Return JSON only:
{
  "summary": "1 short sentence",
  "suggestions": [
    {"title": "…", "detail": "…", "amount": 1.2, "unit": "g"},
    {"title": "…", "detail": "…"}
  ],
  "disclaimer": "短い注意書き（任意）"
}
If you cannot compute safely, return a single suggestion asking for more info.
`).trim();

  const userPrompt = `
DOG PROFILE
- name: ${dogProfile?.name || "Dog"}
- age_years: ${dogProfile?.ageYears ?? ""}
- age_months: ${dogProfile?.ageMonths ?? ""}
- breed: ${dogProfile?.breed || ""}
- weight: ${dogProfile?.weight || ""} ${dogProfile?.weightUnit || "kg"}
- activity: ${dogProfile?.activityLevel || "Moderate"}
- goals: ${(dogProfile?.goals || []).join(", ") || "none"}
- health_focus: ${hf.join(", ") || "none"}

TODAY'S TOTALS (approx)
- Protein: ${totals.protein.toFixed(1)} g
- Fat: ${totals.fat.toFixed(1)} g
- Carbs: ${totals.carbs.toFixed(1)} g
- Calories: ${Math.round(totals.calories)} kcal
- Fiber: ${totals.fiber.toFixed(1)} g
- Calcium: ${totals.calcium.toFixed(2)} g
- Phosphorus: ${totals.phosphorus.toFixed(2)} g
`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        // JSON を強制（モデルに支持）
        response_format: { type: "json_object" }
      }),
    });

    const text = await r.text();
    if (!r.ok) {
      // OpenAI エラーをそのまま前段に返す（429/401などを見える化）
      let detail;
      try { detail = JSON.parse(text); } catch { detail = { raw: text }; }
      return res.status(r.status).json({ error: "OpenAI error", detail });
    }

    const json = JSON.parse(text);
    const raw = json?.choices?.[0]?.message?.content || "{}";

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      // JSONで来なかった場合（まれ）
      payload = {
        summary: "Here are some targeted nutrition tweaks.",
        suggestions: (raw || "").split("\n").filter(Boolean).slice(0, 3).map(s => ({ title: "Tip", detail: s }))
      };
    }

    // 正規化
    payload.suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
    return res.status(200).json(payload);
  } catch (e) {
    return res.status(500).json({ error: "Server failed to call OpenAI", message: String(e?.message || e) });
  }
}
