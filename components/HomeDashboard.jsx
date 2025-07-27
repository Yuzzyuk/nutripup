// components/HomeDashboard.jsx
"use client";
import React from "react";
import NutritionSummary from "./NutritionSummary";
import HistoryChart from "./HistoryChart";

export default function HomeDashboard({
  dogProfile,
  meals,
  history,
  onGoMeals,
  onGoSuggestions,
  onGoHistory,
}) {
  return (
    <>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>
          {dogProfile?.name ? `${dogProfile.name} — Today` : "Today"}
        </h2>
        <div style={{ color: "var(--taupe)", marginBottom: 8 }}>
          Quick overview of nutrition balance and trends.
        </div>
        <NutritionSummary
          meals={meals}
          dogProfile={dogProfile}
          onNext={onGoSuggestions}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onGoMeals}>Add Meals</button>
          <button className="btn btn-primary" onClick={onGoHistory} style={{ flex: 1 }}>View History</button>
        </div>
      </section>

      <div style={{ height: 8 }} />

      <HistoryChart history={history} />
    </>
  );
}
