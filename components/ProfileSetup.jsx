// components/ProfileSetup.jsx
"use client";
import React from "react";

const breeds = [
  "Golden Retriever","Labrador Retriever","German Shepherd","French Bulldog",
  "Bulldog","Poodle","Beagle","Rottweiler","Yorkshire Terrier","Dachshund",
  "Siberian Husky","Boxer","Border Collie","Australian Shepherd","Shih Tzu","Shiba",
];

const healthFocusOptions = [
  { id: "skin",    label: "Skin & Coat Health", icon: "✨" },
  { id: "joints",  label: "Joint Support",      icon: "🦴" },
  { id: "kidneys", label: "Kidney Health",      icon: "💧" },
  { id: "digestion", label: "Digestive Health", icon: "🌿" },
  { id: "weight",  label: "Weight Management",  icon: "⚖️" },
  { id: "energy",  label: "Energy & Vitality",  icon: "⚡" },
];

export default function ProfileSetup({ dogProfile = {}, setDogProfile, onContinue }) {
  // ここで “必ず配列＆既定値あり” に正規化（includesのエラー防止）
  const safe = {
    id: dogProfile.id || "",
    name: dogProfile.name ?? "",
    age: dogProfile.age ?? "",
    breed: dogProfile.breed ?? "",
    weight: dogProfile.weight ?? "",
    weightUnit: dogProfile.weightUnit || "kg",
    activityLevel: dogProfile.activityLevel || "Moderate",
    healthFocus: Array.isArray(dogProfile.healthFocus) ? dogProfile.healthFocus : [],
  };

  const update = (patch) => setDogProfile && setDogProfile({ ...safe, ...patch });

  const canContinue =
    safe.name && safe.age !== "" && safe.weight !== "" && safe.breed && safe.activityLevel;

  return (
    <div className="card">
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🐕</div>
        <h2 style={{ margin: 0 }}>Welcome to NutriPup</h2>
        <div style={{ color: "var(--taupe)" }}>Let's create your dog's profile</div>
      </div>

      <div className="grid" style={{ gap: 12 }}>
        <div>
          <label>Name</label>
          <input
            value={safe.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Dog name"
          />
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Age (years)</label>
            <input
              type="number"
              value={safe.age}
              onChange={(e) => update({ age: e.target.value })}
              placeholder="Age"
            />
          </div>
          <div>
            <label>Weight ({safe.weightUnit})</label>
            <input
              type="number"
              value={safe.weight}
              onChange={(e) => update({ weight: e.target.value })}
              placeholder="Weight"
            />
          </div>
        </div>

        <div>
          <label>Breed</label>
          <select
            value={safe.breed}
            onChange={(e) => update({ breed: e.target.value })}
          >
            <option value="">Select breed</option>
            {breeds.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Activity Level</label>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {["Low","Moderate","High"].map((level) => (
              <button
                key={level}
                className={`btn ${safe.activityLevel === level ? "btn-primary" : "btn-ghost"}`}
                onClick={() => update({ activityLevel: level })}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label>Health Focus (optional)</label>
          <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
            {healthFocusOptions.map((opt) => {
              const selected = (safe.healthFocus || []).includes(opt.id); // ← 安全
              return (
                <button
                  key={opt.id}
                  className={`btn ${selected ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => {
                    const cur = Array.isArray(safe.healthFocus) ? safe.healthFocus : [];
                    const next = selected ? cur.filter((f) => f !== opt.id) : [...cur, opt.id];
                    update({ healthFocus: next });
                  }}
                >
                  <span style={{ marginRight: 6 }}>{opt.icon}</span>{opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="btn btn-primary"
          disabled={!canContinue}
          onClick={() => onContinue && onContinue()}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
