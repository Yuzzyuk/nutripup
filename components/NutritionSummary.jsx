// components/NutritionSummary.jsx
"use client";
import React, { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer
} from "recharts";

function calcScore(meals = []) {
  const hasData = Array.isArray(meals) && meals.length > 0;

  if (!hasData) {
    // ✅ 何も入力されていない時は全部 0 に
    return {
      protein: 0,
      fats: 0,
      minerals: 0,
      vitamins: 0,
      energy: 0,
      fiber: 0,
      calcium: 0,
      phosphorus: 0,
    };
  }

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
    // ✅ 仮の固定値は使わない（全部実測ベース。将来必要ならここに計算を入れる）
    minerals: 0,
    vitamins: 0,
    energy: Math.min(100, (tot.calories / 800) * 100),
    fiber: 0,
    calcium: 0,
    phosphorus: 0,
  };
}

export default function NutritionSummary({ meals = [], dogProfile = {}, onNext }) {
  const score = useMemo(() => calcScore(meals), [meals]);
  const data = useMemo(
    () => Object.entries(score).map(([label, value]) => ({ label, value })),
    [score]
  );

  const hf = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];
  const hasMeals = Array.isArray(meals) && meals.length > 0;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>8-Axis Nutrition Radar</h3>

      {!hasMeals ? (
        <div style={{ padding: 12, color: "var(--taupe)" }}>
          まだ今日の食事が入力されていません。<b>Add Meals</b> から追加するとレーダーが更新されます。
        </div>
      ) : (
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
      )}

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {data.map((p) => (
          <div key={p.label} className="badge" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{p.label}</span>
            <b>{Math.round(p.value)}%</b>
          </div>
        ))}
      </div>

      {hf.length > 0 && (
        <div style={{ marginTop: 8, color: "var(--taupe)", fontSize: 13 }}>
          Focus: {hf.join(", ")}
        </div>
      )}

      {onNext && (
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onNext}>Daily Suggestions</button>
        </div>
      )}
    </div>
  );
}
