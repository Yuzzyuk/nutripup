// components/ProfileSetup.jsx
"use client";
import React from "react";

export default function ProfileSetup({ dogProfile, setDogProfile, onContinue }) {
  const breeds = [
    "Golden Retriever","Labrador Retriever","German Shepherd","French Bulldog",
    "Bulldog","Poodle","Beagle","Rottweiler","Yorkshire Terrier","Dachshund",
    "Siberian Husky","Boxer","Border Collie","Australian Shepherd","Shih Tzu","Shiba"
  ];

  const focusOptions = [
    { id: "skin", label: "Skin & Coat", emoji: "✨" },
    { id: "joints", label: "Joints", emoji: "🦴" },
    { id: "kidneys", label: "Kidneys", emoji: "💧" },
    { id: "digestion", label: "Digestion", emoji: "🌿" },
    { id: "weight", label: "Weight", emoji: "⚖️" },
    { id: "energy", label: "Energy", emoji: "⚡" },
  ];

  const canContinue =
    dogProfile.name &&
    dogProfile.age &&
    dogProfile.weight &&
    dogProfile.breed &&
    dogProfile.activityLevel;

  const toggleFocus = (id) => {
    const exists = dogProfile.healthFocus.includes(id);
    const next = exists
      ? dogProfile.healthFocus.filter((x) => x !== id)
      : [...dogProfile.healthFocus, id];
    setDogProfile({ ...dogProfile, healthFocus: next });
  };

  return (
    <section className="card">
      <h1 style={{ color: "var(--taupe)", marginTop: 0 }}>Let’s set up your dog 🐕</h1>
      <p style={{ marginTop: 0 }}>基本情報を入れて、以降の提案をあなたの愛犬に最適化します。</p>

      {/* Dog Name */}
      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)" }}>
          Dog’s Name
        </label>
        <input
          type="text"
          value={dogProfile.name}
          onChange={(e) => setDogProfile({ ...dogProfile, name: e.target.value })}
          placeholder="Bella"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
        />
      </div>

      {/* Age + Weight */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)" }}>
            Age (years)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={dogProfile.age}
            onChange={(e) => setDogProfile({ ...dogProfile, age: e.target.value })}
            placeholder="4"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)" }}>
            Weight
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 8 }}>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={dogProfile.weight}
              onChange={(e) => setDogProfile({ ...dogProfile, weight: e.target.value })}
              placeholder="12"
              style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
            />
            <select
              value={dogProfile.weightUnit}
              onChange={(e) => setDogProfile({ ...dogProfile, weightUnit: e.target.value })}
              style={{ padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Breed with datalist (autocomplete-like) */}
      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)" }}>
          Breed
        </label>
        <input
          list="breed-list"
          value={dogProfile.breed}
          onChange={(e) => setDogProfile({ ...dogProfile, breed: e.target.value })}
          placeholder="Type or pick..."
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
        />
        <datalist id="breed-list">
          {breeds.map((b) => (
            <option value={b} key={b} />
          ))}
        </datalist>
      </div>

      {/* Activity level */}
      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 8 }}>
          Activity Level
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {["Low", "Moderate", "High"].map((lvl) => (
            <button
              key={lvl}
              className={`btn ${dogProfile.activityLevel === lvl ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setDogProfile({ ...dogProfile, activityLevel: lvl })}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Health focus multi-select */}
      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 8 }}>
          Health Focus (optional)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {focusOptions.map((f) => {
            const active = dogProfile.healthFocus.includes(f.id);
            return (
              <button
                key={f.id}
                className={`btn ${active ? "btn-primary" : "btn-ghost"}`}
                onClick={() => toggleFocus(f.id)}
                aria-pressed={active}
              >
                <span style={{ fontSize: 18, marginRight: 6 }}>{f.emoji}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue */}
      <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary"
          disabled={!canContinue}
          onClick={onContinue}
          style={{ flex: 1, opacity: canContinue ? 1 : 0.6 }}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
