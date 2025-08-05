// components/HomeDashboard.jsx
"use client";
import React, { useMemo } from "react";
import NutritionSummary from "./NutritionSummary";
import HistoryChart from "./HistoryChart";
import DailySuggestions from "./DailySuggestions";

export default function HomeDashboard({
  dogProfile = {},
  meals = [],
  history = [],
  onAddMeals, // ← これを巨大CTAに接続
}) {
  // dogProfile を安全に扱う
  const name = (dogProfile?.name ?? "").toString();
  const breed = (dogProfile?.breed ?? "").toString();
  const weight = dogProfile?.weight ?? "";
  const weightUnit = dogProfile?.weightUnit || "kg";
  const activityLevel = dogProfile?.activityLevel || "Moderate";
  const photo = dogProfile?.photo || "";
  const healthFocus = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];

  // 今日のざっくりスコア（既存簡易ロジックのまま）
  const todayScore = useMemo(() => {
    const tot = (Array.isArray(meals) ? meals : []).reduce(
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
      minerals: 60,
      vitamins: 60,
      energy: Math.min(100, (tot.calories / 800) * 100),
      fiber: 55,
      calcium: 55,
      phosphorus: 55,
    };
    const avg = Object.values(scoreObj).reduce((a, b) => a + b, 0) / 8;
    return Math.round(avg);
  }, [meals]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      {/* ヘッダーカード */}
      <div className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%", overflow: "hidden",
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

      {/* レーダー（7日ロジックは NutritionSummary 側のscoringで維持） */}
      <NutritionSummary meals={meals} dogProfile={dogProfile} history={history} />

      {/* でかいCTA：Add Meals */}
      <div className="card" style={{ padding: 0 }}>
        <button
          className="btn btn-primary"
          onClick={onAddMeals}
          style={{
            width: "100%",
            minHeight: 64,
            borderRadius: "var(--radius-lg)",
            fontSize: 18,
          }}
        >
          + Add Meals
        </button>
      </div>

      {/* 最近の推移（残す） */}
      <HistoryChart history={history} />

      {/* AI（DailySuggestions をHome内に常駐） */}
      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>AI Nutritionist</div>
        <DailySuggestions meals={meals} dogProfile={dogProfile} />
      </div>
    </div>
  );
}
