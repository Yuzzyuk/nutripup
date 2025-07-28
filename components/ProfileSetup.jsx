// components/ProfileSetup.jsx
"use client";
import React, { useMemo } from "react";
import { fileToDataURL } from "./utils/imageToDataUrl";

const breeds = [
  "Golden Retriever","Labrador Retriever","German Shepherd","French Bulldog",
  "Bulldog","Poodle","Beagle","Rottweiler","Yorkshire Terrier","Dachshund",
  "Siberian Husky","Boxer","Border Collie","Australian Shepherd","Shih Tzu","Shiba",
];

const healthFocusOptions = [
  { id: "skin",    label: "Skin & Coat",   icon: "✨" },
  { id: "joints",  label: "Joints",        icon: "🦴" },
  { id: "kidneys", label: "Kidneys",       icon: "💧" },
  { id: "digestion", label: "Digestion",   icon: "🌿" },
  { id: "weight",  label: "Weight",        icon: "⚖️" },
  { id: "energy",  label: "Energy",        icon: "⚡" },
];

export default function ProfileSetup({ dogProfile = {}, setDogProfile, onContinue }) {
  // 正規化（空でも編集できるように既定値を当てる）
  const safe = useMemo(() => {
    const hf = Array.isArray(dogProfile.healthFocus) ? dogProfile.healthFocus : [];
    const toNumOrEmpty = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? "" : Number(v));
    const years = toNumOrEmpty(dogProfile.ageYears);
    const monthsRaw = toNumOrEmpty(dogProfile.ageMonths);
    const months = monthsRaw === "" ? "" : Math.min(11, Math.max(0, Math.round(monthsRaw)));

    return {
      id: dogProfile.id || "",
      name: dogProfile.name ?? "",
      ageYears: years,
      ageMonths: months,
      ageLabel: dogProfile.ageLabel ?? "",
      breed: dogProfile.breed ?? "",
      weight: dogProfile.weight ?? "",
      weightUnit: dogProfile.weightUnit || "kg",
      activityLevel: dogProfile.activityLevel || "Moderate",
      healthFocus: hf,
      photo: dogProfile.photo || "",
    };
  }, [dogProfile]);

  const update = (patch) => {
    if (!setDogProfile) return;
    // ageYears/Months → ageLabel も同時更新
    const next = { ...safe, ...patch };
    const y = next.ageYears === "" ? "" : Math.max(0, Math.round(Number(next.ageYears)));
    const m = next.ageMonths === "" ? "" : Math.min(11, Math.max(0, Math.round(Number(next.ageMonths))));
    next.ageYears = y === "" ? "" : y;
    next.ageMonths = m === "" ? "" : m;
    next.ageLabel =
      y === "" && m === "" ? "" : `${(y || 0)}y ${(m || 0)}m`;

    setDogProfile(next);
  };

  const canContinue =
    safe.name.trim() &&
    safe.breed.trim() &&
    safe.weight !== "" &&
    (safe.ageYears !== "" || safe.ageMonths !== "") &&
    safe.activityLevel;

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataURL(file, 512, 0.9);
      update({ photo: dataUrl });
    } catch {
      alert("写真の読み込みに失敗しました。別の画像を試してください。");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="card">
      {/* ヘッダー行（横1行に収めてスクロール不要） */}
      <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 12, alignItems: "center" }}>
        <label
          htmlFor="dog-photo"
          style={{
            width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
            background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(0,0,0,.06)", cursor: "pointer"
          }}
          title="Upload photo"
        >
          {safe.photo ? (
            <img src={safe.photo} alt="Dog" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 28 }}>🐶</span>
          )}
        </label>
        <input id="dog-photo" type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} />

        <div>
          <div style={{ fontWeight: 800, color: "var(--taupe)", marginBottom: 4 }}>Dog Profile</div>
          <div style={{ fontSize: 13, color: "var(--taupe)" }}>
            Enter name, age, weight and goals.
          </div>
        </div>
      </div>

      {/* 入力行（2列グリッドで画面内に収める） */}
      <div className="container" style={{ padding: 0, marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Name */}
          <div>
            <label className="label" style={{ marginTop: 0 }}>Name</label>
            <input
              type="text"
              value={safe.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="e.g., Momo"
              inputMode="text"
              autoComplete="name"
            />
          </div>

          {/* Breed */}
          <div>
            <label className="label" style={{ marginTop: 0 }}>Breed</label>
            <select value={safe.breed} onChange={(e) => update({ breed: e.target.value })}>
              <option value="">Select breed</option>
              {breeds.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Age (years / months) */}
          <div>
            <label className="label">Age — Years</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="40"
              value={safe.ageYears === "" ? "" : safe.ageYears}
              onChange={(e) => {
                const v = e.target.value === "" ? "" : Math.max(0, Math.min(40, Number(e.target.value)));
                update({ ageYears: v });
              }}
              placeholder="e.g., 2"
            />
          </div>
          <div>
            <label className="label">Age — Months</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="11"
              value={safe.ageMonths === "" ? "" : safe.ageMonths}
              onChange={(e) => {
                const v = e.target.value === "" ? "" : Math.max(0, Math.min(11, Number(e.target.value)));
                update({ ageMonths: v });
              }}
              placeholder="0–11"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="label">Weight ({safe.weightUnit})</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={safe.weight}
              onChange={(e) => update({ weight: e.target.value })}
              placeholder="e.g., 8.5"
            />
          </div>

          {/* Activity */}
          <div>
            <label className="label">Activity</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {["Low", "Moderate", "High"].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`btn ${safe.activityLevel === level ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => update({ activityLevel: level })}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Health focus */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Health Focus (optional)</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 8 }}>
              {healthFocusOptions.map((opt) => {
                const selected = (safe.healthFocus || []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`btn ${selected ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => {
                      const cur = Array.isArray(safe.healthFocus) ? safe.healthFocus : [];
                      const next = selected ? cur.filter((f) => f !== opt.id) : [...cur, opt.id];
                      update({ healthFocus: next });
                    }}
                    title={opt.label}
                  >
                    <span style={{ marginRight: 6 }}>{opt.icon}</span>{opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* アクション */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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
  );
}
