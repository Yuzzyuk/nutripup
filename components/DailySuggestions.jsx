// components/DailySuggestions.jsx
"use client";
import React, { useMemo } from "react";

function kgFrom(weight, unit) {
  if (!weight) return 10;
  return unit === "lbs" ? Number(weight) / 2.20462 : Number(weight);
}
function activityFactor(level) {
  switch (level) {
    case "Low": return 1.4;
    case "High": return 2.0;
    default: return 1.6;
  }
}

export default function DailySuggestions({ meals = [], dogProfile = {}, onBack }) {
  const totals = useMemo(() => {
    return (meals || []).reduce(
      (a, m) => ({
        protein: a.protein + (m.protein || 0),
        fat: a.fat + (m.fat || 0),
        carbs: a.carbs + (m.carbs || 0),
        calories: a.calories + (m.calories || 0),
        names: [...a.names, (m.name || "").toLowerCase()],
      }),
      { protein: 0, fat: 0, carbs: 0, calories: 0, names: [] }
    );
  }, [meals]);

  const targets = useMemo(() => {
    const kg = kgFrom(dogProfile.weight, dogProfile.weightUnit || "kg");
    const rer = 70 * Math.pow(kg, 0.75);
    const mer = rer * activityFactor(dogProfile.activityLevel || "Moderate");
    return {
      proteinG: Math.max(30, 2 * kg),
      fatG: Math.max(12, 1 * kg),
      energyKcal: Math.max(400, mer),
    };
  }, [dogProfile]);

  // 不足量を元に「具体的に何g足すか」を計算（MVP向けの簡易計算）
  const proteinGap = Math.max(0, targets.proteinG - totals.protein); // g
  const fatGap = Math.max(0, targets.fatG - totals.fat);             // g
  const energyGap = Math.max(0, targets.energyKcal - totals.calories); // kcal

  // チキン胸肉のたんぱく質 31g/100g → 0.31 g/g
  const addChickenG = proteinGap > 0 ? Math.ceil(proteinGap / 0.31) : 0;

  // サーモン脂質 14g/100g → 0.14 g/g
  const addSalmonG = fatGap > 0 ? Math.max(5, Math.ceil(fatGap / 0.14)) : 0;

  // さつまいも 86 kcal/100g → 0.86 kcal/g
  const addSweetPotatoG = energyGap > 0 ? Math.ceil(energyGap / 0.86) : 0;

  // 野菜・ビタミン軽い提案（固定）
  const needVeg = !["carrot","broccoli","spinach","pumpkin","sweet potato","blueberries"].some(
    v => totals.names.some(n => n.includes(v))
  );

  const tips = [];
  if (proteinGap > 5) tips.push(`たんぱく質が不足気味：チキン胸肉を約 ${addChickenG} g 追加すると目標に近づきます。`);
  if (fatGap > 3) tips.push(`必須脂肪がやや不足：サーモンを約 ${addSalmonG} g 追加（オメガ3の補強にも◎）。`);
  if (energyGap > 30) tips.push(`エネルギーが少なめ：さつまいもを約 ${addSweetPotatoG} g 追加でカロリー補完。`);
  if (needVeg) tips.push("ビタミン・食物繊維強化：にんじん／ブロッコリー／かぼちゃを 30–50 g 追加がおすすめ。");
  tips.push("カルシウムの微調整には卵殻パウダー ~1 g を検討（かかりつけ医と相談しながら）。");

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Daily Suggestions 💡</h2>
      <div style={{ color: "var(--taupe)", marginBottom: 8 }}>
        {dogProfile.name ? `${dogProfile.name} のための提案` : "今日の提案"}
      </div>

      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {tips.map((t, i) => (
          <li key={i} style={{ marginBottom: 8 }}>{t}</li>
        ))}
      </ul>

      <div style={{ fontSize: 13, color: "var(--taupe)", marginTop: 12 }}>
        ※ 本MVPは一般的な目安です。既往症や個別の栄養管理は獣医師へご相談ください。
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        {onBack && <button className="btn btn-ghost" onClick={onBack}>Back</button>}
      </div>
    </section>
  );
}
