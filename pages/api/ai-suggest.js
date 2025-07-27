// pages/api/ai-suggest.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { dog, meals } = req.body || {};
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  const total = (meals || []).reduce(
    (acc, m) => {
      acc.protein += m.protein || 0;
      acc.fat += m.fat || 0;
      acc.carbs += m.carbs || 0;
      acc.calories += m.calories || 0;
      return acc;
    },
    { protein: 0, fat: 0, carbs: 0, calories: 0 }
  );

  const prompt = `
You are a canine nutrition coach. The user feeds homemade meals.
Dog profile:
- Name: ${dog?.name || "Dog"}
- Age: ${dog?.age || "-"}
- Breed: ${dog?.breed || "-"}
- Weight: ${dog?.weight || "-"} ${dog?.weightUnit || "kg"}
- Activity: ${dog?.activityLevel || "-"}
- Health focus: ${(Array.isArray(dog?.healthFocus) ? dog.healthFocus : []).join(", ") || "none"}

Today's totals (approx):
- Protein: ${total.protein.toFixed(1)} g
- Fat: ${total.fat.toFixed(1)} g
- Carbs: ${total.carbs.toFixed(1)} g
- Calories: ${Math.round(total.calories)} kcal

Return 3–5 short, reassuring suggestions in Japanese, with concrete gram suggestions when possible (e.g., “卵殻カルシウム1.2g追加”). Keep it warm and premium tone.
`;

  try {
    // OpenAI Chat Completions（gpt-4o-mini 例）
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful canine nutrition assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });
    const json = await r.json();
    const text = json?.choices?.[0]?.message?.content || "No suggestions.";
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: "OpenAI request failed" });
  }
}
