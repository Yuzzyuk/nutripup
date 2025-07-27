// pages/api/suggest.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ================================
   専門栄養士トーン（編集OK）
=================================== */
const SYSTEM_PROMPT = `
あなたは臨床知見に基づくプロフェッショナルな「犬の栄養士」です。
- トーン: 上品・安心・簡潔。上から目線は避け、根拠のある助言。
- 目的: 飼い主の「今日の食事」から、健康目標に直結する改善提案を具体量(g/kcal)で提示。
- 参照: AAFCO(総合栄養食の最低基準)と一般的な臨床栄養指針を意識。ただし実務的で現実的に。
- 安全: 玉ねぎ・ニンニク・キシリトール・ブドウ・チョコ等は禁忌。骨は調理/粉末のみ等、基本安全ガイドを守る。
- 語調: 1提案は1〜2文、断定しすぎず分かりやすく。
- パーソナライズ: 体重・活動量・年齢(成長/高齢)・犬種特性・健康フォーカス(目標/課題)を反映。
- 出力は必ずJSONのみ（後述の形式）
`.trim();

/* ================================
   サマリー用のユーザープロンプト生成
   - 体重と活動量から RER/MER をサーバ側で概算して渡す
=================================== */
function estimateEnergy(dogProfile = {}) {
  const w = Number(dogProfile?.weight);
  if (!w || w <= 0) return null;

  const RER = 70 * Math.pow(w, 0.75);
  // 活動係数（参考目安）
  const level = (dogProfile?.activityLevel || "Moderate").toLowerCase();
  const factor =
    level.includes("low") ? 1.2 :
    level.includes("high") ? 2.0 :
    1.6; // Moderate

  // 体重マネジメント時は少し補正（任意）
  const focus = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];
  const hasWeight = focus.includes("weight");
  const MER = RER * (hasWeight ? 1.4 : factor);

  return {
    weightKg: w,
    activityLevel: dogProfile?.activityLevel || "Moderate",
    RER: Math.round(RER),
    MER: Math.round(MER),
  };
}

/* healthFocus を人間語にして意図を明確化（プロンプト最適化用） */
function describeGoals(healthFocus = []) {
  const hf = Array.isArray(healthFocus) ? healthFocus : [];
  const map = {
    skin: "皮膚・被毛の質改善（オメガ3・ビタミンEなど）",
    joints: "関節サポート（グルコサミン/コラーゲン、適切な体重）",
    kidneys: "腎配慮（リンを控えめ、適度なタンパク質品質、潤い）",
    digestion: "消化ケア（穏やかな食物繊維、プロバイオティクス）",
    weight: "体重マネジメント（適正kcalと満足感）",
    energy: "エネルギー・活力向上（十分なkcalと必須脂肪酸）",
  };
  const list = hf.map((k) => map[k]).filter(Boolean);
  return list.length ? list.join(" / ") : "特に指定なし";
}

/* ================================
   ★ ここが実質の「プロンプト本体」
   - 必要に応じて文面を自由に編集してください
=================================== */
function buildUserPrompt(dogProfile = {}, meals = []) {
  const safeMeals = (Array.isArray(meals) ? meals : []).map(m => ({
    name: m?.name ?? "",
    portion: Number(m?.portion) || 0,
    protein: Number(m?.protein) || 0,
    fat: Number(m?.fat) || 0,
    carbs: Number(m?.carbs) || 0,
    calories: Number(m?.calories) || 0,
  }));

  const hf = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];
  const goalsText = describeGoals(hf);
  const energy = estimateEnergy(dogProfile);

  const energyBlock = energy
    ? `RER(目安): ${energy.RER} kcal / day
MER(目安): ${energy.MER} kcal / day (活動:${energy.activityLevel}, 体重:${energy.weightKg}kg)`
    : `RER/MERの算出不可（体重が未入力）`;

  const mealsBlock = safeMeals.length
    ? safeMeals.map(m => `- ${m.name}: ${m.portion}g (P${m.protein}g / F${m.fat}g / C${m.carbs}g, ${m.calories} kcal)`).join("\n")
    : "- (本日は未入力)";

  return `
[CONTEXT]
DOG:
- Name: ${dogProfile?.name || "Dog"}
- Age: ${dogProfile?.age || "-"}
- Breed: ${dogProfile?.breed || "-"}
- Weight: ${dogProfile?.weight || "-"} ${dogProfile?.weightUnit || "kg"}
- Activity: ${dogProfile?.activityLevel || "Moderate"}
- Goals/Focus: ${goalsText}

ENERGY_ESTIMATE:
${energyBlock}

TODAY_MEALS:
${mealsBlock}

[WHAT TO DO]
1) 今日の栄養バランスを簡潔に評価（プロ向けの短い日本語1文）。
2) 目標（Goals/Focus）に直結する **2〜4個** の改善提案を、できるだけ **具体的なg/kcal** で提示。
   - 例：タンパク不足 → 「ささみ 60g 追加」／脂質過多 → 「油分 -8g」／Ca不足 → 「卵殻カルシウム 1.2g」
   - 腎配慮ならリンやタンパクの質、皮膚ならn-3系脂肪酸、関節ならGLM/コラーゲン、消化なら食物繊維 等を優先。
   - 材料は家庭で用意しやすいものを優先し、代替案があれば1つ示す。
3) 安全上の注意があれば1つ短く添える（任意）。
4) **JSONのみ**で出力：

{
  "summary": "日本語で1文のまとめ",
  "suggestions": [
    { "title": "短い見出し", "detail": "具体的で温かい提案（日本語）", "amount": 60, "unit": "g", "priority": 1 }
  ],
  "notes": "任意の一言（注意など）"
}

- amount/unit は可能なときのみ（不要なら省略OK）
- priority は 1=最重要（任意）
- 文字数は全体で簡潔に
`.trim();
}

/* ================================
   モデル設定（必要なら変更）
=================================== */
const MODEL = "gpt-4.1-mini";
const TEMPERATURE = 0.5;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { dogProfile, meals } = req.body || {};

    const response = await client.responses.create({
      model: MODEL,
      temperature: TEMPERATURE,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(dogProfile, meals) },
      ],
      max_output_tokens: 400,
    });

    const text = (response.output_text || "").trim();

    // JSONパース（非JSON時はフォールバック）
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = {
        summary: "今日の栄養提案",
        suggestions: text
          .split("\n")
          .filter(Boolean)
          .slice(0, 4)
          .map((s) => ({ title: "Tip", detail: s })),
      };
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "AI_SUGGESTION_FAILED" });
  }
}
