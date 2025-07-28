// components/NutritionSummary.jsx
"use client";
import React, { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer
} from "recharts";

/** ───────── ターゲット（必要量）の算出 ─────────
 *  RER ≈ 70 * (kg^0.75)
 *  MER = RER * activityFactor（ざっくり）
 *  これをベースに各軸のターゲットをスケール（MVPの近似）
 */
function getTargets(dogProfile = {}, merHintKcal = 800) {
  const w = Number(dogProfile?.weight) || 0;
  const act = (dogProfile?.activityLevel || "Moderate").toLowerCase();
  const f = act.includes("high") ? 1.8 : act.includes("low") ? 1.3 : 1.6;

  // RER/MER（wが無い場合は既定）
  const rer = w > 0 ? 70 * Math.pow(w, 0.75) : 500;
  const mer = w > 0 ? rer * f : merHintKcal;

  // 基準800kcalに対するスケール
  const scale = mer / 800;

  // ターゲット（gまたはkcal）
  return {
    mer, // for info
    protein: 50 * (w ? Math.max(0.6, w / 20) : scale),     // 20kgで≈50g、体重でスケール
    fat:     15 * (w ? Math.max(0.6, w / 20) : scale),     // 20kgで≈15g
    energy:  mer,                                          // kcal
    fiber:   15 * scale,                                   // 800kcalで15g目安
    calcium: 1.0 * scale,                                  // 800kcalで1.0g
    phosphorus: 0.8 * scale,                               // 800kcalで0.8g
    omega3:  0.5 * scale,                                  // 800kcalで0.5g（EPA+DHA 目安）
    micronutrients: 1.0 * scale,                           // ユニット指標（ビタミン・微量ミネラル）
  };
}

// スコア：ターゲットに対して不足は線形減点、過剰は軸ごとにペナルティ係数
function scoreFromTarget(value, target, { overshootPenalty = 1.0 } = {}) {
  const v = Math.max(0, Number(value) || 0);
  const t = Math.max(1e-6, Number(target) || 0);
  if (v <= t) return Math.max(0, Math.min(100, (v / t) * 100));
  // 過剰時：ターゲット比の超過率に応じて減点（2倍で0点まで落ちるイメージ）
  const overRatio = (v - t) / t; // 0=ちょうど
  const penalty = overshootPenalty * overRatio * 100;
  return Math.max(0, Math.min(100, 100 - penalty));
}

function calcTotals(meals = []) {
  return (Array.isArray(meals) ? meals : []).reduce(
    (a, m) => ({
      protein: a.protein + (Number(m?.protein) || 0),
      fat: a.fat + (Number(m?.fat) || 0),
      carbs: a.carbs + (Number(m?.carbs) || 0),
      calories: a.calories + (Number(m?.calories) || 0),

      fiber: a.fiber + (Number(m?.fiber) || 0),
      calcium: a.calcium + (Number(m?.calcium) || 0),
      phosphorus: a.phosphorus + (Number(m?.phosphorus) || 0),
      omega3: a.omega3 + (Number(m?.omega3) || 0),

      vitaminUnits: a.vitaminUnits + (Number(m?.vitaminUnits) || 0),
      mineralUnits: a.mineralUnits + (Number(m?.mineralUnits) || 0),
    }),
    { protein: 0, fat: 0, carbs: 0, calories: 0, fiber: 0, calcium: 0, phosphorus: 0, omega3: 0, vitaminUnits: 0, mineralUnits: 0 }
  );
}

export default function NutritionSummary({ meals = [], dogProfile = {}, onNext }) {
  const totals = useMemo(() => calcTotals(meals), [meals]);
  const targets = useMemo(() => getTargets(dogProfile), [dogProfile]);

  // ミクロン軸はビタミン＋微量ミネラルの相対ユニット合算
  const microUnits = totals.vitaminUnits + totals.mineralUnits;

  // 軸ごとの過剰ペナルティ：脂質・エネルギー・カルシウム・リンは厳しめ、タンパク・繊維・ω3は緩め
  const scores = {
    protein:      scoreFromTarget(totals.protein,    targets.protein,     { overshootPenalty: 0.5 }),
    fats:         scoreFromTarget(totals.fat,        targets.fat,         { overshootPenalty: 1.0 }),
    energy:       scoreFromTarget(totals.calories,   targets.energy,      { overshootPenalty: 1.2 }),
    fiber:        scoreFromTarget(totals.fiber,      targets.fiber,       { overshootPenalty: 0.4 }),
    calcium:      scoreFromTarget(totals.calcium,    targets.calcium,     { overshootPenalty: 1.2 }),
    phosphorus:   scoreFromTarget(totals.phosphorus, targets.phosphorus,  { overshootPenalty: 1.2 }),
    omega3:       scoreFromTarget(totals.omega3,     targets.omega3,      { overshootPenalty: 0.6 }),
    micronutrients: scoreFromTarget(microUnits,      targets.micronutrients,{ overshootPenalty: 0.8 }),
  };

  const data = useMemo(
    () =>
      Object.entries(scores).map(([label, value]) => ({ label, value })),
    [scores]
  );

  // 再描画の安定化
  const chartKey = useMemo(() => {
    return `k-${meals.length}-${totals.protein}-${totals.fat}-${totals.calories}-${totals.fiber}-${totals.calcium}-${totals.phosphorus}-${totals.omega3}`;
  }, [meals.length, totals]);

  // 表示
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>8-Axis Nutrition Radar</h3>

      <div style={{ width: "100%", height: 300 }}>
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

      {/* スコアのチップ */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {data.map((p) => (
          <div key={p.label} className="badge" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{p.label}</span>
            <b>{Math.round(p.value)}%</b>
          </div>
        ))}
      </div>

      {/* 参考：今日のトータルとターゲット（デバッグや説明に） */}
      <div style={{ marginTop: 8, color: "var(--taupe)", fontSize: 12 }}>
        Target (scaled): Protein {targets.protein.toFixed(0)}g / Fat {targets.fat.toFixed(0)}g / Energy {Math.round(targets.energy)}kcal / Fiber {targets.fiber.toFixed(0)}g / Ca {targets.calcium.toFixed(2)}g / P {targets.phosphorus.toFixed(2)}g / ω3 {targets.omega3.toFixed(2)}g / Micro {targets.micronutrients.toFixed(2)}
      </div>

      {onNext && (
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onNext}>Daily Suggestions</button>
        </div>
      )}
    </div>
  );
}
