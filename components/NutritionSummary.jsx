// components/NutritionSummary.jsx
"use client";
import React, { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer
} from "recharts";
import { computeWeeklyScores } from "./utils/scoring";

export default function NutritionSummary({ meals = [], dogProfile = {}, history = [], onNext }) {
  const { radar, scores } = useMemo(
    () => computeWeeklyScores(dogProfile, history, meals),
    [dogProfile, history, meals]
  );

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>7-Day Nutrition Radar (essentials)</h3>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <RadarChart data={radar}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis domain={[0, 120]} />
            <Radar name="7-day" dataKey="value" fill="#9db5a1" stroke="#9db5a1" fillOpacity={0.35} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Ca:P バランス（参考） */}
      <div className="badge" style={{ marginTop: 8 }}>
        Ca:P balance score {scores.ca_p_balance}（目標 1.2–1.5）
      </div>

      {onNext && (
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onNext}>Daily Suggestions</button>
        </div>
      )}
    </div>
  );
}
