// pages/api/suggest.js
/**
 * 安定版 /api/suggest
 * - Chat Completions (gpt-4o-mini) を使用
 * - JSON だけを返すようプロンプトで強制
 * - 失敗時は安全なフォールバック JSON を返す
 */

function buildPrompt(dog = {}, meals = []) {
  const hf = Array.isArray(dog.healthFocus) ? dog.healthFocus : [];
  const safeMeals = (Array.isArray(meals) ? meals : []).map((m) => ({
    name: m?.name ?? "",
    portion: Number(m?.portion) || 0,
    protein: Number(m?.protein) || 0,
    fat: Number(m?.fat) || 0,
    carbs: Number(m?.carbs) || 0,
    calories: Number(m?.calories) || 0,
    method: m?.method ?? "",
  }));

  return `
You are a **professional canine nutritionist** writing for affluent owners who home-cook.
Be precise, personalized, and practical. Use warm, premium tone but stay concise.

DOG PROFILE
- name: ${dog?.name || "Dog"}
- age_years: ${dog?.ageYears ?? dog?.age ?? ""}
- age_months: ${dog?.ageMonths ?? ""}
- breed: ${dog?.breed || ""}
- weight: ${dog?.weight || ""} ${dog?.weightUnit || "kg"}
- activity: ${dog?.activityLevel || "Moderate"}
- health_focus: ${hf.join(", ") || "none"}
- owner_goal: ${dog?.goal || ""}

TODAY MEALS (approx; per item)
${safeMeals
  .map(
    (m) =>
      `- ${m.name}: ${m.portion} g, method=${m.method}, P${m.protein}g / F${m.fat}g / C${m.carbs}g, ${m.calories} kcal`
  )
  .join("\n") || "- none"}

TASK
Return **JSON only**. No prose outside JSON. 2–4 actionable suggestions tailored to THIS dog (age/weight/activity/goal/health_focus/meals).
If a nutrient is high or low, give **exact grams** to add/reduce when possible.
Prefer household ingredients (e.g., chicken breast, pumpkin, sardine, eggshell calcium).

SCHEMA
{
  "summary": "1 short line in Japanese",
  "suggestions": [
    {"title": "短い見出し(日本語)", "detail": "理由＋具体アクション(日本語)", "amount": 1.2, "unit": "g"},
    ...
  ]
}

RULES
- Output valid JSON only.
- Round grams to 0.1.
- If input meals are empty, provide gentle starter tips (2 items).
`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { dogProfile = {}, meals = [] } = (req.body || {});
    const userPrompt = buildPrompt(dogProfile, meals);

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: "You are a world-class veterinary canine nutritionist." },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" } // ← JSON強制
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("OpenAI error:", r.status, text);
      return res.status(500).json({ error: "AI_SUGGESTION_FAILED" });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "";
    let json;
    try {
      json = JSON.parse(content);
    } catch {
      // バックアップ：JSONブロック抽出を試す
      const m = content.match(/\{[\s\S]*\}$/);
      json = m ? JSON.parse(m[0]) : null;
    }

    if (!json || typeof json !== "object") {
      return res.status(200).json({
        summary: "AI suggestions",
        suggestions: [
          { title: "タンパク質の最適化", detail: "鶏胸肉や白身魚でPを底上げ。100g単位で調整。", amount: 100, unit: "g" },
          { title: "カルシウム補完", detail: "卵殻カルシウムを微量追加してバランスを取る。", amount: 1.0, unit: "g" }
        ],
      });
    }

    // 正規化（欠けているキーを埋める）
    const clean = {
      summary: typeof json.summary === "string" ? json.summary : "AI suggestions",
      suggestions: Array.isArray(json.suggestions) ? json.suggestions.slice(0, 4).map((it) => ({
        title: it?.title ?? "Suggestion",
        detail: it?.detail ?? "",
        amount: typeof it?.amount === "number" ? Math.round(it.amount * 10) / 10 : undefined,
        unit: it?.unit ?? undefined,
      })) : [],
    };

    return res.status(200).json(clean);
  } catch (e) {
    console.error("API /suggest error:", e);
    return res.status(500).json({ error: "AI_SUGGESTION_FAILED" });
  }
}
