// components/AiSuggestions.jsx
"use client";
import React, { useMemo, useState } from "react";

export default function AiSuggestions({ meals = [], dogProfile = {} }) {
  const [state, setState] = useState({ loading: false, error: "", data: null });

  // 失敗時のローカル簡易サジェスト
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

  const fallback = useMemo(() => {
    const s = [];
    if ((totals.protein || 0) < 50) s.push("Protein a bit low — add lean meat.");
    if ((totals.fat || 0) < 15) s.push("Essential fats low — add salmon or fish oil.");
    if ((totals.calories || 0) < 800) s.push("Energy low — increase portion or add carbs.");
    return s.length ? s : ["Looks good today! ✅"];
  }, [totals]);

  const callAI = async () => {
    setState({ loading: true, error: "", data: null });
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ← モデルやプロンプトは送らない（サーバーで固定/管理）
        body: JSON.stringify({ dogProfile, meals }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "AI request failed");
      }
      const json = await res.json();
      setState({ loading: false, error: "", data: json });
    } catch (e) {
      setState({ loading: false, error: "AIの提案を取得できませんでした。時間をおいて再度お試しください。", data: null });
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, color: "var(--taupe)" }}>AI Nutritionist</div>
        <button className="btn btn-primary" onClick={callAI} disabled={state.loading}>
          {state.loading ? "Analyzing..." : "Ask AI for personalized tips"}
        </button>
      </div>

      {state.error && (
        <div className="card" style={{ background: "#fff7f7", color: "#a33" }}>
          {state.error} — showing local tips below.
        </div>
      )}

      {state.data ? (
        <div className="space-y-2">
          <div style={{ color: "var(--taupe)", marginBottom: 8 }}>
            {state.data.summary || "AI suggestions"}
          </div>
          {(state.data.suggestions || []).map((it, i) => (
            <div key={i} className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 700, color: "var(--taupe)" }}>{it.title || "Tip"}</div>
              <div style={{ color: "#6b5b45" }}>{it.detail || ""}</div>
              {it.amount != null && it.unit && (
                <div style={{ fontSize: 13, color: "#6b5b45", marginTop: 4 }}>
                  {`${it.amount} ${it.unit}`}
                </div>
              )}
            </div>
          ))}
          {state.data.sources?.length ? (
            <div style={{ marginTop: 8, color: "var(--taupe)", fontSize: 13 }}>
              Evidence: {state.data.sources.join(" • ")}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {fallback.map((msg, i) => (
            <div key={i} className="card" style={{ padding: 12 }}>{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}
