// pages/api/suggest.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 参考レンジ（ローカルの根拠）
 * - AAFCO: 成犬/成長期の基準（DMベース、Ca:Pは 1:1〜2:1 を維持）
 * - WSAVA: 体重・ライフステージに応じた評価と相談を推奨
 * これらは "目安"。疾患のある個体は必ず獣医師に相談。
 */
const REF_LINKS = [
  {
    title: "WSAVA Global Nutrition – Nutrition for the Life Stages of Dogs and Cats",
    url: "https://wsava.org/wp-content/uploads/2020/01/The-WSAVA-Global-Nutrition-Toolkit-2013.pdf"
  },
  {
    title: "AAFCO Dog Food Nutrient Profiles（Appendix）",
    url: "https://www.aafco.org/wp-content/uploads/2023/05/Guidelines-for-AAFCO-Feeding-Trials-2023.pdf"
  }
];

function buildPrompt(input = {}) {
  const dog = input.dogProfile || {};
  const meals = Array.isArray(input.meals) ? input.meals : [];

  const goals = Array.isArray(dog.goals) ? dog.goals : []; // 例: ["weight", "skin", "joints"]
  const hf = Array.isArray(dog.healthFocus) ? dog.healthFocus : [];

  const totals = meals.reduce(
    (a, m) => {
      a.protein  += Number(m?.protein)  || 0;
      a.fat      += Number(m?.fat)      || 0;
      a.carbs    += Number(m?.carbs)    || 0;
      a.calories += Number(m?.calories) || 0;
      return a;
    },
    { protein: 0, fat: 0, carbs: 0, calories: 0 }
  );

  // —— “プロの犬用栄養士”としての厳格プロンプト ——
  return `You are a *professional canine nutritionist*. Produce short, trustworthy, and **personalized** coaching grounded in veterinary nutrition guidance (AAFCO profiles and WSAVA life-stage principles). Do **not** make medical claims; if disease-specific advice is needed, recommend consulting a veterinarian.

DOG
- name: ${dog.name || "Dog"}
- age_years: ${dog.age ?? ""}
- weight: ${dog.weight ?? ""} ${dog.weightUnit || "kg"}
- breed: ${dog.breed || ""}
- activity: ${dog.activityLevel || "Moderate"}
- health_focus: ${hf.join(", ") || "none"}
- owner_goals: ${goals.join(", ") || "none"}

TODAY_MEALS (approx):
- protein_g: ${totals.protein.toFixed(1)}
- fat_g: ${totals.fat.toFixed(1)}
- carbs_g: ${totals.carbs.toFixed(1)}
- kcal: ${Math.round(totals.calories)}

OUTPUT (JSON only):
{
  "summary": "1 sentence in the user's language that praises, flags key gap/excess, and mentions the owner's goal(s).",
  "suggestions": [
    {
      "title": "Short title (e.g., 'Protein a touch low')",
      "detail": "Concrete, food-first fix (e.g., lean chicken + veggies). Mention why.",
      "amount": 0-200,               // number only if grams/kcal are relevant, else null
      "unit": "g|kcal|null"
    },
    ...
  ],
  "checks": [
    "Ca:P should stay ~1:1 to 2:1 for general diets",
    "Keep energy aligned with body condition & activity",
    "If chronic disease or puppy/gestation/lactation — consult a vet"
  ],
  "references": [
    {"title": "WSAVA Global Nutrition Toolkit", "url": "${REF_LINKS[0].url}"},
    {"title": "AAFCO Dog Profiles (feeding guidance appendix)", "url": "${REF_LINKS[1].url}"}
  ]
}

RULES:
- Personalize to age, weight, activity, health_focus, owner_goals.
- Give **2–4** suggestions max. Prefer grams and examples (egg shell powder, sardine/salmon, leafy veg, pumpkin, etc.) when appropriate.
- Keep warm, premium tone. Be concise.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { dogProfile, meals } = req.body || {};
    const prompt = buildPrompt({ dogProfile, meals });

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",      // 速さ/品質のバランス。必要なら gpt-4.1 等へ
      input: prompt,
      max_output_tokens: 400,
      temperature: 0.4
    });

    const text = (resp.output_text || "").trim();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      // もしJSONが崩れていたら、最低限の形にして返す
      json = {
        summary: text.slice(0, 160),
        suggestions: text
          .split("\n")
          .filter(Boolean)
          .slice(0, 3)
          .map(s => ({ title: "Tip", detail: s, amount: null, unit: null })),
        checks: [
          "Keep Ca:P roughly 1:1 to 2:1",
          "Match calories to activity and body condition"
        ],
        references: REF_LINKS
      };
    }

    // 参照を必ず同梱（フロントで表示する用）
    if (!Array.isArray(json.references) || !json.references.length) {
      json.references = REF_LINKS;
    }

    res.status(200).json(json);
  } catch (e) {
    console.error("AI suggest error:", e?.response?.data || e.message);
    // 失敗時はフロントのフォールバックを使わせる
    res.status(500).json({ error: "AI_SUGGESTION_FAILED" });
  }
}
