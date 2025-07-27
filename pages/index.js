// pages/index.js
"use client";
import { useState } from "react";
import Layout from "../components/Layout";
import ProfileSetup from "../components/ProfileSetup";
import MealInput from "../components/MealInput";

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
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Nutrition Summary 📊</h2>
          <p>次のSTEPでレーダーチャート（recharts）を表示して、%達成度を見せます。</p>
          <div style={{ fontSize: 14, color: "var(--taupe)" }}>
            Logged meals today: <strong>{meals.length}</strong>
          </div>
          <button className="btn btn-ghost" onClick={() => setStep("suggestions")} style={{ marginTop: 8 }}>
            See Tips
          </button>
        </section>
      )}

      {step === "suggestions" && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Daily Suggestions 💡</h2>
          <ul>
            <li>Omega-3 を少し強化：明日はサーモン 5g を追加</li>
            <li>カルシウム 1g を卵殻パウダーで補完</li>
          </ul>
          <button className="btn btn-ghost" onClick={() => setStep("history")}>
            View History
          </button>
        </section>
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
