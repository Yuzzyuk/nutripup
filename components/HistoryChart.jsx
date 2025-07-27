// components/HistoryChart.jsx
"use client";
import React from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

export default function HistoryChart({ history = [] }) {
  // 直近7件だけに絞る（古い→新しい順）
  const data = history.slice(-7).map((d) => ({
    date: new Date(d.date).toLocaleDateString(),
    score: Math.round(d.score || 0)
  }));

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: 16 }}>
        まだ保存された日がありません。Summaryで「Save Day」を押すと、ここに表示されます。
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 8, color: "var(--taupe)" }}>
        Last 7 Days — Overall Score
      </div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="np" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9DB5A1" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#9DB5A1" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Area type="monotone" dataKey="score" stroke="#8B7355" fill="url(#np)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
