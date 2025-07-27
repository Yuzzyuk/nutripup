// components/ProfileSetup.jsx
"use client";
import React, { useEffect, useMemo, useRef } from "react";
import { fileToDataURL } from "./utils/imageToDataUrl";

const breeds = [
  "Shiba","Toy Poodle","Miniature Dachshund","Chihuahua","French Bulldog",
  "Golden Retriever","Labrador Retriever","German Shepherd","Border Collie",
  "Siberian Husky","Beagle","Corgi","Pomeranian","Maltese","Yorkshire Terrier",
];

const healthFocusOptions = [
  { id: "skin",     label: "Skin & Coat",  icon: "✨" },
  { id: "joints",   label: "Joints",       icon: "🦴" },
  { id: "kidneys",  label: "Kidneys",      icon: "💧" },
  { id: "digestion",label: "Digestion",    icon: "🌿" },
  { id: "weight",   label: "Weight",       icon: "⚖️" },
  { id: "energy",   label: "Energy",       icon: "⚡" },
];

export default function ProfileSetup({ dogProfile = {}, setDogProfile, onContinue }) {
  // 正規化（includesエラー防止）
  const safe = useMemo(() => ({
    id: dogProfile.id || "",
    name: dogProfile.name ?? "",
    // 新規: 年・月を個別管理（互換のため age も保持）
    ageYears: dogProfile.ageYears ?? "",
    ageMonths: dogProfile.ageMonths ?? "",
    age: dogProfile.age ?? "",

    breed: dogProfile.breed ?? "",
    weight: dogProfile.weight ?? "",
    weightUnit: dogProfile.weightUnit || "kg",
    activityLevel: dogProfile.activityLevel || "Moderate",
    healthFocus: Array.isArray(dogProfile.healthFocus) ? dogProfile.healthFocus : [],
    // 新規: 写真
    photo: dogProfile.photo || "",
  }), [dogProfile]);

  const update = (patch) => setDogProfile && setDogProfile({ ...safe, ...patch });

  const calcAgeDecimal = (y, m) => {
    const yy = Number(y) || 0;
    const mm = Math.max(0, Math.min(11, Number(m) || 0));
    const dec = yy + mm / 12;
    // 小数1桁に丸め（AI用の数値としても扱いやすい）
    return Math.round(dec * 10) / 10;
  };

  const handleAgeYears = (val) => {
    const y = val === "" ? "" : Math.max(0, Number(val));
    const m = safe.ageMonths === "" ? 0 : Number(safe.ageMonths);
    update({
      ageYears: val === "" ? "" : y,
      age: val === "" && safe.ageMonths === "" ? "" : calcAgeDecimal(y, m),
    });
  };

  const handleAgeMonths = (val) => {
    // 0〜11 に制限
    const raw = Number(val);
    const clamped = isNaN(raw) ? 0 : Math.max(0, Math.min(11, raw));
    const y = safe.ageYears === "" ? 0 : Number(safe.ageYears);
    update({
      ageMonths: val === "" ? "" : clamped,
      age: safe.ageYears === "" && val === "" ? "" : calcAgeDecimal(y, clamped),
    });
  };

  const canContinue =
    String(safe.name).trim() !== "" &&
    String(safe.breed).trim() !== "" &&
    String(safe.activityLevel).trim() !== "" &&
    String(safe.weight).trim() !== "" &&
    (safe.ageYears !== "" || safe.ageMonths !== "");

  const nameRef = useRef(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const toggleFocus = (id) => {
    const cur = Array.isArray(safe.healthFocus) ? safe.healthFocus : [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    update({ healthFocus: next });
  };

  // 画像アップロード
  const fileRef = useRef(null);
  const onPick = () => fileRef.current?.click();
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const dataUrl = await fileToDataURL(f, 384, 0.9); // きれい＆軽量
      update({ photo: dataUrl });
    } catch {
      alert("画像の読み込みに失敗しました。別のファイルを試してください。");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="card profile-card slide-up">
      {/* ヒーロー */}
      <div className="hero">
        {/* Avatar */}
        <div className="avatar" aria-label="Dog photo">
          {safe.photo ? (
            <img src={safe.photo} alt="Dog" />
          ) : (
            <span className="avatar-emoji" aria-hidden>🐕</span>
          )}
          <button type="button" className="avatar-btn" onClick={onPick}>Upload</button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onFile}
          />
        </div>

        <div className="hero-copy">
          <h2 className="hero-title">Create your dog’s profile</h2>
          <p className="hero-sub">最短1分。後からいつでも編集できます。</p>
        </div>
      </div>

      {/* フォーム */}
      <div className="form">
        {/* 名前 */}
        <div className="field">
          <label className="label-row">
            <span>Name</span>
            <span className="hint">必須</span>
          </label>
          <input
            ref={nameRef}
            type="text"
            value={safe.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="例: Momo"
          />
        </div>

        {/* 年齢（歳＋ヶ月）と体重（2列×2） */}
        <div className="grid2">
          {/* 年齢：歳 */}
          <div className="field">
            <label className="label-row">
              <span>Age</span>
              <span className="subtle">years / months</span>
            </label>
            <div className="age-row">
              <div className="input-with-unit">
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="1"
                  value={safe.ageYears}
                  onChange={(e) => handleAgeYears(e.target.value)}
                  placeholder="3"
                />
                <span className="unit">y</span>
              </div>
              <div className="input-with-unit">
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  max="11"
                  step="1"
                  value={safe.ageMonths}
                  onChange={(e) => handleAgeMonths(e.target.value)}
                  placeholder="6"
                />
                <span className="unit">m</span>
              </div>
            </div>
          </div>

          {/* 体重 */}
          <div className="field">
            <label className="label-row">
              <span>Weight</span>
              <span className="subtle">{safe.weightUnit}</span>
            </label>
            <div className="input-with-unit">
              <input
                inputMode="decimal"
                type="number"
                min="0"
                step="0.1"
                value={safe.weight}
                onChange={(e) => update({ weight: e.target.value })}
                placeholder="8.5"
              />
              <span className="unit">{safe.weightUnit}</span>
            </div>
          </div>
        </div>

        {/* 犬種 */}
        <div className="field">
          <label className="label-row">
            <span>Breed</span>
            <span className="hint">必須</span>
          </label>
          <select
            value={safe.breed}
            onChange={(e) => update({ breed: e.target.value })}
          >
            <option value="">Select breed…</option>
            {breeds.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* アクティビティ（セグメント） */}
        <div className="field">
          <label className="label-row">
            <span>Activity level</span>
            <span className="subtle">日常の運動量</span>
          </label>
          <div className="seg">
            {["Low","Moderate","High"].map((level) => (
              <button
                key={level}
                type="button"
                className={`seg-btn ${safe.activityLevel === level ? "on" : ""}`}
                onClick={() => update({ activityLevel: level })}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* 健康フォーカス（チップ） */}
        <div className="field">
          <label className="label-row">
            <span>Health focus</span>
            <span className="subtle">任意</span>
          </label>
          <div className="chips">
            {healthFocusOptions.map((opt) => {
              const active = (safe.healthFocus || []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`chip ${active ? "active" : ""}`}
                  onClick={() => toggleFocus(opt.id)}
                >
                  <span className="chip-ico">{opt.icon}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* フッター（固定CTA） */}
      <div className="cta">
        <div className="cta-left">
          {!canContinue ? (
            <span className="cta-hint">名前 / 年齢（歳またはヶ月）/ 体重 / 犬種 / 活動量 を入力してください</span>
          ) : (
            <span className="cta-ok">準備OKです</span>
          )}
        </div>
        <button
          className="btn btn-primary"
          disabled={!canContinue}
          onClick={() => onContinue && onContinue()}
        >
          Continue
        </button>
      </div>

      {/* 局所スタイル（globals.cssのトークンを使用） */}
      <style jsx>{`
        .profile-card { padding: 18px 18px 90px; position: relative; }

        .hero{
          display:flex; align-items:center; gap:12px; margin-bottom: 8px;
        }
        .hero-copy{ flex:1; }
        .hero-title{ margin:0; font-size:20px; color: var(--taupe); font-weight:800; letter-spacing:.2px; }
        .hero-sub{ margin:.5px 0 0; font-size:14px; color:#7a6a56; }

        /* Avatar */
        .avatar{
          position: relative;
          width:68px; height:68px; border-radius:50%; overflow:hidden;
          background: var(--sand); box-shadow: var(--shadow-sm);
          display:grid; place-items:center;
        }
        .avatar img{ width:100%; height:100%; object-fit:cover; }
        .avatar-emoji{ font-size:28px; }
        .avatar-btn{
          position:absolute; right:-4px; bottom:-4px;
          padding:6px 10px; border-radius:999px; border:0; cursor:pointer;
          font-weight:700; background:#ffffff; color:var(--taupe);
          box-shadow: var(--shadow-sm);
        }
        .avatar-btn:hover{ box-shadow: var(--shadow-md); }

        .form{ display:grid; gap:12px; }
        .field{ display:grid; gap:6px; }
        .label-row{
          display:flex; align-items:baseline; justify-content:space-between;
          font-weight:700; color: var(--taupe);
        }
        .hint{
          font-size:12px; font-weight:700; color:#8e7b65; background:var(--sand);
          padding:2px 8px; border-radius:999px;
        }
        .subtle{ color:#9a8b77; font-size:12px; }

        .grid2{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
        @media (max-width: 520px){ .grid2{ grid-template-columns: 1fr; } }

        .age-row{ display:grid; grid-template-columns: 1fr 1fr; gap:8px; }

        .input-with-unit{
          display:flex; align-items:center; gap:8px;
          background:#fff; border:1px solid #e5ddd2; border-radius: var(--radius-md);
          padding: 6px 10px 6px 10px;
        }
        .input-with-unit input{
          border:0; padding:8px 4px; flex:1; font-size:16px;
        }
        .input-with-unit input:focus{ outline: none; }
        .unit{
          min-width:28px; height:28px; display:grid; place-items:center;
          padding: 0 6px; border-radius: 8px; background: var(--sand); color: var(--taupe);
          font-weight:700; font-size:12px;
        }

        .seg{
          display:grid; grid-template-columns: repeat(3,1fr); gap:6px;
        }
        .seg-btn{
          border:1px solid #e5ddd2; border-radius:12px; padding:10px 12px; font-weight:700;
          background:#fff; color: var(--taupe);
        }
        .seg-btn.on{
          background: var(--moss); color:#fff; border-color: var(--moss);
          box-shadow: var(--shadow-sm);
        }

        .chips{ display:flex; flex-wrap:wrap; gap:8px; }
        .chip{
          display:inline-flex; align-items:center; gap:6px;
          border:1px solid #e5ddd2; border-radius:999px; padding:8px 12px; background:#fff; font-weight:700; color:var(--taupe);
        }
        .chip.active{ background: var(--sand); border-color: var(--sand); }
        .chip-ico{ font-size:14px; }

        .cta{
          position: sticky; bottom:0; left:0; right:0;
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding:12px; margin: 16px -6px -6px; border-radius: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,0), var(--cloud) 28%);
          backdrop-filter: blur(4px);
        }
        .cta-hint{ font-size:12px; color:#8e7b65; }
        .cta-ok{ font-size:12px; color:#5f7a67; font-weight:700; }
      `}</style>
    </div>
  );
}
