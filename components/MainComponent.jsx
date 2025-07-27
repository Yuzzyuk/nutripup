// components/MainComponent.jsx
"use client";
import React, { useState } from "react";

export default function MainComponent() {
  // — State —
  const [currentStep, setCurrentStep] = useState("home");
  const [dogProfile, setDogProfile] = useState({
    name: "",
    age: "",
    breed: "",
    weight: "",
    activityLevel: "",
    healthFocus: [],
  });
  const [dailyMeals, setDailyMeals] = useState([]);
  // … other state …

  // — Utility functions (from your original) —
  const calculateNutritionScore = (meals) => {
    // your logic here…
  };
  const getSuggestions = () => {
    // your logic here…
  };

  // — Compute radar data —
  const nutritionScore = calculateNutritionScore(dailyMeals);
  const radarPoints = [
    { label: "Protein", value: nutritionScore.protein },
    { label: "Fats", value: nutritionScore.fats },
    { label: "Minerals", value: nutritionScore.minerals },
    { label: "Vitamins", value: nutritionScore.vitamins },
    { label: "Energy", value: nutritionScore.energy },
    { label: "Fiber", value: nutritionScore.fiber },
    { label: "Calcium", value: nutritionScore.calcium },
    { label: "Phosphorus", value: nutritionScore.phosphorus },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f3f0] to-[#e8ddd4] p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#8b7355]">
          {dogProfile.name || "NutriPup Dashboard"}
        </h1>
        <p className="text-lg text-[#a0916b]">
          Overall Nutrition Score:{" "}
          {Math.round(
            Object.values(nutritionScore).reduce((a, b) => a + b, 0) / 8
          )}
          %
        </p>
      </div>

      {/* Radar Chart (if you have recharts installed) */}
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <RadarChart data={radarPoints}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar
              name="Your Dog"
              dataKey="value"
              stroke="#9db5a1"
              fill="#9db5a1"
              fillOpacity={0.3}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Suggestions */}
      <div className="mt-6 bg-white p-4 rounded-2xl shadow">
        <h3 className="text-xl font-semibold text-[#8b7355] mb-2">
          💡 Quick Suggestions
        </h3>
        <ul className="list-disc list-inside text-[#8b7355]">
          {getSuggestions().map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setCurrentStep("meals")}
          className="flex-1 bg-[#9db5a1] text-white py-3 rounded-xl"
        >
          Add Meals
        </button>
        <button
          onClick={() => setCurrentStep("profile")}
          className="flex-1 bg-[#e8ddd4] text-[#8b7355] py-3 rounded-xl"
        >
          Dog Profile
        </button>
      </div>
    </div>
  );
}
