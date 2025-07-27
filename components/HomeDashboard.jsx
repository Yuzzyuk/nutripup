// components/HomeDashboard.jsx
"use client";
import React, { useMemo } from "react";
import NutritionSummary from "./NutritionSummary";
import HistoryChart from "./HistoryChart";

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

  const hasMeals = Array.isArray(meals) && meals.length > 0;

  // ✅ 今日の平均スコア：未入力なら 0 にする（固定値は使わない）
  const todayScore = useMemo(() => {
    if (!hasMeals) return 0;

    const tot = meals.reduce(
      (a, m) => ({
        protein: a.protein + (Number(m?.protein) || 0),
        fat: a.fat + (Number(m?.fat) || 0),
        carbs: a.carbs + (Number(m?.carbs) || 0),
        calories: a.calories + (Number(m?.calories) || 0),
      }),
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    );

    const scoreObj = {
      protein: Math.min(100, (tot.protein / 50) * 100),
      fats: Math.min(100, (tot.fat / 15) * 100),
      // 固定の60/55は廃止
      minerals: 0,
      vitamins: 0,
      energy: Math.min(100, (tot.calories / 800) * 100),
      fiber: 0,
      calcium: 0,
      phosphorus: 0,
    };
    const avg = Object.values(scoreObj).reduce((a, b) => a + b, 0) / 8;
    return Math.round(avg);
  }, [meals, hasMeals]);

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
