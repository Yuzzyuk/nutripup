// components/NutritionSummary.jsx
"use client";
import React, { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer
} from "recharts";

/**
 * スコア計算：
 * - 入力が無い（meals.length===0）→ 全軸 0%
 * - 入力がある → ターゲットに対する充足率で % を算出
 *   ※ vitamins/minerals はデータ未連携なら 0%（ダミー値は使わない）
 */
function calcScore(meals = []) {
  if (!Array.isArray(meals) || meals.length === 0) {
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

  // 合計
  const tot = meals.reduce(
    (a, m) => ({
      protein: a.protein + (Number(m.protein) || 0),
      fat: a.fat + (Number(m.fat) || 0),
      carbs: a.carbs + (Number(m.carbs) || 0),
      calories: a.calories + (Number(m.calories) || 0),
      fiber: a.fiber + (Number(m.fiber) || 0),
      calcium: a.calcium + (Number(m.calcium) || 0),
      phosphorus: a.phosphorus + (Number(m.phosphorus) || 0),
      // 将来：食材データに vitamin_score / mineral_score を持たせたら加算
      vitaminScore: a.vitaminScore + (Number(m.vitamin_score) || 0),
      mineralScore: a.mineralScore + (Number(m.mineral_score) || 0),
    }),
    {
      protein: 0, fat: 0, carbs: 0, calories: 0,
      fiber: 0, calcium: 0, phosphorus: 0,
      vitaminScore: 0, mineralScore: 0,
    }
  );

  // 目安ターゲット（MVPの暫定・1日あたり）
  // →「0 で初期化」することが今回の修正ポイント
  const targets = {
    protein: 50,     // g
    fat: 15,         // g
    calories: 800,   // kcal
    fiber: 15,       // g
    calcium: 1.0,    // g
    phosphorus: 0.8, // g
    // vitamins/minerals はスコア指標（0〜1 を前提）。未連携なら 0 扱い
    vitaminScore: 1.0,
    mineralScore: 1.0,
  };

  const pct = (val, tgt) => (tgt > 0 ? Math.min(100, (val / tgt) * 100) : 0);

  return {
    protein: pct(tot.protein, targets.protein),
    fats: pct(tot.fat, targets.fat),
    energy: pct(tot.calories, targets.calories),
    fiber: pct(tot.fiber, targets.fiber),
    calcium: pct(tot.calcium, targets.calcium),
    phosphorus: pct(tot.phosphorus, targets.phosphorus),

    // データ未連携なら 0（以前のような 60% のダミーは使わない）
    vitamins: targets.vitaminScore > 0
      ? Math.min(100, (tot.vitaminScore / targets.vitaminScore) * 100)
      : 0,
    minerals: targets.mineralScore > 0
      ? Math.min(100, (tot.mineralScore / targets.mineralScore) * 100)
      : 0,
  };
}

export default function NutritionSummary({ meals = [], dogProfile = {}, onNext }) {
  const score = useMemo(() => calcScore(meals), [meals]);
  const data = useMemo(
    () => Object.entries(score).map(([label, value]) => ({ label, value })),
    [score]
  );

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
