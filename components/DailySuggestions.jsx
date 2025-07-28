// components/DailySuggestions.jsx
"use client";
import React, { useMemo, useState } from "react";

// 安全に総量を出す
const sumMeals = (meals = []) =>
  (Array.isArray(meals) ? meals : []).reduce(
    (a, m) => ({
      protein: a.protein + (Number(m?.protein) || 0),
      fat: a.fat + (Number(m?.fat) || 0),
      carbs: a.carbs + (Number(m?.carbs) || 0),
      calories: a.calories + (Number(m?.calories) || 0),
    }),
    { protein: 0, fat: 0, carbs: 0, calories: 0 }
  );

export default function DailySuggestions({ meals = [], dogProfile = {}, onBack }) {
  const [ai, setAi] = useState({ loading: false, data: null, error: "" });

  const totals = useMemo(() => sumMeals(meals), [meals]);

  // シンプルなローカルfallback（AI失敗時に下部へ表示）
  const localFallback = useMemo(() => {
    const tips = [];
    if ((totals.protein || 0) < 50) tips.push("タンパク質がやや不足。鶏胸肉や赤身を+50〜80g目安で。");
    if ((totals.fat || 0) < 15) tips.push("必須脂肪酸が不足気味。サーモン/魚油を小さじ1/2ほど。");
    if ((totals.calories || 0) < 800) tips.push("エネルギーが不足。さつまいも/ご飯を+50〜100gで調整。");
    return tips.length ? tips : ["本日は概ねバランス良好です。✅"];
  }, [totals]);

  const callAI = async () => {
    setAi({ loading: true, data: null, error: "" });
    try {
      const resp = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dogProfile, meals }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || "FAILED");
      }
      const json = await resp.json();
      setAi({ loading: false, data: json, error: "" });
    } catch (e) {
      setAi({
        loading: false,
        data: null,
        error: "AIの提案を取得できませんでした。時間をおいて再度お試しください。",
      });
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>AI Nutritionist</h2>
      <div style={{ color: "var(--taupe)", marginBottom: 8 }}>
        Ask AI for personalized tips
      </div>

      <button
        className="btn btn-primary"
        onClick={callAI}
        disabled={ai.loading}
        aria-busy={ai.loading}
      >
        {ai.loading ? "Analyzing..." : "Personalized tips"}
      </button>

      {/* AI結果 */}
      {ai.data && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            {ai.data.summary || "サマリー"}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {(ai.data.suggestions || []).map((s, i) => (
              <div key={i} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 800, color: "var(--taupe)" }}>
                  {s.title || "提案"}
                </div>
                <div style={{ marginTop: 4 }}>{s.detail || ""}</div>
                {(s.amount != null && s.unit) ? (
                  <div style={{ fontSize: 13, color: "var(--taupe)", marginTop: 6 }}>
                    目安量: {s.amount} {s.unit}
                  </div>
                ) : null}
                {Array.isArray(s.evidence) && s.evidence.length > 0 && (
                  <div style={{ fontSize: 12, color: "var(--taupe)", marginTop: 6 }}>
                    参考: {s.evidence.join(" / ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          {ai.data.disclaimer && (
            <div
              className="card"
              style={{ marginTop: 8, background: "var(--sand)", color: "#4a3e33" }}
            >
              {ai.data.disclaimer}
            </div>
          )}
        </div>
      )}

      {/* エラー時メッセージ + ローカル提案 */}
      {ai.error && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ color: "#a33", marginBottom: 6 }}>{ai.error}</div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Local tips</div>
          <div className="grid" style={{ gap: 8 }}>
            {localFallback.map((msg, i) => (
              <div key={i} className="card" style={{ padding: 12 }}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 戻る */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {onBack && (
          <button className="btn btn-ghost" onClick={onBack}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
