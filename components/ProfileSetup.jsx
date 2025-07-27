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
    <div className="compact">
      <div className="card fade-in">
        {/* ヘッダー：最小で上品に */}
        <div className="header-block">
          <div>
            <h2 className="title">Create Dog Profile</h2>
            <div className="subtitle">Quick setup · 30 seconds</div>
          </div>
          {/* 右上に保存ボタンは置かず、下部CTAを使用 */}
        </div>

        {/* アバター + すぐ操作 */}
        <div className="avatar-block" style={{ marginTop: 2, marginBottom: 8 }}>
          <div className="avatar" aria-label="Dog avatar">
            {safe.photo ? <img src={safe.photo} alt="Dog" /> : <span style={{ fontSize: 26 }}>🐶</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={onPickImage}>Upload Photo</button>
            {safe.photo && (
              <button className="btn btn-ghost" onClick={() => update({ photo: "" })}>Remove</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
          </div>
        </div>

        {/* ===== フォーム（詰め配置） ===== */}
        <div className="form">
          {/* 1行目：名前 / 犬種（datalistで軽量に） */}
          <div className="row-2">
            <div>
              <label>Name</label>
              <input
                autoFocus
                aria-label="Dog name"
                value={safe.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Momo"
              />
            </div>
            <div>
              <label>Breed</label>
              <input
                list="breed-list"
                placeholder="Shiba"
                value={safe.breed}
                onChange={(e) => update({ breed: e.target.value })}
              />
              <datalist id="breed-list">
                {breeds.map((b) => <option key={b} value={b} />)}
              </datalist>
            </div>
          </div>

          {/* 2行目：年齢(年+月) / 体重+単位（4カラムで高さ削減） */}
          <div className="row-4">
            <div>
              <label>Age (Years)</label>
              <input
                type="number" inputMode="numeric" min="0" max="25"
                placeholder="3"
                value={safe.ageYears}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || (+v >= 0 && +v <= 25)) update({ ageYears: v });
                }}
              />
            </div>
            <div>
              <label>Age (Months)</label>
              <select
                value={safe.ageMonths === "" ? "" : String(safe.ageMonths)}
                onChange={(e) => update({ ageMonths: e.target.value === "" ? "" : Number(e.target.value) })}
              >
                <option value="">—</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label>Weight</label>
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

          {/* 3行目：アクティビティ（セグメント） */}
          <div>
            <label>Activity Level</label>
            <div className="segmented" role="tablist" aria-label="Activity Level">
              {["Low","Moderate","High"].map((level) => (
                <button
                  key={level}
                  className={`item ${safe.activityLevel === level ? "active" : ""}`}
                  onClick={() => update({ activityLevel: level })}
                  type="button"
                  role="tab"
                  aria-selected={safe.activityLevel === level}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* 4行目：ヘルスフォーカス（横スクロールで省スペース） */}
          <div>
            <label>Health Focus (optional)</label>
            <div className="chips scroll-x" role="listbox" aria-label="Health Focus">
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
                    role="option"
                    aria-selected={on}
                  >
                    <span style={{ marginRight: 6 }}>{opt.icon}</span>{opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ヒント（1行） */}
          <div className="hint">Age: 0–25歳 / Months: 0–11、写真は任意です。</div>

          {/* CTA（最下部固定ぎみ） */}
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
    </div>
  );
}
