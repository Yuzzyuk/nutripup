// components/WeeklyStatus.jsx
"use client";
import React, { useMemo } from "react";
import { computeWeeklyScores } from "./utils/scoring";

// ISO週（週の開始＝月曜）で 今日が 1〜7日の何日目か
function isoWeekDay(d = new Date()) {
  const js = d.getDay(); // 0(Sun)〜6(Sat)
  return ((js + 6) % 7) + 1; // Mon=1 ... Sun=7
}
function weekDayLabel(d = new Date()) {
  return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][isoWeekDay(d)-1];
}

export default function WeeklyStatus({ dogProfile = {}, history = [], meals = [] }) {
  const { radar } = useMemo(
    () => computeWeeklyScores(dogProfile, history, meals),
    [dogProfile, history, meals]
  );

  // 6軸（Energy/Protein/Fat/Calcium/Phosphorus/Omega-3）の平均＝週の“総合達成率”
  const overall = useMemo(() => {
    if (!radar?.length) return 0;
    const avg = radar.reduce((a, b) => a + (Number(b.value) || 0), 0) / radar.length;
    return Math.round(Math.max(0, Math.min(100, avg)));
  }, [radar]);

  const day = isoWeekDay();
  const label = weekDayLabel();

  return (
    <div className="card" style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800 }}>
          Week progress
          <span className="badge" style={{ marginLeft: 8 }}>Day {day}/7 ({label})</span>
        </div>
        <div style={{ fontWeight: 800, color: "var(--taupe)" }}>{overall}%</div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%", height: 12, borderRadius: 999,
        background: "var(--sand)", overflow: "hidden"
      }}>
        <div style={{
          width: `${overall}%`,
          height: "100%", background: "var(--moss)"
        }} />
      </div>

      {/* 軽い補足（必要なら） */}
      <div style={{ color: "var(--taupe)", fontSize: 12 }}>
        直近7日（今日を含む）の Energy / Protein / Fat / Ca / P / Omega-3 の平均達成率です。
      </div>
    </div>
  );
}
