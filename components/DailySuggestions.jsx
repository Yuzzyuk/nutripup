// components/DailySuggestions.jsx
"use client";
import React, { useMemo } from "react";
import AiSuggestions from "./AiSuggestions";

// “念のため”のセーフ関数
const A = (v) => (Array.isArray(v) ? v : []);

export default function DailySuggestions({ meals = [], dogProfile = {}, onBack }) {
  const healthFocus = A(dogProfile?.healthFocus);

  // ざっくり栄養合計
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

  const targets = { protein: 50, fat: 15, calories: 800, fiber: 15, calcium: 1.0, phosphorus: 0.8 };

  const suggestions = useMemo(() => {
    const s = [];
    const deficit = (k) => Math.max(0, (targets[k] || 0) - (totals[k] || 0));
    const excess  = (k) => Math.max(0, (totals[k] || 0) - (targets[k] || 0));

    if (deficit("protein") > 0) s.push(`Protein is a bit low — add about ${Math.round(deficit("protein"))} g lean meat.`);
    if (deficit("fat") > 0)     s.push(`Essential fats slightly low — add ~${Math.round(deficit("fat"))} g salmon/fish oil.`);
    else if (excess("fat") > 0) s.push(`Fat is a bit high — trim/ reduce oil by ~${Math.round(excess("fat"))} g.`);
    if (deficit("calories") > 0) s.push(`Energy low — add ~${Math.round(deficit("calories"))} kcal (sweet potato/rice).`);
    if (deficit("fiber") > 0)    s.push(`Fiber low — add ~${Math.round(deficit("fiber"))} g veggies (pumpkin/carrots).`);
    if (deficit("calcium") > 0)  s.push(`Calcium low — add ~${Math.round(deficit("calcium") * 10) / 10} g eggshell powder.`);
    if (deficit("phosphorus") > 0) s.push(`Phosphorus low — small amounts of meat/organs (≈${Math.round(deficit("phosphorus")*10)/10} g P).`);

    if (healthFocus.includes("skin"))      s.push("Skin & coat — omega-3 fish + vitamin E.");
    if (healthFocus.includes("joints"))    s.push("Joints — green-lipped mussel or gelatin.");
    if (healthFocus.includes("kidneys"))   s.push("Kidneys — moderate phosphorus & hydration.");
    if (healthFocus.includes("digestion")) s.push("Digestion — gentle fiber & probiotics.");
    if (healthFocus.includes("weight"))    s.push("Weight — lean proteins + bulky veg for satiety.");
    if (healthFocus.includes("energy"))    s.push("Energy — ensure calories + essential fats.");

    return s.length ? s : ["Looks great today — nicely balanced! ✅"];
  }, [totals, healthFocus]);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Daily Suggestions</h2>

      {/* ローカル（即時）サジェスト */}
      <div className="grid" style={{ gap: 8, marginBottom: 8 }}>
        {suggestions.map((msg, i) => (
          <div key={i} className="card" style={{ padding: 12 }}>
            {msg}
          </div>
        ))}
      </div>

      {/* AI 栄養士（API 呼び出し） */}
      <AiSuggestions meals={meals} dogProfile={dogProfile} />

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {onBack && <button className="btn btn-ghost" onClick={onBack}>Back</button>}
      </div>
    </div>
  );
}
