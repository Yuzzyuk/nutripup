// components/ProfileSetup.jsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fileToDataURL } from "./utils/imageToDataUrl";

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

// props.dogProfile からフォーム初期値を作る
function toForm(p = {}) {
  const hf = Array.isArray(p.healthFocus) ? p.healthFocus : [];
  const asStr = (v) => (v === 0 ? "0" : v == null ? "" : String(v));

  return {
    id: p.id || "",
    photo: p.photo || "",
    name: p.name ?? "",
    // 年齢（年・月 いずれも空文字OK。type=numberだと空が潰れるので文字列で持つ）
    ageYears: asStr(p.ageYears !== undefined ? p.ageYears : p.age ?? ""),
    ageMonths: asStr(p.ageMonths !== undefined ? p.ageMonths : ""),
    breed: p.breed ?? "",
    weight: asStr(p.weight ?? ""),
    weightUnit: p.weightUnit || "kg",
    activityLevel: p.activityLevel || "Moderate",
    healthFocus: hf,
  };
}

export default function ProfileSetup({ dogProfile = {}, setDogProfile, onContinue }) {
  // 🔒 入力はローカル state で保持（これでキー入力が上書きされない）
  const [form, setForm] = useState(() => toForm(dogProfile));

  // 別の犬を編集し始めたら同期（IDが変わったときだけ）
  useEffect(() => {
    setForm((prev) => {
      if (prev.id !== (dogProfile?.id || "")) return toForm(dogProfile);
      return prev;
    });
  }, [dogProfile?.id]);

  // 親へ同期（毎回でもOK。重ければ debounce しても良い）
  const syncParent = (next) => {
    setDogProfile && setDogProfile(next);
  };

  // 入力ハンドラ（空文字OK・数値は clamp）
  const clampInt = (v, min, max) => {
    if (v === "" || v === null) return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    return String(Math.min(max, Math.max(min, Math.round(n))));
  };

  const setField = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    syncParent(next);
  };

  const setYears = (val) => setField("ageYears", clampInt(val, 0, 40));
  const setMonths = (val) => setField("ageMonths", clampInt(val, 0, 11));
  const setWeight = (val) => {
    // 体重は小数点OK（空文字OK）
    if (val === "" || val === null) return setField("weight", "");
    const n = Number(val);
    setField("weight", Number.isFinite(n) ? String(n) : "");
  };

  // フォーカス切替
  const toggleFocus = (id) => {
    const cur = Array.isArray(form.healthFocus) ? form.healthFocus : [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setField("healthFocus", next);
  };

  // 写真アップロード
  const fileRef = useRef(null);
  const pickPhoto = () => fileRef.current?.click();
  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await fileToDataURL(f, 256, 0.85);
      setField("photo", url);
    } catch {
      alert("画像の読み込みに失敗しました。別の画像をお試しください。");
    } finally {
      e.target.value = "";
    }
  };

  const ageLabel = useMemo(() => {
    const y = form.ageYears === "" ? 0 : Number(form.ageYears);
    const m = form.ageMonths === "" ? 0 : Number(form.ageMonths);
    if (y === 0 && m === 0) return "—";
    return `${y}y ${m}m`;
  }, [form.ageYears, form.ageMonths]);

  const canContinue =
    form.name.trim() &&
    (form.ageYears !== "" || form.ageMonths !== "") &&
    form.weight !== "" &&
    form.breed &&
    form.activityLevel;

  return (
    <div className="card">
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%", overflow: "hidden",
            background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(0,0,0,.06)"
          }}
          aria-label="Dog avatar"
        >
          {form.photo ? (
            <img src={form.photo} alt="Dog" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 28 }}>🐶</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>Welcome to NutriPup</div>
          <div style={{ color: "var(--taupe)", fontSize: 13 }}>Let's create your dog's profile</div>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          <button className="btn btn-ghost" onClick={pickPhoto}>Upload Photo</button>
        </div>
      </div>

      {/* 入力エリア（1画面に収まるコンパクトグリッド） */}
      <div className="grid" style={{ gap: 10 }}>
        {/* 名前 */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>Name</label>
          <input
            type="text"
            inputMode="text"
            placeholder="e.g., Momo"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </div>

        {/* 年齢・体重（2列） */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
              Age (y / m) <span className="badge" style={{ marginLeft: 6 }}>{ageLabel}</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input
                type="number"
                placeholder="Years"
                value={form.ageYears}
                onChange={(e) => setYears(e.target.value)}
              />
              <input
                type="number"
                placeholder="Months"
                value={form.ageMonths}
                onChange={(e) => setMonths(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
              Weight ({form.weightUnit})
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <input
                type="number"
                placeholder="10"
                value={form.weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <select
                value={form.weightUnit}
                onChange={(e) => setField("weightUnit", e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>
        </div>

        {/* 犬種 */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>Breed</label>
          <select value={form.breed} onChange={(e) => setField("breed", e.target.value)}>
            <option value="">Select breed</option>
            {breeds.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Activity */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>Activity Level</label>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {["Low","Moderate","High"].map((level) => (
              <button
                key={level}
                type="button"
                className={`btn ${form.activityLevel === level ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setField("activityLevel", level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Health focus */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Health Focus (optional)
          </label>
          <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
            {healthFocusOptions.map((opt) => {
              const selected = (form.healthFocus || []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`btn ${selected ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => toggleFocus(opt.id)}
                >
                  <span style={{ marginRight: 6 }}>{opt.icon}</span>{opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* アクション */}
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
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
