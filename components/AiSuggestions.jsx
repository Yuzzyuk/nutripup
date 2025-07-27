// components/AiSuggestions.jsx
"use client";
import React, { useMemo, useState } from "react";

export default function AiSuggestions({ meals = [], dogProfile = {} }) {
  const [ai, setAi] = useState({ loading: false, error: "", data: null });

  // ローカルの簡易フォールバック（AI失敗時に表示）
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
    if ((totals.protein || 0) < 50) s.push("タンパク質がやや不足 — 鶏胸肉などを+50–80g。");
    if ((totals.fat || 0) < 15) s.push("必須脂肪酸が不足気味 — サーモン/フィッシュオイルを少量追加。");
    if ((totals.calories || 0) < 800) s.push("エネルギー不足 — 炭水化物を+80–120kcal（さつまいも/白米）。");
    return s.length ? s : ["良いバランスです ✅"];
  }, [totals]);

  const callAI = async () => {
    setAi({ loading: true, error: "", data: null });
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dogProfile, meals }),
      });
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      setAi({ loading: false, error: "", data: json });
    } catch {
      setAi({ loading: false, error: "AI request failed", data: null });
    }
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, color: "var(--taupe)" }}>AI Coach</div>
        <button className="btn btn-primary" onClick={callAI} disabled={ai.loading}>
          {ai.loading ? "Analyzing..." : "Generate"}
        </button>
      </div>

      {ai.error && (
        <div className="card" style={{ background: "#fff5f5", color: "#a33", marginBottom: 8 }}>
          {ai.error} — ローカルの提案を表示します。
        </div>
      )}

      {ai.data ? (
        <div className="space-y-2">
          <div style={{ color: "var(--taupe)", marginBottom: 8 }}>
            {ai.data.summary || "AI suggestions"}
          </div>
          {(ai.data.suggestions || []).map((it, i) => (
            <div key={i} className="card" style={{ background: "var(--cloud)" }}>
              <div style={{ fontWeight: 700, color: "var(--taupe)" }}>{it.title || "Tip"}</div>
              <div style={{ color: "#6d5a49" }}>{it.detail || ""}</div>
              {it.amount != null && it.unit && (
                <div style={{ fontSize: 12, color: "#6d5a49", marginTop: 4 }}>
                  {`${it.amount} ${it.unit}`}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {fallback.map((msg, i) => (
            <div key={i} className="card" style={{ background: "var(--cloud)" }}>{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}
