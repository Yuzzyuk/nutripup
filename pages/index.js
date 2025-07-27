// pages/index.js
"use client";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import ProfileSetup from "../components/ProfileSetup";
import MealInput from "../components/MealInput";
import NutritionSummary from "../components/NutritionSummary";
import DailySuggestions from "../components/DailySuggestions";
import HistoryChart from "../components/HistoryChart";

// --- 共通ミニ関数（NutritionSummaryに合わせた簡易版） ---
function kgFrom(weight, unit) {
  if (!weight) return 10;
  return unit === "lbs" ? Number(weight) / 2.20462 : Number(weight);
}
function activityFactor(level) {
  switch (level) {
    case "Low": return 1.4;
    case "High": return 2.0;
    default: return 1.6;
  }
}
function computeOverallScore(meals = [], dogProfile = {}) {
  const totals = (meals || []).reduce(
    (a, m) => ({
      protein: a.protein + (m.protein || 0),
      fat: a.fat + (m.fat || 0),
      carbs: a.carbs + (m.carbs || 0),
      calories: a.calories + (m.calories || 0),
      names: [...a.names, (m.name || "").toLowerCase()],
    }),
    { protein: 0, fat: 0, carbs: 0, calories: 0, names: [] }
  );

  const kg = kgFrom(dogProfile.weight, dogProfile.weightUnit || "kg");
  const rer = 70 * Math.pow(kg, 0.75);
  const mer = rer * activityFactor(dogProfile.activityLevel || "Moderate");
  const targets = {
    proteinG: Math.max(30, 2 * kg),
    fatG: Math.max(12, 1 * kg),
    energyKcal: Math.max(400, mer),
  };

  const plantBoost = ["carrot","broccoli","spinach","pumpkin","sweet potato","blueberries"]
    .some(v => totals.names.some(n => n.includes(v)));
  const omegaBoost = ["salmon","sardines"].some(v => totals.names.some(n => n.includes(v)));
  const calciumBoost = ["eggshell","egg shell","sardines"].some(v => totals.names.some(n => n.includes(v)));

  const protein = Math.min(100, (totals.protein / (targets.proteinG || 1)) * 100);
  const fats    = Math.min(100, (totals.fat / (targets.fatG || 1)) * 100);
  const energy  = Math.min(100, (totals.calories / (targets.energyKcal || 1)) * 100);
  const fiber   = Math.min(100, 50 + (plantBoost ? 25 : 0));
  const vitamins= Math.min(100, 40 + (plantBoost ? 40 : 0));
  const minerals= Math.min(100, 45 + (plantBoost ? 15 : 0) + (calciumBoost ? 20 : 0));
  const calcium = Math.min(100, 35 + (calciumBoost ? 50 : 0));
  const phosphorus = Math.min(100, 40 + (omegaBoost ? 20 : 0) + (plantBoost ? 10 : 0));

  const arr = [protein, fats, minerals, vitamins, energy, fiber, calcium, phosphorus];
  const overall = arr.reduce((a,b)=>a+b,0) / arr.length;
  return overall;
}

export default function Home() {
  const [step, setStep] = useState("profile");

  // プロフィール
  const [dogProfile, setDogProfile] = useState({
    name: "",
    age: "",
    breed: "",
    weight: "",
    weightUnit: "kg",
    activityLevel: "",
    healthFocus: [],
  });

  // 今日の食事
  const [meals, setMeals] = useState([]);

  // 履歴（[{date, meals, score}]）
  const [history, setHistory] = useState([]);

  // 起動時に localStorage から履歴を読む
  useEffect(() => {
    try {
      const raw = localStorage.getItem("np_history_v1");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // 履歴が変わるたび保存
  useEffect(() => {
    try {
      localStorage.setItem("np_history_v1", JSON.stringify(history));
    } catch {}
  }, [history]);

  // 今日を保存 → History に遷移
  const saveToday = () => {
    if (!meals || meals.length === 0) return;
    const score = computeOverallScore(meals, dogProfile);
    const todayIso = new Date().toISOString(); // ISOで保存
    const entry = { date: todayIso, meals: meals, score };
    setHistory(prev => [...prev, entry]);
    setMeals([]); // クリア（好みで残してもOK）
    setStep("history");
  };

  return (
    <Layout step={step} setStep={setStep}>
      {step === "profile" && (
        <ProfileSetup
          dogProfile={dogProfile}
          setDogProfile={setDogProfile}
          onContinue={() => setStep("meals")}
        />
      )}

      {step === "meals" && (
        <MealInput
          meals={meals}
          setMeals={setMeals}
          dogName={dogProfile.name}
          onNext={() => setStep("summary")}
          onBack={() => setStep("profile")}
        />
      )}

      {step === "summary" && (
        <>
          <NutritionSummary
            meals={meals}
            dogProfile={dogProfile}
            onNext={() => setStep("suggestions")}
            onBack={() => setStep("meals")}
          />
          {/* Save Day ボタン（同じ画面の下に追加表示） */}
          <div className="card" style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep("history")}>View History</button>
            <button className="btn btn-primary" onClick={saveToday} style={{ flex: 1 }}>
              Save Day & View History
            </button>
          </div>
        </>
      )}

      {step === "suggestions" && (
        <DailySuggestions
          meals={meals}
          dogProfile={dogProfile}
          onBack={() => setStep("history")}
        />
      )}

      {step === "history" && (
        <>
          <HistoryChart history={history} />
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, color: "var(--taupe)", marginBottom: 8 }}>
              Recent Days
            </div>
            {history.length === 0 ? (
              <div>まだ履歴がありません。</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {history.slice(-7).reverse().map((d, i) => (
                  <div key={i} className="card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>{new Date(d.date).toLocaleDateString()}</div>
                      <div style={{ fontWeight: 700 }}>{Math.round(d.score)}%</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--taupe)" }}>
                      {d.meals.length} items logged
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setStep("profile")}>Back to Profile</button>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
