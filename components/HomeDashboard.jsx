// components/HomeDashboard.jsx
"use client";
import React, { useMemo } from "react";
import NutritionSummary from "./NutritionSummary";
// HistoryChartは残すなら使えるけど、今は非表示にする
// import HistoryChart from "./HistoryChart";

export default function HomeDashboard({
  dogProfile = {},
  meals = [],
  history = [],
  onGoMeals,
  onGoSuggestions, // 使わないが互換のため残す
  onGoHistory,     // 使わないが互換のため残す
}) {
  const name = (dogProfile?.name ?? "").toString();
  const breed = (dogProfile?.breed ?? "").toString();
  const weight = dogProfile?.weight ?? "";
  const weightUnit = dogProfile?.weightUnit || "kg";
  const activityLevel = dogProfile?.activityLevel || "Moderate";
  const photo = dogProfile?.photo || "";
  const healthFocus = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];

  // ★ 以前の todayScore（固定60%混入→平均36%になる原因）を完全削除

  return (
    <div className="grid" style={{ gap: 12 }}>
      {/* ヘッダー（スコアバッジを外してシンプル化） */}
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
        {/* ← バッジ（36%）は削除 */}
      </div>

      {/* レーダー（7日ロジックで反映。NutritionSummaryはそのまま） */}
      <NutritionSummary meals={meals} dogProfile={dogProfile} history={history} />

      {/* 下のTips/ショートカットは削除。Add Mealsだけ大きく */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <button
          className="btn btn-primary"
          onClick={onGoMeals}
          style={{
            width: "100%", minHeight: 64,
            fontSize: 18, fontWeight: 800, borderRadius: "var(--radius-lg)"
          }}
        >
          + Add Meals
        </button>
      </div>
    </div>
  );
}
