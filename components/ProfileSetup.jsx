// components/ProfileSetup.jsx
"use client";
import React, { useRef } from "react";
import { fileToDataURL } from "./utils/imageToDataUrl";

const breeds = [
  "Golden Retriever","Labrador Retriever","German Shepherd","French Bulldog",
  "Bulldog","Poodle","Beagle","Rottweiler","Yorkshire Terrier","Dachshund",
  "Siberian Husky","Boxer","Border Collie","Australian Shepherd","Shih Tzu","Shiba",
];

const healthFocusOptions = [
  { id: "skin",    label: "Skin & Coat", icon: "✨" },
  { id: "joints",  label: "Joints",      icon: "🦴" },
  { id: "kidneys", label: "Kidneys",     icon: "💧" },
  { id: "digestion", label: "Digestion", icon: "🌿" },
  { id: "weight",  label: "Weight",      icon: "⚖️" },
  { id: "energy",  label: "Energy",      icon: "⚡" },
];

export default function ProfileSetup({ dogProfile = {}, setDogProfile, onContinue }) {
  // 正規化
  const safe = {
    id: dogProfile.id || "",
    name: dogProfile.name ?? "",
    ageYears: dogProfile.ageYears ?? "",
    ageMonths: dogProfile.ageMonths ?? "",
    breed: dogProfile.breed ?? "",
    weight: dogProfile.weight ?? "",
    weightUnit: dogProfile.weightUnit || "kg",
    activityLevel: dogProfile.activityLevel || "Moderate",
    healthFocus: Array.isArray(dogProfile.healthFocus) ? dogProfile.healthFocus : [],
    photo: dogProfile.photo || "",
  };
  const update = (patch) => setDogProfile && setDogProfile({ ...safe, ...patch });

  const canContinue =
    safe.name &&
    (safe.ageYears !== "" || safe.ageMonths !== "") &&
    safe.weight !== "" &&
    safe.breed &&
    safe.activityLevel;

  // 画像アップロード
  const fileRef = useRef(null);
  const onPickImage = () => fileRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataURL(file, 384, 0.9);
      update({ photo: url });
    } catch {
      alert("画像の読み込みに失敗しました。別のファイルを試してください。");
    } finally {
      e.target.value = "";
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i); // 0..11

  return (
    <div className="card fade-in">
      {/* ヘッダー */}
      <div className="header-block">
        <div style={{ fontSize: 40, marginBottom: 8 }}>🐕</div>
        <h2 className="title">Welcome to NutriPup</h2>
        <div className="subtitle">Let's create your dog's profile</div>
      </div>

      {/* アバター行 */}
      <div className="avatar-block" style={{ marginTop: 6, marginBottom: 6 }}>
        <div className="avatar" aria-label="Dog avatar">
          {safe.photo ? (
            <img src={safe.photo} alt="Dog" />
          ) : (
            <span style={{ fontSize: 34 }}>🐶</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={onPickImage}>Upload Photo</button>
          {safe.photo && (
            <button className="btn btn-ghost" onClick={() => update({ photo: "" })}>Remove</button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
      </div>

      {/* フォーム */}
      <div className="form" style={{ marginTop: 6 }}>
        {/* Name */}
        <div>
          <label>Name</label>
          <input
            value={safe.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g., Momo"
          />
        </div>

        {/* Age */}
        <div>
          <label>Age</label>
          <div className="row-2">
            <input
              type="number" inputMode="numeric" min="0" max="25"
              placeholder="Years"
              value={safe.ageYears}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (+v >= 0 && +v <= 25)) update({ ageYears: v });
              }}
            />
            <select
              value={safe.ageMonths === "" ? "" : String(safe.ageMonths)}
              onChange={(e) => update({ ageMonths: e.target.value === "" ? "" : Number(e.target.value) })}
            >
              <option value="">Months</option>
              {months.map((m) => <option key={m} value={m}>{m} months</option>)}
            </select>
          </div>
          <div className="hint">0–25歳、月齢は0–11ヶ月まで入力できます。</div>
        </div>

        {/* Weight */}
        <div className="row-2">
          <div>
            <label>Weight ({safe.weightUnit})</label>
            <input
              type="number" inputMode="decimal" min="0" step="0.1"
              value={safe.weight}
              onChange={(e) => update({ weight: e.target.value })}
              placeholder="10"
            />
          </div>
          <div>
            <label>Unit</label>
            <select value={safe.weightUnit} onChange={(e) => update({ weightUnit: e.target.value })}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>

        {/* Breed */}
        <div>
          <label>Breed</label>
          <select value={safe.breed} onChange={(e) => update({ breed: e.target.value })}>
            <option value="">Select breed</option>
            {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Activity Level (segmented) */}
        <div>
          <label>Activity Level</label>
          <div className="segmented">
            {["Low","Moderate","High"].map((level) => (
              <button
                key={level}
                className={`item ${safe.activityLevel === level ? "active" : ""}`}
                onClick={() => update({ activityLevel: level })}
                type="button"
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Health Focus */}
        <div>
          <label>Health Focus (optional)</label>
          <div className="chips">
            {healthFocusOptions.map((opt) => {
              const on = (safe.healthFocus || []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  className={`chip ${on ? "on" : ""}`}
                  onClick={() => {
                    const cur = Array.isArray(safe.healthFocus) ? safe.healthFocus : [];
                    const next = on ? cur.filter((f) => f !== opt.id) : [...cur, opt.id];
                    update({ healthFocus: next });
                  }}
                  type="button"
                >
                  <span style={{ marginRight: 6 }}>{opt.icon}</span>{opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="sticky-cta">
          <button className="btn btn-ghost" type="button" onClick={() => update({})}>Later</button>
          <button
            className="btn btn-primary"
            disabled={!canContinue}
            onClick={() => onContinue && onContinue()}
            style={{ flex: 1 }}
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
