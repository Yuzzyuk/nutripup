// pages/index.js
"use client";
import { useState } from "react";
import Layout from "../components/Layout";
import ProfileSetup from "../components/ProfileSetup";

export default function Home() {
  const [step, setStep] = useState("profile");

  // プロフィールの状態をここで持つ（子コンポーネントに渡す）
  const [dogProfile, setDogProfile] = useState({
    name: "",
    age: "",
    breed: "",
    weight: "",
    weightUnit: "kg",
    activityLevel: "",
    healthFocus: [],
  });

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
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Add today’s meal 🍽️</h2>
          <p>ここに食材検索＆分量入力UIを作成します（次のSTEPで追加）。</p>
          <div style={{ marginTop: 12, fontSize: 14, color: "var(--taupe)" }}>
            <strong>Profile preview:</strong>{" "}
            {dogProfile.name
              ? `${dogProfile.name} • ${dogProfile.age} yrs • ${dogProfile.weight}${dogProfile.weightUnit} • ${dogProfile.breed} • ${dogProfile.activityLevel}`
              : "未入力"}
          </div>
          <button className="btn btn-ghost" onClick={() => setStep("summary")} style={{ marginTop: 12 }}>
            Go to Summary
          </button>
        </section>
      )}

      {step === "summary" && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Nutrition Summary 📊</h2>
          <p>レーダーチャートをこのセクションに配置します（recharts使用）。</p>
          <button className="btn btn-ghost" onClick={() => setStep("suggestions")}>
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
