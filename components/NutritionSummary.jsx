// components/NutritionSummary.jsx
"use client";
import React, { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer
} from "recharts";

function calcScore(meals = []) {
  const tot = meals.reduce(
    (a, m) => ({
      protein: a.protein + (Number(m.protein) || 0),
      fat: a.fat + (Number(m.fat) || 0),
      carbs: a.carbs + (Number(m.carbs) || 0),
      calories: a.calories + (Number(m.calories) || 0),
    }),
    { protein: 0, fat: 0, carbs: 0, calories: 0 }
  );
  return {
    protein: Math.min(100, (tot.protein / 50) * 100),
    fats: Math.min(100, (tot.fat / 15) * 100),
    minerals: 60,
    vitamins: 60,
    energy: Math.min(100, (tot.calories / 800) * 100),
    fiber: 55,
    calcium: 55,
    phosphorus: 55,
  };
}

export default function NutritionSummary({ meals = [], dogProfile = {}, onNext }) {
  const score = useMemo(() => calcScore(meals), [meals]);
  const data = useMemo(
    () =>
      Object.entries(score).map(([label, value]) => ({ label, value })),
    [score]
  );

  // healthFocus を安全に
  const hf = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>8-Axis Nutrition Radar</h3>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar name="Today" dataKey="value" fill="#9db5a1" stroke="#9db5a1" fillOpacity={0.35} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {data.map((p) => (
          <div key={p.label} className="badge" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{p.label}</span>
            <b>{Math.round(p.value)}%</b>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        {hf.length > 0 && (
          <div style={{ color: "var(--taupe)", fontSize: 13 }}>
            Focus: {hf.join(", ")}
          </div>
        )}
      </div>

      {onNext && (
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onNext}>Daily Suggestions</button>
        </div>
      )}
    </div>
  );
}
