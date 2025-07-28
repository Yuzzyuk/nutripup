// components/AiSuggestions.jsx
"use client";
import React, { useMemo, useState } from "react";

export default function AiSuggestions({ meals = [], dogProfile = {} }) {
  const [model, setModel] = useState("gpt-4o-mini");
  const [promptText, setPromptText] = useState(
`You are a professional veterinary nutritionist for dogs.
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
}`
  );

  const [state, setState] = useState({ loading: false, error: "", data: null });

  const totals = useMemo(() => {
    return (Array.isArray(meals) ? meals : []).reduce(
      (a, m) => ({
        protein: a.protein + (Number(m?.protein) || 0),
        fat: a.fat + (Number(m?.fat) || 0),
        carbs: a.carbs + (Number(m?.carbs) || 0),
        calories: a.calories + (Number(m?.calories) || 0),
      }),
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    );
  }, [meals]);

  const callAI = async () => {
    setState({ loading: true, error: "", data: null });
    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals, dogProfile, model, promptText }),
      });

      const text = await res.text();
      if (!res.ok) {
        let detail;
        try { detail = JSON.parse(text); } catch { detail = { raw: text }; }
        const readable = detail?.detail?.error?.message || detail?.error || "AI request failed";
        return setState({ loading: false, error: readable, data: null });
      }

      const data = JSON.parse(text);
      setState({ loading: false, error: "", data });
    } catch (e) {
      setState({ loading: false, error: "AIの提案を取得できませんでした。時間をおいて再度お試しください。", data: null });
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div className="badge">AI Nutritionist</div>
        <div style={{ color: "var(--taupe)" }}>
          細かいグラム・kcalまでパーソナライズ
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label style={{ fontSize: 13, color: "var(--taupe)" }}>
            Model
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
            </select>
          </label>
          <button className="btn btn-primary" onClick={callAI} disabled={state.loading}>
            {state.loading ? "Analyzing…" : "Ask AI for personalized tips"}
          </button>
        </div>

        {/* 任意：プロンプト微調整欄（隠したければ削除OK） */}
        <label style={{ fontSize: 13, color: "var(--taupe)" }}>
          (Optional) Instruction Override
          <textarea rows={4} value={promptText} onChange={(e) => setPromptText(e.target.value)} />
        </label>
      </div>

      {state.error && (
        <div className="card" style={{ background: "#fff7f7", color: "#a33", marginTop: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>AIエラー</div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>
            {state.error}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--taupe)" }}>
            例：429（クォータ不足）なら課金/クレジットを確認、401ならAPIキー未設定です。
          </div>
        </div>
      )}

      {state.data && (
        <div style={{ marginTop: 12 }}>
          {state.data.summary && (
            <div className="card" style={{ background: "var(--cloud)" }}>
              <b>Summary</b>
              <div>{state.data.summary}</div>
            </div>
          )}

          {(state.data.suggestions || []).map((s, i) => (
            <div key={i} className="card" style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700 }}>{s.title || "Tip"}</div>
              <div style={{ color: "var(--taupe)" }}>{s.detail || ""}</div>
              {(s.amount != null && s.unit) && (
                <div style={{ fontSize: 13, color: "var(--taupe)" }}>
                  {s.amount} {s.unit}
                </div>
              )}
            </div>
          ))}

          {state.data.disclaimer && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--taupe)" }}>
              {state.data.disclaimer}
            </div>
          )}
        </div>
      )}

      {/* フォールバック（API失敗時） */}
      {!state.data && !state.loading && !state.error && (
        <div style={{ marginTop: 8, color: "var(--taupe)", fontSize: 14 }}>
          たとえば：P {Math.round(totals.protein)}g / F {Math.round(totals.fat)}g / {Math.round(totals.calories)} kcal に合わせ、
          低脂肪タンパクや緩やかな炭水化物を微調整するとよいかも。
        </div>
      )}
    </div>
  );
}
