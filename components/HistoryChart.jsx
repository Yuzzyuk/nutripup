// components/HistoryChart.jsx
"use client";
import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

export default function HistoryChart({ history = [] }) {
  const data = useMemo(() => {
    const arr = Array.isArray(history) ? history : [];
    return arr.slice(-7).map((d) => ({
      date: new Date(d.date).toLocaleDateString(),
      score: Math.round(Number(d.score) || 0),
    }));
  }, [history]);

  if (data.length === 0) {
    return (
      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Recent Trend</div>
        <div style={{ color: "var(--taupe)" }}>No history yet.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Recent Trend</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#9db5a1" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
