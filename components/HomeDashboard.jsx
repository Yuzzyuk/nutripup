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
  onGoMeals,         // ← ヘッダー右上のみで使用（フッターは使わない）
  onGoSuggestions,   // 未使用（ボタン廃止）
  onGoHistory,       // 未使用（ボタン廃止）
}) {
  // dogProfile を安全に扱う
  const name = (dogProfile?.name ?? "").toString();
  const breed = (dogProfile?.breed ?? "").toString();
  const weight = dogProfile?.weight ?? "";
  const weightUnit = dogProfile?.weightUnit || "kg";
  const activityLevel = dogProfile?.activityLevel || "Moderate";
  const photo = dogProfile?.photo || "";
  const healthFocus = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];

  // ✅ 週の達成率：摂取合計がゼロなら必ず 0%
  const weeklyOverall = useMemo(() => {
    const { radar, intake } = computeWeeklyScores(dogProfile, history, meals);

    const totalIntake =
      (intake?.energy_kcal || 0) +
      (intake?.protein_g || 0) +
      (intake?.fat_g || 0) +
      (intake?.calcium_g || 0) +
      (intake?.phosphorus_g || 0) +
      (intake?.omega3_g || 0);

    if (!totalIntake) return 0; // ← 初回0%固定

    const values = Array.isArray(radar) ? radar.map(r => Number(r.value) || 0) : [];
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return Math.round(Math.max(0, Math.min(100, avg)));
  }, [dogProfile, history, meals]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      {/* ヘッダー（右上に Add Meals。Home 下部には一切ボタンなし） */}
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

        {/* 右上だけに配置（Home 下部はボタン無し） */}
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

      {/* 最近の推移（＝History）。別画面は作っていません。 */}
      <HistoryChart history={history} />
    </div>
  );
}
