// components/NutritionSummary.jsx
"use client";
import React, { useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer
} from "recharts";
import {
  sumWindow, windowTargets, weeklyProgress, weeklyGaps
} from "./utils/nutrition";

/**
 * 直近N日（デフォ7日）の達成率でレーダー表示
 * props:
 *  - meals: 今日の入力（未保存ぶん）
 *  - history: [{date, meals, score?}, ...]
 *  - dogProfile
 *  - periodDays: number (default 7)
 *  - onNext: ()=>void
 */
export default function NutritionSummary({
  meals = [],
  history = [],
  dogProfile = {},
  periodDays = 7,
  onNext
}) {
  // 7日合計
  const weekSum = useMemo(
    () => sumWindow({ history, mealsToday: meals, days: periodDays }),
    [history, meals, periodDays]
  );

  // 7日目標
  const target7 = useMemo(
    () => windowTargets(dogProfile, periodDays),
    [dogProfile, periodDays]
  );

  // 達成率（％）
  const progress = useMemo(
    () => weeklyProgress(weekSum, target7),
    [weekSum, target7]
  );

  // レーダー用データ
  const data = useMemo(() => ([
    { label: "protein",    value: progress.protein },
    { label: "fats",       value: progress.fats },
    { label: "energy",     value: progress.energy },
    { label: "fiber",      value: progress.fiber },
    { label: "calcium",    value: progress.calcium },
    { label: "phosphorus", value: progress.phosphorus },
    { label: "minerals",   value: progress.minerals },
    { label: "vitamins",   value: progress.vitamins },
  ]), [progress]);

  // 不足の大きい順に上位3つ
  const gaps = useMemo(() => {
    const g = weeklyGaps(weekSum, target7);
    const pairs = Object.entries(g);
    pairs.sort((a,b) => (Number(b[1])||0) - (Number(a[1])||0));
    return pairs.slice(0,3);
  }, [weekSum, target7]);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>
        8-Axis Nutrition Radar <span className="badge" style={{ marginLeft: 8 }}>{periodDays}-day</span>
      </h3>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar name="Progress" dataKey="value" fill="#9db5a1" stroke="#9db5a1" fillOpacity={0.35} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 達成率のバッジ */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {data.map((p) => (
          <div key={p.label} className="badge" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{p.label}</span>
            <b>{Math.round(p.value)}%</b>
          </div>
        ))}
      </div>

      {/* 今週の不足トップ3（残量の目安） */}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 800, color: "var(--taupe)", marginBottom: 6 }}>Gaps toward weekly target</div>
        <div className="grid" style={{ gap: 8 }}>
          {gaps.map(([k, v]) => (
            <div key={k} className="card" style={{ padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ textTransform: "capitalize" }}>{k}</div>
                <div style={{ fontWeight: 800 }}>
                  {k === "calories" ? `${v} kcal` :
                   (k === "calcium" || k === "phosphorus") ? `${v} g` :
                   `${v} g`}
                </div>
              </div>
              <div style={{ color: "var(--taupe)", fontSize: 13, marginTop: 2 }}>
                今週の目標までの残り。次の数食で補っていきましょう。
              </div>
            </div>
          ))}
          {gaps.length === 0 && (
            <div className="card" style={{ padding: 10, color: "var(--taupe)" }}>
              大変良いバランスです。今週の目標は概ね達成できています。✅
            </div>
          )}
        </div>
      </div>

      {onNext && (
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-ghost" onClick={onNext}>Daily Suggestions</button>
        </div>
      )}
    </div>
  );
}
