// components/Onboarding.jsx
"use client";
import React, { useMemo, useRef, useState } from "react";
import { fileToDataURL } from "./utils/imageToDataUrl";

const healthFocusOptions = [
  { id: "skin",    label: "皮膚・被毛", icon: "✨" },
  { id: "joints",  label: "関節",       icon: "🦴" },
  { id: "kidneys", label: "腎臓",       icon: "💧" },
  { id: "digestion", label: "消化",     icon: "🌿" },
  { id: "weight",  label: "体重管理",   icon: "⚖️" },
  { id: "energy",  label: "元気・体力", icon: "⚡" },
];

const activityOptions = [
  {
    id: "Low",
    label: "低め",
    desc: "散歩20–40分/日・室内中心。シニア/小型など。",
  },
  {
    id: "Moderate",
    label: "普通",
    desc: "散歩40–90分/日＋遊び。平均的な家庭犬。",
  },
  {
    id: "High",
    label: "高め",
    desc: "90分以上/日・ラン/スポーツ・とても活発。",
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    photo: "",
    name: "",
    ageYears: "",
    ageMonths: "",
    weight: "",
    weightUnit: "kg",
    spayNeuter: "neutered", // "neutered" | "intact"
    activityLevel: "Moderate",
    goal: "maintain",       // maintain / weight_loss / weight_gain
    lifeStage: "adult",     // adult / puppy_lt4m / puppy_ge4m（ageから推定）
    healthFocus: [],
  });

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // 写真アップ
  const fileRef = useRef(null);
  const pickPhoto = () => fileRef.current?.click();
  const onPhoto = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const url = await fileToDataURL(f, 256, 0.85);
      setField("photo", url);
    } catch {
      alert("画像の読み込みに失敗しました。別の画像をお試しください。");
    } finally {
      e.target.value = "";
    }
  };

  // lifeStage 推定
  const lifeStage = useMemo(() => {
    const y = Number(form.ageYears || 0);
    const m = Number(form.ageMonths || 0);
    const totalM = y * 12 + m;
    if (totalM < 4) return "puppy_lt4m";
    if (totalM < 12) return "puppy_ge4m";
    return "adult";
  }, [form.ageYears, form.ageMonths]);

  // バリデーション
  const canNext0 = form.name.trim().length >= 1;
  const canNext1 =
    (form.ageYears !== "" || form.ageMonths !== "") &&
    Number(form.ageYears || 0) >= 0 &&
    Number(form.ageMonths || 0) >= 0 &&
    Number(form.ageMonths || 0) <= 11;
  const canNext2 = form.weight !== "" && Number(form.weight) > 0;
  const canNext3 = ["neutered", "intact"].includes(form.spayNeuter);

  const finish = () => {
    onComplete &&
      onComplete({
        ...form,
        lifeStage, // 推定結果を反映
      });
  };

  return (
    <section className="card slide-up">
      {/* ヘッダ */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
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
          <div style={{ color: "var(--taupe)", fontSize: 13 }}>最初に基本情報だけサクッと設定</div>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          <button className="btn btn-ghost" onClick={pickPhoto}>写真</button>
        </div>
      </div>

      {/* 進行状況（全5ステップ） */}
      <div className="kpi" style={{ marginBottom: 8 }}>
        <b style={{ fontSize: 13 }}>Step {step + 1} / 5</b>
      </div>

      {/* 0: 名前 */}
      {step === 0 && (
        <div className="grid" style={{ gap: 10 }}>
          <label style={{ fontWeight: 700, color: "var(--taupe)" }}>名前</label>
          <input
            type="text"
            placeholder="例: もも / Momo"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" disabled={!canNext0} onClick={() => setStep(1)} style={{ flex: 1 }}>
              次へ
            </button>
          </div>
        </div>
      )}

      {/* 1: 年齢（年/月） */}
      {step === 1 && (
        <div className="grid" style={{ gap: 10 }}>
          <label style={{ fontWeight: 700, color: "var(--taupe)" }}>年齢</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input
              type="number" inputMode="numeric" placeholder="年"
              value={form.ageYears}
              onChange={(e) => setField("ageYears", e.target.value.replace(/[^0-9]/g, ""))}
            />
            <input
              type="number" inputMode="numeric" placeholder="月（0〜11）"
              value={form.ageMonths}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                if (v === "") return setField("ageMonths", "");
                const n = Math.max(0, Math.min(11, Number(v)));
                setField("ageMonths", String(n));
              }}
            />
          </div>
          <div style={{ color: "var(--taupe)", fontSize: 13 }}>
            推定ライフステージ：{lifeStage === "adult" ? "成犬" : lifeStage === "puppy_lt4m" ? "子犬（〜4か月）" : "子犬（4〜12か月）"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(0)}>戻る</button>
            <button className="btn btn-primary" disabled={!canNext1} onClick={() => setStep(2)} style={{ flex: 1 }}>
              次へ
            </button>
          </div>
        </div>
      )}

      {/* 2: 体重 */}
      {step === 2 && (
        <div className="grid" style={{ gap: 10 }}>
          <label style={{ fontWeight: 700, color: "var(--taupe)" }}>体重</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input
              type="number" inputMode="decimal" placeholder="10"
              value={form.weight}
              onChange={(e) => setField("weight", e.target.value)}
            />
            <select value={form.weightUnit} onChange={(e) => setField("weightUnit", e.target.value)}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>戻る</button>
            <button className="btn btn-primary" disabled={!canNext2} onClick={() => setStep(3)} style={{ flex: 1 }}>
              次へ
            </button>
          </div>
        </div>
      )}

      {/* 3: 避妊/去勢 + 活動レベル・目標 */}
      {step === 3 && (
        <div className="grid" style={{ gap: 12 }}>
          <div>
            <label style={{ fontWeight: 700, color: "var(--taupe)" }}>避妊/去勢の有無</label>
            <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
              {[
                { id: "neutered", label: "済み（避妊/去勢）" },
                { id: "intact",   label: "未実施" },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`btn ${form.spayNeuter === opt.id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setField("spayNeuter", opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 700, color: "var(--taupe)" }}>運動量（分かりやすい目安）</label>
            <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {activityOptions.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`btn ${form.activityLevel === o.id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setField("activityLevel", o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 6, color: "var(--taupe)", fontSize: 13 }}>
              {activityOptions.find(a => a.id === form.activityLevel)?.desc}
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 700, color: "var(--taupe)" }}>目標</label>
            <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[
                { id: "maintain", label: "維持" },
                { id: "weight_loss", label: "減量" },
                { id: "weight_gain", label: "増量" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`btn ${form.goal === g.id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setField("goal", g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}>戻る</button>
            <button className="btn btn-primary" disabled={!canNext3} onClick={() => setStep(4)} style={{ flex: 1 }}>
              次へ
            </button>
          </div>
        </div>
      )}

      {/* 4: 健康フォーカス */}
      {step === 4 && (
        <div className="grid" style={{ gap: 10 }}>
          <label style={{ fontWeight: 700, color: "var(--taupe)" }}>健康フォーカス（任意）</label>
          <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
            {healthFocusOptions.map((opt) => {
              const selected = (form.healthFocus || []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`btn ${selected ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => {
                    const cur = Array.isArray(form.healthFocus) ? form.healthFocus : [];
                    const next = selected ? cur.filter((x) => x !== opt.id) : [...cur, opt.id];
                    setField("healthFocus", next);
                  }}
                >
                  <span style={{ marginRight: 6 }}>{opt.icon}</span>{opt.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button className="btn btn-ghost" onClick={() => setStep(3)}>戻る</button>
            <button className="btn btn-primary" onClick={finish} style={{ flex: 1 }}>
              完了してはじめる
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
