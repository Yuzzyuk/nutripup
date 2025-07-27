// components/DailySuggestions.jsx
"use client";
import React, { useMemo } from "react";

// “念のため”のセーフ関数
const A = (v) => (Array.isArray(v) ? v : []);

export default function DailySuggestions({ meals = [], dogProfile = {}, onBack }) {
  // healthFocus が undefined でも安全に扱う
  const healthFocus = A(dogProfile?.healthFocus);

  // ざっくり栄養合計（数字以外は 0 扱い）
  const totals = useMemo(() => {
    return (Array.isArray(meals) ? meals : []).reduce(
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
  }, [meals]);

  // 目安ターゲット（MVPの仮値）
  const targets = {
    protein: 50,
    fat: 15,
    calories: 800,
    fiber: 15,
    calcium: 1.0,      // g
    phosphorus: 0.8,   // g
  };

  // 足りない/過剰の判定と具体量（g）提案
  const suggestions = useMemo(() => {
    const s = [];

    // たとえば不足時の提案
    const deficit = (key) => Math.max(0, (targets[key] || 0) - (totals[key] || 0));
    const excess  = (key) => Math.max(0, (totals[key] || 0) - (targets[key] || 0));

    // タンパク質
    if (deficit("protein") > 0) {
      const need = Math.round(deficit("protein"));
      s.push(`Protein is a bit low — add about ${need} g of lean meat (e.g., chicken breast).`);
    }

    // 脂質（過剰/不足の両方に対応）
    if (deficit("fat") > 0) {
      const need = Math.round(deficit("fat"));
      s.push(`Essential fats are slightly low — add ~${need} g of salmon or fish oil.`);
    } else if (excess("fat") > 0) {
      const reduce = Math.round(excess("fat"));
      s.push(`Fat is a bit high — reduce fat sources by ~${reduce} g (trim skin or oil).`);
    }

    // カロリー
    if (deficit("calories") > 0) {
      const need = Math.round(deficit("calories"));
      s.push(`Energy is low — increase portion by ~${need} kcal (e.g., add sweet potato or rice).`);
    }

    // 食物繊維
    if (deficit("fiber") > 0) {
      const need = Math.round(deficit("fiber"));
      s.push(`Fiber is low — add ~${need} g of veggies (e.g., pumpkin, carrots).`);
    }

    // Ca / P バランス（MVPの仮ロジック）
    if (deficit("calcium") > 0) {
      const need = Math.round(deficit("calcium") * 10) / 10;
      s.push(`Calcium a bit low — add ~${need} g eggshell powder.`);
    }
    if (deficit("phosphorus") > 0) {
      const need = Math.round(deficit("phosphorus") * 10) / 10;
      s.push(`Phosphorus slightly low — add small amounts of meat/organs (≈${need} g P).`);
    }

    // 健康フォーカス別の一言（★ここが includes を使うが、必ず配列なので安全）
    if (healthFocus.includes("skin")) {
      s.push("Skin & coat focus — consider omega-3 rich fish (sardine/salmon) and vitamin E.");
    }
    if (healthFocus.includes("joints")) {
      s.push("Joint support — try adding green-lipped mussel or collagen/gelatin sources.");
    }
    if (healthFocus.includes("kidneys")) {
      s.push("Kidney health — keep phosphorus moderate and ensure adequate hydration.");
    }
    if (healthFocus.includes("digestion")) {
      s.push("Digestive health — add gentle fiber (pumpkin) and consider probiotics.");
    }
    if (healthFocus.includes("weight")) {
      s.push("Weight management — balance calories with lean protein and veg for satiety.");
    }
    if (healthFocus.includes("energy")) {
      s.push("Energy & vitality — ensure enough calories and essential fats for stamina.");
    }

    if (s.length === 0) {
      s.push("Looks great today — nicely balanced! ✅");
    }
    return s;
  }, [totals, healthFocus]);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Daily Suggestions</h2>
      <div className="grid" style={{ gap: 8 }}>
        {suggestions.map((msg, i) => (
          <div key={i} className="card" style={{ padding: 12 }}>
            {msg}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {onBack && <button className="btn btn-ghost" onClick={onBack}>Back</button>}
      </div>
    </div>
  );
}
