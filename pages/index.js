// pages/index.js
"use client";
import { useState } from "react";
import Layout from "../components/Layout";
import ProfileSetup from "../components/ProfileSetup";
import MealInput from "../components/MealInput";
import NutritionSummary from "../components/NutritionSummary";
import DailySuggestions from "../components/DailySuggestions";

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

  // 今日の食事リスト
  const [meals, setMeals] = useState([]);

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
        <NutritionSummary
          meals={meals}
          dogProfile={dogProfile}
          onNext={() => setStep("suggestions")}
          onBack={() => setStep("meals")}
        />
      )}

      {step === "suggestions" && (
        <DailySuggestions
          meals={meals}
          dogProfile={dogProfile}
          onBack={() => setStep("history")}
        />
      )}

      {step === "history" && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>History 🗓️</h2>
          <p>後でスコア推移のチャートを追加します。</p>
          <button className="btn btn-ghost" onClick={() => setStep("profile")}>
            Back to Profile
          </button>
        </section>
      )}
    </Layout>
  );
}
