// components/NutritionSummary.jsx
"use client";
import React, { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer
} from "recharts";

/**
 * meals: [{ protein, fat, carbs, calories, fiber?, calcium?, phosphorus? }, ...]
 * 基準値（MVP仮）
 */
const TARGETS = {
  protein: 50,     // g
  fat: 15,         // g
  calories: 800,   // kcal
  fiber: 15,       // g
  calcium: 1.0,    // g
  phosphorus: 0.8, // g
};

function clamp0(x) { return Math.max(0, Number(x) || 0); }
function pct(value, target) {
  const v = clamp0(value);
  const t = Math.max(1e-6, target);
  return Math.min(100, (v / t) * 100);
}

function calcScore(meals = []) {
  // 合計（存在しないキーは 0）
  const tot = meals.reduce(
    (a, m) => ({
      protein: a.protein + clamp0(m?.protein),
      fat: a.fat + clamp0(m?.fat),
      carbs: a.carbs + clamp0(m?.carbs),
      calories: a.calories + clamp0(m?.calories),
      fiber: a.fiber + clamp0(m?.fiber),
      calcium: a.calcium + clamp0(m?.calcium),
      phosphorus: a.phosphorus + clamp0(m?.phosphorus),
    }),
    { protein: 0, fat: 0, carbs: 0, calories: 0, fiber: 0, calcium: 0, phosphorus: 0 }
  );

  // 実データで出せる軸は計算、なければ仮値
  const hasFiber = tot.fiber > 0;
  const hasCa    = tot.calcium > 0;
  const hasP     = tot.phosphorus > 0;

  return {
    protein: pct(tot.protein, TARGETS.protein),         // ★live
    fats:    pct(tot.fat,     TARGETS.fat),             // ★live
    minerals: 60,                                       // 仮
    vitamins: 60,                                       // 仮
    energy:  pct(tot.calories, TARGETS.calories),       // ★live
    fiber:   hasFiber ? pct(tot.fiber, TARGETS.fiber) : 55,
    calcium: hasCa    ? pct(tot.calcium, TARGETS.calcium) : 55,
    phosphorus: hasP  ? pct(tot.phosphorus, TARGETS.phosphorus) : 55,
    _totals: tot, // デバッグ用（UIでは使わない）
  };
}

export default function NutritionSummary({ meals = [], dogProfile = {}, onNext }) {
  const score = useMemo(() => calcScore(meals), [meals]);

  const data = useMemo(
    () =>
      Object.entries(score)
        .filter(([k]) => !k.startsWith("_"))
        .map(([label, value]) => ({ label, value })),
    [score]
  );

  // Recharts にキーを付けて安全に再描画
  const chartKey = useMemo(() => {
    const t = score._totals || {};
    return `k-${meals.length}-${t.protein}-${t.fat}-${t.calories}`;
  }, [meals.length, score]);

  // healthFocus は未使用でも安全化
  const hf = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>8-Axis Nutrition Radar</h3>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <RadarChart key={chartKey} data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar name="Today" dataKey="value" fill="#9db5a1" stroke="#9db5a1" fillOpacity={0.35} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* スコアのチップ（視認性＆検証用） */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {data.map((p) => (
          <div key={p.label} className="badge" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{p.label}</span>
            <b>{Math.round(p.value)}%</b>
          </div>
        ))}
      </div>

      {/* 説明（どの軸がライブか明示） */}
      <div style={{ marginTop: 8, color: "var(--taupe)", fontSize: 12 }}>
        Live: Protein / Fats / Energy（fiber, calcium, phosphorus は値が含まれていれば反映）。その他は仮スコア。
      </div>

      {hf.length > 0 && (
        <div style={{ color: "var(--taupe)", fontSize: 13, marginTop: 4 }}>
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
