// components/Onboarding.jsx
"use client";
import React, { useRef, useState } from "react";
import { fileToDataURL } from "./utils/imageToDataUrl";

const healthFocusOptions = [
  { id: "skin",    label: "Skin & Coat",  icon: "✨" },
  { id: "joints",  label: "Joints",       icon: "🦴" },
  { id: "kidneys", label: "Kidneys",      icon: "💧" },
  { id: "digestion", label: "Digestion",  icon: "🌿" },
  { id: "weight",  label: "Weight",       icon: "⚖️" },
  { id: "energy",  label: "Energy",       icon: "⚡" },
];

export default function Onboarding({ onComplete }) {
  const [form, setForm] = useState({
    photo: "",
    name: "",
    ageYears: "",
    ageMonths: "",
    weight: "",
    weightUnit: "kg",
    spayNeuter: "neutered", // neutered / intact
    activityLevel: "Moderate",
    goal: "maintain",       // maintain / weight_loss / weight_gain
    lifeStage: "adult",     // adult / puppy_lt4m / puppy_ge4m
    healthFocus: [],
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleFocus = (id) => {
    const cur = Array.isArray(form.healthFocus) ? form.healthFocus : [];
    setField("healthFocus", cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
  };

  // 写真アップ（質問1）
  const fileRef = useRef(null);
  const pickPhoto = () => fileRef.current?.click();
  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await fileToDataURL(f, 512, 0.9);
      setField("photo", url);
    } catch {
      alert("画像の読み込みに失敗しました。別のファイルを試してください。");
    } finally {
      e.target.value = "";
    }
  };

  const canStart =
    form.name.trim() &&
    (form.ageYears !== "" || form.ageMonths !== "") &&
    form.weight !== "" &&
    form.activityLevel &&
    form.goal &&
    form.lifeStage;

  return (
    <div className="card">
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
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
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Welcome to NutriPup</div>
          <div style={{ color: "var(--taupe)", fontSize: 13 }}>Let’s set up your dog — quick questions</div>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          <button className="btn btn-ghost" onClick={pickPhoto}>Upload Photo</button>
        </div>
      </div>

      {/* 質問ブロック（1画面に収まるコンパクト構成） */}
      <div className="grid" style={{ gap: 10 }}>
        {/* Q1: 写真（上のボタン）＋プレビュー済み */}

        {/* Q2: 名前 */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>Name</label>
          <input
            type="text"
            placeholder="e.g., Momo"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </div>

        {/* Q3: 年齢（年・月） */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Age (years / months)
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input
              type="number"
              placeholder="Years"
              value={form.ageYears}
              onChange={(e) => {
                const v = e.target.value === "" ? "" : Math.max(0, Math.min(40, Math.round(Number(e.target.value)||0)));
                setField("ageYears", v);
              }}
            />
            <input
              type="number"
              placeholder="Months"
              value={form.ageMonths}
              onChange={(e) => {
                const v = e.target.value === "" ? "" : Math.max(0, Math.min(11, Math.round(Number(e.target.value)||0)));
                setField("ageMonths", v);
              }}
            />
          </div>
        </div>

        {/* Q4: 体重 */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Weight
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input
              type="number"
              placeholder="10"
              value={form.weight}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") return setField("weight", "");
                const n = Number(val);
                setField("weight", Number.isFinite(n) ? n : "");
              }}
            />
            <select value={form.weightUnit} onChange={(e) => setField("weightUnit", e.target.value)}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>

        {/* Q5: 避妊・去勢 */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Spay/Neuter
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "neutered", label: "Neutered/Spayed" },
              { id: "intact", label: "Intact" },
            ].map(opt => (
              <button
                key={opt.id}
                className={`btn ${form.spayNeuter === opt.id ? "btn-primary" : "btn-ghost"}`}
                type="button"
                onClick={() => setField("spayNeuter", opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q6: 活動量（分かりやすい説明付き） */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Activity Level
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { id: "Low", label: "Low", hint: "短い散歩のみ／落ち着き" },
              { id: "Moderate", label: "Moderate", hint: "毎日散歩＋適度な運動" },
              { id: "High", label: "High", hint: "ラン／スポーツ多め" },
            ].map(opt => (
              <button
                key={opt.id}
                className={`btn ${form.activityLevel === opt.id ? "btn-primary" : "btn-ghost"}`}
                type="button"
                onClick={() => setField("activityLevel", opt.id)}
                title={opt.hint}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ color: "var(--taupe)", fontSize: 12, marginTop: 4 }}>
            迷ったら「Moderate」でOK。後で変更できます。
          </div>
        </div>

        {/* Q7: 目標 */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Goal
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { id: "maintain", label: "Maintain" },
              { id: "weight_loss", label: "Lose" },
              { id: "weight_gain", label: "Gain" },
            ].map(opt => (
              <button
                key={opt.id}
                className={`btn ${form.goal === opt.id ? "btn-primary" : "btn-ghost"}`}
                type="button"
                onClick={() => setField("goal", opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q8: ライフステージ */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Life Stage
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { id: "adult", label: "Adult" },
              { id: "puppy_lt4m", label: "Puppy <4m" },
              { id: "puppy_ge4m", label: "Puppy 4–12m" },
            ].map(opt => (
              <button
                key={opt.id}
                className={`btn ${form.lifeStage === opt.id ? "btn-primary" : "btn-ghost"}`}
                type="button"
                onClick={() => setField("lifeStage", opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q9: Health Focus（任意） */}
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Health Focus (optional)
          </label>
          <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
            {healthFocusOptions.map(opt => {
              const on = (form.healthFocus || []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  className={`btn ${on ? "btn-primary" : "btn-ghost"}`}
                  type="button"
                  onClick={() => toggleFocus(opt.id)}
                >
                  <span style={{ marginRight: 6 }}>{opt.icon}</span>{opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 完了 */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            className="btn btn-primary"
            disabled={!canStart}
            onClick={() => onComplete && onComplete(form)}
            style={{ flex: 1 }}
          >
            Start NutriPup
          </button>
        </div>
      </div>
    </div>
  );
}
