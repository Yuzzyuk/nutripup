// components/HomeDashboard.jsx
"use client";
import React, { useMemo } from "react";
import NutritionSummary from "./NutritionSummary";
import HistoryChart from "./HistoryChart";
import WeeklyStatus from "./WeeklyStatus";
import { computeWeeklyScores } from "./utils/scoring";

export default function HomeDashboard({
  dogProfile = {},
  meals = [],
  history = [],
  onGoMeals,         // ← ここはそのまま受け取ってヘッダー右上だけで使う
  onGoSuggestions,   // ← 使わない（下部ボタンを廃止）
  onGoHistory,       // ← 使わない（下部ボタンを廃止）
}) {
  // dogProfile を安全に扱う
  const name = (dogProfile?.name ?? "").toString();
  const breed = (dogProfile?.breed ?? "").toString();
  const weight = dogProfile?.weight ?? "";
  const weightUnit = dogProfile?.weightUnit || "kg";
  const activityLevel = dogProfile?.activityLevel || "Moderate";
  const photo = dogProfile?.photo || "";
  const healthFocus = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];

  // 週の達成率（履歴・今日の食事がゼロなら 0%）
  const weeklyOverall = useMemo(() => {
    const { radar } = computeWeeklyScores(dogProfile, history, meals);
    if (!radar || radar.length === 0) return 0;
    const avg = radar.reduce((a, b) => a + (Number(b.value) || 0), 0) / radar.length;
    return Math.round(Math.max(0, Math.min(100, avg)));
  }, [dogProfile, history, meals]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      {/* ヘッダー（右上に Add Meals、下部ボタンは一切なし） */}
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

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name || "Your Dog"} {weight ? `• ${weight}${weightUnit}` : ""} {breed ? `• ${breed}` : ""}
          </div>
          <div style={{ color: "var(--taupe)", fontSize: 13 }}>
            Activity: {activityLevel} {healthFocus.length ? `• Focus: ${healthFocus.join(", ")}` : ""}
          </div>
        </div>

        <div className="badge" aria-label="Weekly overall score">
          {weeklyOverall}%
        </div>

        {/* 右上だけに配置（Home 下部にはボタンを置かない） */}
        {onGoMeals && (
          <button className="btn btn-primary" onClick={onGoMeals} style={{ marginLeft: 8 }}>
            Add Meals
          </button>
        )}
      </div>

      {/* 週の進捗（Day x/7 + 進捗バー） */}
      <WeeklyStatus dogProfile={dogProfile} history={history} meals={meals} />

      {/* 7日レーダー（scoring.js に基づく） */}
      <NutritionSummary meals={meals} dogProfile={dogProfile} history={history} />

      {/* 最近の推移（履歴の可視化） */}
      <HistoryChart history={history} />
    </div>
  );
}
