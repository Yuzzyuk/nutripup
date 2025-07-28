// pages/api/suggest.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(dog = {}, meals = []) {
  const hf = Array.isArray(dog.healthFocus) ? dog.healthFocus : [];
  const hfJa = hf.length ? hf.join(", ") : "なし";

  const safeMeals = (Array.isArray(meals) ? meals : []).map((m) => ({
    name: m?.name ?? "",
    portion: Number(m?.portion) || 0,
    protein: Number(m?.protein) || 0,
    fat: Number(m?.fat) || 0,
    carbs: Number(m?.carbs) || 0,
    calories: Number(m?.calories) || 0,
  }));

  const mealsBlock =
    safeMeals.length === 0
      ? "- なし"
      : safeMeals
          .map(
            (m) =>
              `- ${m.name}: ${m.portion}g (P${m.protein}g / F${m.fat}g / C${m.carbs}g, ${m.calories}kcal)`
          )
          .join("\n");

  return `
あなたは**犬の臨床栄養**に精通したプロの栄養士です。飼い主は自炊派で、栄養バランスと安全性の両立を求めています。
出力は**必ず日本語**・**JSONのみ**で返してください（装飾なし / コードブロックなし）。

[犬のプロフィール]
- 名前: ${dog?.name || "Dog"}
- 年齢: ${typeof dog?.ageYears === "number" || dog?.ageYears !== "" ? `${dog?.ageYears ?? 0}歳` : (dog?.age ?? "")} ${typeof dog?.ageMonths === "number" || dog?.ageMonths !== "" ? `${dog?.ageMonths ?? 0}ヶ月` : ""}
- 体重: ${dog?.weight || ""} ${dog?.weightUnit || "kg"}
- 活動量: ${dog?.activityLevel || "Moderate"}
- 目標/気になる点: ${hfJa}

[今日の食事（概算）]
${mealsBlock}

[要件]
- AAFCO/WSAVA等の一般指針を参考にしつつ、**個別情報**（体重・活動量・健康フォーカス）に基づく**パーソナライズ**を行う。
- **2〜4件**の提案。各提案は、改善理由（簡潔）＋**具体的な量(例: 1.2g, 5g, 50g)** を示す。
- 可能な場合は**家庭で実行可能**な代替案（例: 卵殻カルシウム、青魚、カボチャ等）。
- 塩分・玉ねぎ・ぶどう・キシリトールなど**有害食材の注意喚起**は必要時のみ短く。
- **JSONのみ**で返す。スキーマは下記に厳密に従うこと（余分なキー, コメント, コードブロック禁止）。

[JSONスキーマ]
{
  "summary": "1文の要約（日本語）",
  "suggestions": [
    {
      "title": "短い見出し（日本語）",
      "detail": "具体的なアドバイス（日本語・必要ならg/kcal明記）",
      "amount": 0,           // 数値。量が不要なら null
      "unit": "g",           // g / kcal など。量が不要なら "" もしくは null
      "evidence": ["WSAVA", "AAFCO"] // 参考枠組み名（あれば）
    }
  ],
  "disclaimer": "教育目的の注意文（日本語）"
}
`.trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { dogProfile, meals } = req.body || {};

    // Chat Completionsを使い、JSONを**強制**（UIにモデル/プロンプトは出さない）
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }, // ← JSONを強制
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "あなたは犬の臨床栄養に詳しいプロの栄養士です。出力は必ず日本語かつJSONのみ。",
        },
        { role: "user", content: buildPrompt(dogProfile || {}, meals || []) },
      ],
    });

    const content =
      completion?.choices?.[0]?.message?.content?.trim() || "{}";

    let json;
    try {
      json = JSON.parse(content);
    } catch {
      // ここに来たらモデルが指示に従っていないので緊急整形
      json = {
        summary: "本日の食事に関する簡易サマリーです。",
        suggestions: [],
        disclaimer:
          "これは教育目的の一般アドバイスです。持病や継続症状がある場合は獣医師に相談してください。",
      };
    }

    // 最低限のバリデーション
    if (!Array.isArray(json.suggestions)) json.suggestions = [];
    json.suggestions = json.suggestions.slice(0, 4).map((s) => ({
      title: (s?.title || "").toString(),
      detail: (s?.detail || "").toString(),
      amount:
        s?.amount === null || s?.amount === "" || Number.isNaN(Number(s?.amount))
          ? null
          : Number(s.amount),
      unit:
        s?.unit == null
          ? ""
          : String(s.unit),
      evidence: Array.isArray(s?.evidence) ? s.evidence.slice(0, 3) : [],
    }));
    if (!json.summary) json.summary = "今日の食事は概ね良好です。";
    if (!json.disclaimer)
      json.disclaimer =
        "これは教育目的の一般アドバイスです。持病や継続症状がある場合は獣医師に相談してください。";

    return res.status(200).json(json);
  } catch (e) {
    // 429（クォータ）やその他をそのまま返す
    const status = e?.status ?? 500;
    const message =
      e?.message ||
      e?.error?.message ||
      "AI_SUGGESTION_FAILED";
    console.error("AI suggest error:", message);
    return res.status(status).json({ error: message });
  }
}
