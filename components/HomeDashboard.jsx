// components/HomeDashboard.jsx
"use client";
import React, { useMemo } from "react";
import NutritionSummary from "./NutritionSummary";
import HistoryChart from "./HistoryChart";
import { computeWeeklyScores } from "./utils/scoring";

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

  // ✅ 7日スコアを利用（謎の固定36%を廃止）
  const { radar, intake } = useMemo(
    () => computeWeeklyScores(dogProfile, history, meals),
    [dogProfile, history, meals]
  );
  const hasAnyIntake = useMemo(
    () => Object.values(intake || {}).some((v) => (Number(v) || 0) > 0),
    [intake]
  );
  const weekAvg = useMemo(() => {
    if (!hasAnyIntake || !Array.isArray(radar) || radar.length === 0) return null;
    const sum = radar.reduce((a, b) => a + (Number(b.value) || 0), 0);
    return Math.round(sum / radar.length);
  }, [radar, hasAnyIntake]);

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
        <div className="badge" aria-label="7-day coverage">
          {weekAvg == null ? "—" : `${weekAvg}%`}
        </div>
      </div>

      {/* ✅ 7日レーダー（history を渡す） */}
      <NutritionSummary meals={meals} dogProfile={dogProfile} history={history} onNext={onGoSuggestions} />

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
