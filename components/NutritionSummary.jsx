// components/NutritionSummary.jsx
"use client";
import React, { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip
} from "recharts";

function kgFrom(weight, unit) {
  if (!weight) return 10; // fallback
  return unit === "lbs" ? Number(weight) / 2.20462 : Number(weight);
}

function activityFactor(level) {
  switch (level) {
    case "Low": return 1.4;
    case "High": return 2.0;
    default: return 1.6; // Moderate or unknown
  }
}

export default function NutritionSummary({ meals = [], dogProfile = {}, onNext, onBack }) {
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
    // ラフな目標値（MVP用の簡易推定）
    return {
      proteinG: Math.max(30, 2 * kg),  // 2 g/kg
      fatG: Math.max(12, 1 * kg),      // 1 g/kg
      energyKcal: Math.max(400, mer),
      fiberScoreBase: 50,
    };
  }, [dogProfile]);

  // ビタミン・ミネラル・Ca/Pは食材の存在でブースト（MVP簡易ロジック）
  const has = (s) => totals.names.some(n => n.includes(s));
  const plantBoost = ["carrot", "broccoli", "spinach", "pumpkin", "sweet potato", "blueberries"].some(has);
  const omegaBoost = ["salmon", "sardines"].some(has);
  const calciumBoost = ["eggshell", "egg shell", "sardines"].some(has);

  const scores = useMemo(() => {
    const protein = Math.min(100, (totals.protein / (targets.proteinG || 1)) * 100);
    const fats    = Math.min(100, (totals.fat / (targets.fatG || 1)) * 100);
    const energy  = Math.min(100, (totals.calories / (targets.energyKcal || 1)) * 100);
    const fiber   = Math.min(100, (targets.fiberScoreBase + (plantBoost ? 25 : 0)));
    const vitamins= Math.min(100, (40 + (plantBoost ? 40 : 0)));
    const minerals= Math.min(100, (45 + (plantBoost ? 15 : 0) + (calciumBoost ? 20 : 0)));
    const calcium = Math.min(100, (35 + (calciumBoost ? 50 : 0)));
    const phosphorus = Math.min(100, (40 + (omegaBoost ? 20 : 0) + (plantBoost ? 10 : 0)));

    return { protein, fats, minerals, vitamins, energy, fiber, calcium, phosphorus };
  }, [totals, targets, plantBoost, omegaBoost, calciumBoost]);

  const chartData = [
    { label: "Protein",      value: Math.round(scores.protein) },
    { label: "Essential Fats", value: Math.round(scores.fats) },
    { label: "Minerals",     value: Math.round(scores.minerals) },
    { label: "Vitamins",     value: Math.round(scores.vitamins) },
    { label: "Energy",       value: Math.round(scores.energy) },
    { label: "Fiber",        value: Math.round(scores.fiber) },
    { label: "Calcium",      value: Math.round(scores.calcium) },
    { label: "Phosphorus",   value: Math.round(scores.phosphorus) },
  ];

  const overall = Math.round(
    chartData.reduce((a, b) => a + b.value, 0) / chartData.length
  );

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>
        Nutrition Summary {dogProfile.name ? `for ${dogProfile.name}` : ""} 📊
      </h2>
      <div style={{ marginBottom: 8, color: "var(--taupe)" }}>
        Overall Score: <strong>{overall}%</strong>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar name="Today" dataKey="value" stroke="#8B7355" fill="#9DB5A1" fillOpacity={0.5} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 数値グリッド */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        {chartData.map((p) => (
          <div key={p.label} className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 12, color: "var(--taupe)" }}>{p.label}</div>
            <div style={{ fontWeight: 800 }}>{p.value}%</div>
          </div>
        ))}
      </div>

      {/* 合計メモ */}
      <div style={{ fontSize: 14, color: "var(--taupe)", marginTop: 12 }}>
        Totals today: {Math.round(totals.calories)} kcal • {totals.protein.toFixed(1)}g P • {totals.fat.toFixed(1)}g F • {totals.carbs.toFixed(1)}g C
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        {onBack && <button className="btn btn-ghost" onClick={onBack}>Back</button>}
        {onNext && <button className="btn btn-primary" onClick={onNext} style={{ flex: 1 }}>See Tips</button>}
      </div>
    </section>
  );
}
