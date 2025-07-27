// components/DailySuggestions.jsx
"use client";
import React, { useMemo } from "react";

/** ---- 簡易モデル（MVP向け）----
 * 目標:
 *  - たんぱく質: 2.0 g/kg（High=2.4, Low=1.6）
 *  - 脂質:       1.0 g/kg（High=1.3, Low=0.8）
 *  - エネルギー: MER = 70*kg^0.75 * 活動係数(低1.4/中1.6/高2.0)
 * 代表食材の係数（/g）:
 *  - Chicken Breast: P=0.31, F=0.036, kcal=1.65
 *  - Salmon:         P=0.25, F=0.14,  kcal=2.08
 *  - Sweet Potato:               kcal=0.86
 */

function kgFrom(weight, unit) {
  if (!weight) return 10;
  const w = Number(weight) || 10;
  return (unit || "kg") === "lbs" ? w / 2.20462 : w;
}
function activityFactor(level) {
  switch (level) {
    case "Low": return 1.4;
    case "High": return 2.0;
    default: return 1.6; // Moderate
  }
}
function proteinPerKg(level) {
  if (level === "High") return 2.4;
  if (level === "Low") return 1.6;
  return 2.0;
}
function fatPerKg(level) {
  if (level === "High") return 1.3;
  if (level === "Low") return 0.8;
  return 1.0;
}

export default function DailySuggestions({ meals = [], dogProfile = {}, onBack }) {
  const names = useMemo(
    () => (meals || []).map(m => (m.name || "").toLowerCase()),
    [meals]
  );

  const totals = useMemo(() => {
    return (meals || []).reduce(
      (a, m) => ({
        protein: a.protein + (m.protein || 0),
        fat: a.fat + (m.fat || 0),
        carbs: a.carbs + (m.carbs || 0),
        calories: a.calories + (m.calories || 0),
      }),
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    );
  }, [meals]);

  const targets = useMemo(() => {
    const kg = kgFrom(dogProfile.weight, dogProfile.weightUnit || "kg");
    const pf = proteinPerKg(dogProfile.activityLevel || "Moderate");
    const ff = fatPerKg(dogProfile.activityLevel || "Moderate");
    const rer = 70 * Math.pow(kg, 0.75);
    const mer = rer * activityFactor(dogProfile.activityLevel || "Moderate");
    return {
      kg,
      proteinG: Math.max(20, pf * kg),
      fatG: Math.max(8, ff * kg),
      energyKcal: Math.max(350, mer),
    };
  }, [dogProfile]);

  // 不足/過剰
  const gaps = useMemo(() => {
    const proteinGap = Math.max(0, targets.proteinG - totals.protein);     // g
    const fatGap     = Math.max(0, targets.fatG - totals.fat);             // g
    const energyGap  = Math.max(0, targets.energyKcal - totals.calories);  // kcal

    const proteinOver = Math.max(0, totals.protein - targets.proteinG);    // g
    const fatOver     = Math.max(0, totals.fat - targets.fatG);            // g
    const energyOver  = Math.max(0, totals.calories - targets.energyKcal); // kcal
    return { proteinGap, fatGap, energyGap, proteinOver, fatOver, energyOver };
  }, [totals, targets]);

  // 代表食材（係数/g）
  const chicken = { pPerG: 0.31, fPerG: 0.036, kcalPerG: 1.65 }; // Chicken Breast
  const salmon  = { pPerG: 0.25, fPerG: 0.14,  kcalPerG: 2.08 }; // Salmon
  const sp      = { kcalPerG: 0.86 };                             // Sweet Potato

  // 過剰 → どれくらい減らす？
  const removeSalmonForFatG = gaps.fatOver > 0
    ? Math.ceil(gaps.fatOver / salmon.fPerG) // 脂質過多をサーモン換算で削る場合
    : 0;

  const proteinLostIfRemoveSalmon = removeSalmonForFatG > 0
    ? removeSalmonForFatG * salmon.pPerG
    : 0;

  const addChickenToRestoreProteinG = proteinLostIfRemoveSalmon > 0
    ? Math.ceil(proteinLostIfRemoveSalmon / chicken.pPerG)
    : 0;

  const removeSweetPotatoForEnergyG = gaps.energyOver > 0
    ? Math.ceil(gaps.energyOver / sp.kcalPerG)
    : 0;

  const removeChickenForProteinG = gaps.proteinOver > 0
    ? Math.ceil(gaps.proteinOver / chicken.pPerG) // たんぱく過多をチキン換算で減らす
    : 0;

  // オメガ3/野菜/カルシウムの有無
  const hasOmega = names.some(n => n.includes("salmon") || n.includes("sardine") || n.includes("sardines") || n.includes("fish oil"));
  const hasVeg   = names.some(n => ["carrot","broccoli","spinach","pumpkin","sweet potato"].some(v => n.includes(v)));
  const hasCalciumSource = names.some(n => n.includes("eggshell") || n.includes("egg shell") || n.includes("sardine"));

  const tips = [];

  /* 1) まず “過剰” の具体的な減らし量を提示 */
  if (gaps.energyOver > 30) {
    const pct = Math.min(100, Math.round((gaps.energyOver / Math.max(1, totals.calories)) * 100));
    tips.push(`カロリーが目標を約 **${Math.round(gaps.energyOver)} kcal** 上回っています（約 ${pct}%）。さつまいもを **${removeSweetPotatoForEnergyG} g** 減らす、または総量を${pct}%目安で減らすのがおすすめ。`);
  }

  if (gaps.fatOver > 2) {
    if (names.some(n => n.includes("salmon"))) {
      tips.push(`脂質が過多：サーモンを **${removeSalmonForFatG} g** 減らすと改善。たんぱく質は減るため、必要ならチキン胸肉を **${addChickenToRestoreProteinG} g** 追加してPを維持。`);
    } else {
      const removeFatGenericG = Math.ceil(gaps.fatOver / 0.10); // “高脂質の肉類”をざっくり脂質10%想定で削る目安
      tips.push(`脂質が過多：高脂質食材（牛/ラム/皮つきなど）を合計 **${removeFatGenericG} g** 減らし、たんぱく確保はチキン胸肉に置き換えを。`);
    }
  }

  if (gaps.proteinOver > 5) {
    if (names.some(n => n.includes("chicken"))) {
      tips.push(`たんぱく質が多め：チキン胸肉を **${removeChickenForProteinG} g** 減らすと適正化。脂質やカロリーも一緒に少し下がります。`);
    } else {
      const removeLeanGenericG = Math.ceil(gaps.proteinOver / 0.25); // 代表的なたんぱく源（25%/g）で減算目安
      tips.push(`たんぱく質が多め：今日のたんぱく源を合計 **${removeLeanGenericG} g** 減らすと適正化。`);
    }
  }

  /* 2) 次に“不足”の追加提案（過剰がある場合は控えめに） */
  if (gaps.proteinOver === 0 && gaps.proteinGap > 3) {
    const addChickenG = Math.ceil(
      Math.min(
        gaps.proteinGap / chicken.pPerG,
        gaps.energyGap > 0 ? gaps.energyGap / chicken.kcalPerG : Infinity
      )
    );
    tips.push(`たんぱく質が不足気味：チキン胸肉を **${addChickenG} g** 追加すると目標に近づきます。`);
  }

  if (gaps.fatOver === 0 && gaps.fatGap > 2) {
    const addSalmonG = Math.ceil(
      Math.min(
        gaps.fatGap / salmon.fPerG,
        gaps.energyGap > 0 ? gaps.energyGap / salmon.kcalPerG : Infinity
      )
    );
    tips.push(`必須脂肪が不足：サーモンを **${addSalmonG} g** 追加（オメガ3の補強にも◎）。`);
  }

  if (gaps.energyOver === 0 && gaps.energyGap > 30) {
    const addSpG = Math.ceil(gaps.energyGap / sp.kcalPerG);
    tips.push(`エネルギーが不足：さつまいもを **${addSpG} g** 追加でカロリー補完。`);
  }

  /* 3) オメガ3/野菜/カルシウムのヒューリスティック */
  if (!hasOmega && gaps.fatOver === 0) {
    tips.push(`オメガ3がやや不足傾向：サーモン 20–40 g の追加、またはフィッシュオイル 1–2 g/日 を検討。`);
  }
  if (!hasVeg) {
    tips.push(`ビタミン・食物繊維の強化：にんじん／ブロッコリー／かぼちゃを **30–50 g** 追加がおすすめ。`);
  }
  if (!hasCalciumSource) {
    tips.push(`カルシウムの微調整：卵殻パウダー **0.5–1.0 g** を目安に検討（体質や既往歴は必ず獣医師に相談）。`);
  }

  if (tips.length === 0) {
    tips.push("バランス良好！分量を大きく変えず、この調子で継続しましょう。");
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Daily Suggestions 💡</h2>
      <div style={{ color: "var(--taupe)", marginBottom: 8 }}>
        {dogProfile.name ? `${dogProfile.name} のための提案` : "今日の提案"}
        （体重 {dogProfile.weight || "?"}{dogProfile.weightUnit || "kg"}・活動 {dogProfile.activityLevel || "Moderate"} を基準）
      </div>

      <div className="kpi" style={{ gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <span className="badge">P: {totals.protein.toFixed(1)}/{Math.round(targets.proteinG)} g</span>
        <span className="badge">F: {totals.fat.toFixed(1)}/{Math.round(targets.fatG)} g</span>
        <span className="badge">Kcal: {Math.round(totals.calories)}/{Math.round(targets.energyKcal)}</span>
      </div>

      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {tips.map((t, i) => (
          <li key={i} style={{ marginBottom: 10 }}>{t}</li>
        ))}
      </ul>

      <div style={{ fontSize: 12, color: "var(--taupe)", marginTop: 12 }}>
        ※ 本MVPの提案は一般的な目安です。疾患管理・サプリ量は獣医師にご相談ください。
      </div>

      {onBack && (
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-ghost" onClick={onBack}>Back</button>
        </div>
      )}
    </section>
  );
}
