// components/DailySuggestions.jsx
"use client";
import React, { useMemo, useState } from "react";

// 安全ガード
const A = (v) => (Array.isArray(v) ? v : []);

export default function DailySuggestions({ meals = [], dogProfile = {}, onBack }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiData, setAiData] = useState(null); // { summary, suggestions: [{title, detail, amount, unit}] }

  const healthFocus = A(dogProfile?.healthFocus);
  const hasMeals = Array.isArray(meals) && meals.length > 0;

  // 合計
  const totals = useMemo(() => {
    if (!hasMeals) {
      return { protein: 0, fat: 0, carbs: 0, calories: 0, fiber: 0, calcium: 0, phosphorus: 0 };
    }
    return meals.reduce(
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
  }, [meals, hasMeals]);

  // 目安（MVP）
  const targets = {
    protein: 50,
    fat: 15,
    calories: 800,
    fiber: 15,
    calcium: 1.0,     // g
    phosphorus: 0.8,  // g
  };

  // ローカルの簡易サジェスト
  const localTips = useMemo(() => {
    if (!hasMeals) return [];
    const tip = [];

    const deficit = (k) => Math.max(0, (targets[k] || 0) - (totals[k] || 0));
    const excess  = (k) => Math.max(0, (totals[k] || 0) - (targets[k] || 0));

    if (deficit("protein") > 0) {
      const need = Math.round(deficit("protein"));
      tip.push(`タンパク質がやや不足：鶏胸肉などの赤身を +${need} g 目安で。`);
    }
    if (deficit("fat") > 0) {
      const need = Math.round(deficit("fat"));
      tip.push(`必須脂肪が少なめ：サーモンやフィッシュオイルを 約 ${need} g 追加。`);
    } else if (excess("fat") > 0) {
      const cut = Math.round(excess("fat"));
      tip.push(`脂質が高め：皮や油を約 ${cut} g 減らしましょう。`);
    }
    if (deficit("calories") > 0) {
      const need = Math.round(deficit("calories"));
      tip.push(`カロリー不足：さつまいも/米などで +${need} kcal 目安で。`);
    }
    if (deficit("fiber") > 0) {
      const need = Math.round(deficit("fiber"));
      tip.push(`食物繊維が少なめ：かぼちゃ/にんじんを 約 ${need} g。`);
    }
    if (deficit("calcium") > 0) {
      const need = Math.round(deficit("calcium") * 10) / 10;
      tip.push(`カルシウムが不足：卵殻カルシウム 約 ${need} g。`);
    }
    if (deficit("phosphorus") > 0) {
      const need = Math.round(deficit("phosphorus") * 10) / 10;
      tip.push(`リンが不足：赤身/内臓を少量追加（目安 リン ${need} g）。`);
    }

    // フォーカス別の一言
    if (healthFocus.includes("skin")) {
      tip.push("皮膚・被毛：オメガ3（いわし/サーモン）＋ビタミンEを少量。");
    }
    if (healthFocus.includes("joints")) {
      tip.push("関節：緑イ貝やゼラチン/コラーゲン源を活用。");
    }
    if (healthFocus.includes("kidneys")) {
      tip.push("腎：リンを控えめに、水分を十分に。");
    }
    if (healthFocus.includes("digestion")) {
      tip.push("消化：やさしい繊維（かぼちゃ）＋プロバイオティクスを検討。");
    }
    if (healthFocus.includes("weight")) {
      tip.push("体重管理：高たんぱく・低脂肪＋野菜で満足感を。");
    }
    if (healthFocus.includes("energy")) {
      tip.push("エネルギー：十分なカロリーと必須脂肪を確保。");
    }

    if (tip.length === 0) tip.push("今日はバランス良好。素晴らしい仕上がりです ✅");
    return tip;
  }, [hasMeals, totals, targets, healthFocus]);

  // AI呼び出し（/api/suggest）
  const runAI = async () => {
    setAiLoading(true);
    setAiError("");
    setAiData(null);
    try {
      const r = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dogProfile, meals }),
      });
      if (!r.ok) throw new Error("AI request failed");
      const json = await r.json();
      setAiData(json);
    } catch (e) {
      setAiError("AIの提案を取得できませんでした。時間をおいて再度お試しください。");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>Daily Suggestions</h2>

      {/* 食事未入力の空状態 */}
      {!hasMeals && (
        <div className="card" style={{ background: "var(--cloud)" }}>
          <div style={{ color: "var(--taupe)" }}>
            まだ今日の食事が入力されていません。<b>Add Meals</b> から追加すると提案が表示されます。
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            {onBack && (
              <button className="btn btn-ghost" onClick={onBack}>
                Back
              </button>
            )}
          </div>
        </div>
      )}

      {/* ローカルの簡易サジェスト */}
      {hasMeals && (
        <>
          <div className="badge" style={{ marginBottom: 10 }}>Quick tips</div>
          <div className="grid" style={{ gap: 8 }}>
            {localTips.map((msg, i) => (
              <div key={i} className="card" style={{ padding: 12 }}>{msg}</div>
            ))}
          </div>
        </>
      )}

      {/* AI 栄養士の提案 */}
      <div className="card" style={{ marginTop: 12, background: "#fff7f0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 800, color: "#8b7355" }}>AI Nutritionist</div>
          <button
            className="btn btn-primary"
            onClick={runAI}
            disabled={aiLoading || !hasMeals}
            title={!hasMeals ? "まずは Meals を追加してください" : "Ask AI"}
          >
            {aiLoading ? "Thinking…" : "Ask AI for personalized tips"}
          </button>
        </div>

        {!hasMeals && (
          <div style={{ marginTop: 8, color: "var(--taupe)", fontSize: 14 }}>
            ※ 食事データがないと AI 提案は出せません。
          </div>
        )}

        {aiError && (
          <div className="card" style={{ marginTop: 8, padding: 12, background: "#ffecec", color: "#a33" }}>
            {aiError}
          </div>
        )}

        {aiData && (
          <div style={{ marginTop: 10 }}>
            {aiData.summary && (
              <div style={{ marginBottom: 8, color: "#8b7355" }}>{aiData.summary}</div>
            )}
            <div className="grid" style={{ gap: 8 }}>
              {A(aiData.suggestions).map((it, i) => (
                <div key={i} className="card" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700, color: "#8b7355" }}>
                    {it.title || "Suggestion"}
                  </div>
                  {it.detail && (
                    <div style={{ color: "var(--taupe)", fontSize: 14 }}>{it.detail}</div>
                  )}
                  {it.amount != null && it.unit && (
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--taupe)" }}>
                      {`${it.amount} ${it.unit}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 戻る */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {onBack && <button className="btn btn-ghost" onClick={onBack}>Back</button>}
      </div>
    </div>
  );
}
