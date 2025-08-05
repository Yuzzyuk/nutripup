// components/OnboardingWizard.jsx
"use client";
import React, { useRef, useState, useMemo, useCallback } from "react";
import { fileToDataURL } from "./utils/imageToDataUrl";

/** 任意の健康フォーカス */
const healthFocusOptions = [
  { id: "skin",    label: "Skin & Coat",  icon: "✨" },
  { id: "joints",  label: "Joints",       icon: "🦴" },
  { id: "kidneys", label: "Kidneys",      icon: "💧" },
  { id: "digestion", label: "Digestion",  icon: "🌿" },
  { id: "weight",  label: "Weight",       icon: "⚖️" },
  { id: "energy",  label: "Energy",       icon: "⚡" },
];

export default function OnboardingWizard({ onComplete }) {
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

  // ✅ 関数型アップデートで常に最新の state を参照（名前が1文字で止まる問題を防止）
  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleFocus = useCallback((id) => {
    setForm(prev => {
      const cur = Array.isArray(prev.healthFocus) ? prev.healthFocus : [];
      const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
      return { ...prev, healthFocus: next };
    });
  }, []);

  /** 画像アップロード */
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

  /** ステップ構成 */
  const steps = useMemo(() => ([
    { id: "photo", title: "写真をセット", required: false },
    { id: "name", title: "名前", required: true },
    { id: "age", title: "年齢（年/月）", required: true },
    { id: "weight", title: "体重", required: true },
    { id: "spay", title: "避妊・去勢", required: true },
    { id: "activity", title: "運動量", required: true },
    { id: "goal", title: "目標", required: true },
    { id: "stage", title: "ライフステージ", required: true },
    { id: "focus", title: "健康フォーカス（任意）", required: false },
    { id: "confirm", title: "確認", required: true },
  ]), []);
  const [i, setI] = useState(0);
  const cur = steps[i];

  /** 各ステップのバリデーション */
  const canNext = useMemo(() => {
    switch (cur.id) {
      case "name":
        return form.name.trim().length > 0;
      case "age":
        return form.ageYears !== "" || form.ageMonths !== "";
      case "weight":
        return form.weight !== "" && Number.isFinite(Number(form.weight));
      case "spay":
        return form.spayNeuter === "neutered" || form.spayNeuter === "intact";
      case "activity":
        return ["Low","Moderate","High"].includes(form.activityLevel);
      case "goal":
        return ["maintain","weight_loss","weight_gain"].includes(form.goal);
      case "stage":
        return ["adult","puppy_lt4m","puppy_ge4m"].includes(form.lifeStage);
      case "confirm":
        return true;
      default:
        return true;
    }
  }, [cur.id, form]);

  const next = () => setI((p) => Math.min(p + 1, steps.length - 1));
  const back = () => setI((p) => Math.max(p - 1, 0));
  const finish = () => onComplete && onComplete(form);

  /** UI: ステップごとの内容 */
  const StepBody = () => {
    switch (cur.id) {
      case "photo":
        return (
          <div className="grid" style={{ gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  overflow: "hidden", background: "var(--sand)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid rgba(0,0,0,.06)"
                }}
              >
                {form.photo ? (
                  <img src={form.photo} alt="Dog" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : <span style={{ fontSize: 34 }}>🐶</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--taupe)" }}>顔写真があると毎日の入力が楽しくなります</div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
              </div>
              <button className="btn btn-ghost" onClick={pickPhoto}>Upload Photo</button>
            </div>
            <div style={{ color: "var(--taupe)", fontSize: 12 }}>
              スキップ可。後から「Manage Dogs」でも変更できます。
            </div>
          </div>
        );
      case "name":
        return (
          <div>
            <input
              type="text"
              placeholder="例: もも / Momo"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)} // ← ここが関数型アップデートで安定
              autoFocus
            />
          </div>
        );
      case "age":
        return (
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input
              type="number"
              placeholder="年"
              value={form.ageYears}
              onChange={(e) => {
                const v = e.target.value === "" ? "" : Math.max(0, Math.min(40, Math.round(Number(e.target.value)||0)));
                setField("ageYears", v);
              }}
            />
            <input
              type="number"
              placeholder="月"
              value={form.ageMonths}
              onChange={(e) => {
                const v = e.target.value === "" ? "" : Math.max(0, Math.min(11, Math.round(Number(e.target.value)||0)));
                setField("ageMonths", v);
              }}
            />
          </div>
        );
      case "weight":
        return (
          <div className="grid" style={{ gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input
              type="number"
              placeholder="体重"
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
        );
      case "spay":
        return (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "neutered", label: "避妊・去勢済み" },
              { id: "intact", label: "未避妊／未去勢" },
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
        );
      case "activity":
        return (
          <>
            <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[
                { id: "Low", label: "低め", hint: "短い散歩のみ／落ち着き" },
                { id: "Moderate", label: "普通", hint: "毎日散歩＋適度な運動" },
                { id: "High", label: "高め", hint: "ラン／スポーツ多め" },
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
              迷ったら「普通」でOK。後から変更できます。
            </div>
          </>
        );
      case "goal":
        return (
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { id: "maintain", label: "維持" },
              { id: "weight_loss", label: "減量" },
              { id: "weight_gain", label: "増量" },
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
        );
      case "stage":
        return (
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { id: "adult", label: "成犬" },
              { id: "puppy_lt4m", label: "子犬 (<4か月)" },
              { id: "puppy_ge4m", label: "子犬 (4–12か月)" },
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
        );
      case "focus":
        return (
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
        );
      case "confirm":
        return (
          <div className="card" style={{ background: "var(--cloud)" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>確認</div>
            <div style={{ fontSize: 14, color: "var(--taupe)", lineHeight: 1.8 }}>
              名前：{form.name || "—"}<br/>
              年齢：{(form.ageYears||0)}年 {(form.ageMonths||0)}か月<br/>
              体重：{form.weight || "—"} {form.weightUnit}<br/>
              避妊去勢：{form.spayNeuter === "neutered" ? "済み" : "未"}<br/>
              運動量：{form.activityLevel}<br/>
              目標：{form.goal}<br/>
              ステージ：{form.lifeStage}<br/>
              フォーカス：{(form.healthFocus||[]).length ? form.healthFocus.join(", ") : "—"}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card">
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 28 }}>🐕</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>Welcome to NutriPup</div>
          <div style={{ color: "var(--taupe)", fontSize: 13 }}>質問に答えてセットアップ（{i+1}/{steps.length}）</div>
        </div>
        {/* 進捗ドット */}
        <div style={{ display: "flex", gap: 4 }}>
          {steps.map((s, idx) => (
            <div key={s.id}
              style={{
                width: 8, height: 8, borderRadius: 999,
                background: idx <= i ? "var(--moss)" : "var(--sand)"
              }}
            />
          ))}
        </div>
      </div>

      {/* タイトル */}
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{cur.title}</div>

      {/* 本文 */}
      <div className="grid" style={{ gap: 10 }}>
        <StepBody />
      </div>

      {/* ナビゲーション */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={back} disabled={i===0}>Back</button>
        {i < steps.length - 1 ? (
          <button className="btn btn-primary" onClick={next} disabled={!canNext} style={{ flex: 1 }}>
            Next
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => onComplete && onComplete(form)} disabled={!canNext} style={{ flex: 1 }}>
            Start NutriPup
          </button>
        )}
      </div>
    </div>
  );
}
