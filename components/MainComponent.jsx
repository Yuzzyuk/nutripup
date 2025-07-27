// components/MainComponent.jsx
"use client";
import React, { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function MainComponent() {
  const [dogProfile, setDogProfile] = useState({
    name: "",
    age: "",
    breed: "",
    weight: "",
    activityLevel: "",
    healthFocus: [],
  });

  const [dailyMeals, setDailyMeals] = useState([]);

  const calculateNutritionScore = (meals) => {
    // dummy values to make it work for now
    return {
      protein: 60,
      fats: 40,
      minerals: 70,
      vitamins: 50,
      energy: 65,
      fiber: 45,
      calcium: 55,
      phosphorus: 50,
    };
  };

  const getSuggestions = () => {
    return [
      "Add lean protein like chicken or fish",
      "Include healthy fats like salmon or fish oil",
      "Add fiber-rich vegetables like sweet potato",
    ];
  };

  const radarPoints = Object.entries(calculateNutritionScore(dailyMeals)).map(
    ([label, value]) => ({ label, value })
  );

  return (
    <div className="min-h-screen bg-white p-4 text-center">
      <h1 className="text-3xl font-bold mb-2">
        {dogProfile.name || "NutriPup Dashboard"}
      </h1>
      <p className="text-lg mb-4">
        Overall Nutrition Score:{" "}
        {Math.round(
          Object.values(calculateNutritionScore(dailyMeals)).reduce((a, b) => a + b, 0) / 8
        )}
        %
      </p>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <RadarChart data={radarPoints}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar
              name="Your Dog"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 text-left">
        <h2 className="text-xl font-semibold">💡 Quick Suggestions</h2>
        <ul className="list-disc list-inside">
          {getSuggestions().map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
