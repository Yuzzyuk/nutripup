// components/HomeDashboard.jsx
"use client";
import React, { useMemo } from "react";
import NutritionSummary from "./NutritionSummary";
import HistoryChart from "./HistoryChart";

/**
 * NutritionSummary と同じ方針：
 * 入力無し → 全軸 0%、平均も 0%
 */
function calcScoreForToday(meals = []) {
  if (!Array.isArray(meals) || meals.length === 0) {
    return {
      protein: 0, fats: 0, minerals: 0, vitamins: 0,
      energy: 0, fiber: 0, calcium: 0, phosphorus: 0,
    };
  }

  const tot = meals.reduce(
    (a, m) => ({
      protein: a.protein + (Number(m?.protein) || 0),
      fat: a.fat + (Number(m?.fat) || 0),
      calories: a.calories + (Number(m?.calories) || 0),
      fiber: a.fiber + (Number(m?.fiber) || 0),
      calcium: a.calcium + (Number(m?.calcium) || 0),
      phosphorus: a.phosphorus + (Number(m?.phosphorus) || 0),
      vitaminScore: a.vitaminScore + (Number(m?.vitamin_score) || 0),
      mineralScore: a.mineralScore + (Number(m?.mineral_score) || 0),
    }),
    { protein: 0, fat: 0, calories: 0, fiber: 0, calcium: 0, phosphorus: 0, vitaminScore: 0, mineralScore: 0 }
  );

  const targets = {
    protein: 50, fat: 15, calories: 800, fiber: 15, calcium: 1.0, phosphorus: 0.8,
    vitaminScore: 1.0, mineralScore: 1.0,
  };
  const pct = (v, t) => (t > 0 ? Math.min(100, (v / t) * 100) : 0);

  const obj = {
    protein: pct(tot.protein, targets.protein),
    fats: pct(tot.fat, targets.fat),
    energy: pct(tot.calories, targets.calories),
    fiber: pct(tot.fiber, targets.fiber),
    calcium: pct(tot.calcium, targets.calcium),
    phosphorus: pct(tot.phosphorus, targets.phosphorus),
    vitamins: pct(tot.vitaminScore, targets.vitaminScore),
    minerals: pct(tot.mineralScore, targets.mineralScore),
  };

  return obj;
}

export default function HomeDashboard({
  dogProfile = {},
  meals = [],
  history = [],
  onGoMeals,
  onGoSuggestions,
  onGoHistory,
}) {
  const name = (dogProfile?.name ?? "").toString();
  const breed = (dogProfile?.breed ?? "").toString();
  const weight = dogProfile?.weight ?? "";
  const weightUnit = dogProfile?.weightUnit || "kg";
  const activityLevel = dogProfile?.activityLevel || "Moderate";
  const photo = dogProfile?.photo || "";
  const healthFocus = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];

  // 今日の平均スコア：ダミー値を一切使わず、無入力なら 0%
  const todayScore = useMemo(() => {
    const s = calcScoreForToday(meals);
    const avg = Object.values(s).reduce((a, b) => a + b, 0) / 8;
    return Math.round(avg);
  }, [meals]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      {/* ヘッダーカード */}
      <div className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: "50%", overflow: "hidden",
            background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(0,0,0,.06)"
          }}
          aria-label="Dog avatar"
        >
          {photo ? (
            <img src={photo} alt="Dog" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 28 }}>🐶</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>
            {name || "Your Dog"} {weight ? `• ${weight}${weightUnit}` : ""} {breed ? `• ${breed}` : ""}
          </div>
          <div style={{ color: "var(--taupe)", fontSize: 13 }}>
            Activity: {activityLevel} {healthFocus.length ? `• Focus: ${healthFocus.join(", ")}` : ""}
          </div>
        </div>
        <div className="badge" aria-label="Today average score">
          {todayScore}%
        </div>
      </div>

      {/* レーダー（栄養サマリー） */}
      <NutritionSummary meals={meals} dogProfile={dogProfile} onNext={onGoSuggestions} />

      {/* 最近の推移 */}
      <HistoryChart history={history} />

      {/* ショートカット */}
      <div className="card" style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={onGoMeals} style={{ flex: 1 }}>
          Add Meals
        </button>
        <button className="btn btn-ghost" onClick={onGoSuggestions}>
          Suggestions
        </button>
        <button className="btn btn-ghost" onClick={onGoHistory}>
          History
        </button>
      </div>
    </div>
  );
}
