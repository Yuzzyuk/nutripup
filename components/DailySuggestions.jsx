// components/DailySuggestions.jsx
"use client";
import React, { useMemo } from "react";

/** ---- 簡易モデル（MVP向け）----
 * 目標値:
 *  - たんぱく質: 2.0 g/kg（Highは2.4 g/kg、Lowは1.6 g/kg）
 *  - 脂質: 1.0 g/kg（Highは1.3 g/kg、Lowは0.8 g/kg）
 *  - エネルギー: RER=70*kg^0.75, MER=RER*活動係数(低1.4/中1.6/高2.0)
 * 提案の食材換算:
 *  - Chicken Breast: P=0.31 g/g, F=0.036 g/g, 1.65 kcal/g
 *  - Salmon:        F=0.14 g/g, P=0.25 g/g, 2.08 kcal/g
 *  - Sweet Potato:  0.86 kcal/g（炭水化物源として）
 *  - Fish Oil(参考): ~9 kcal/g（脂質1g/g）※ここでは文言のみ
 *  - Eggshell powder(参考): 0.5–1.0g を目安の提案（要獣医相談）
 * 注意: ミネラル・ビタミンは精密計算ではなく、食材の有無ヒューリスティック。
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
    const energyOver = Math.max(0, totals.calories - targets.energyKcal);  // kcal
    return { proteinGap, fatGap, energyGap, energyOver };
  }, [totals, targets]);

  // 食材あたりの係数
  const chicken = { pPerG: 0.31, fPerG: 0.036, kcalPerG: 1.65 }; // Chicken Breast
  const salmon  = { pPerG: 0.25, fPerG: 0.14,  kcalPerG: 2.08 };
  const sp      = { kcalPerG: 0.86 };                             // Sweet Potato

  // 目標に近づくための“最小限”の追加量（カロリーを大きく超えないように上限も考慮）
  const addChickenG = gaps.proteinGap > 0
    ? Math.ceil(Math.min(
        gaps.proteinGap / chicken.pPerG,
        gaps.energyGap > 0 ? gaps.energyGap / chicken.kcalPerG : Infinity
      ))
    : 0;

  const addSalmonG = gaps.fatGap > 0
    ? Math.ceil(Math.min(
        gaps.fatGap / salmon.fPerG,
        gaps.energyGap > 0 ? gaps.energyGap / salmon.kcalPerG : Infinity
      ))
    : 0;

  const addSweetPotatoG = gaps.energyGap > 0
    ? Math.ceil(gaps.energyGap / sp.kcalPerG)
    : 0;

  // オメガ3/野菜/カルシウムのヒューリスティック
  const hasOmega = names.some(n => n.includes("salmon") || n.includes("sardine") || n.includes("sardines") || n.includes("fish oil"));
  const hasVeg   = names.some(n => ["carrot","broccoli","spinach","pumpkin","sweet potato"].some(v => n.includes(v)));
  const hasCalciumSource = names.some(n => n.includes("eggshell") || n.includes("egg shell") || n.includes("sardine"));

  // 提案を生成
  const tips = [];

  // カロリー過多のときはまず調整案
  if (gaps.energyOver > 50) {
    tips.push(`カロリーが目標を約 ${Math.round(gaps.energyOver)} kcal 上回っています。高脂質・高炭水化物の量を少し減らし、より脂肪の少ない部位（チキン胸肉など）に置き換えるのがおすすめ。`);
  }

  if (gaps.proteinGap > 3) {
    tips.push(`たんぱく質が不足気味：チキン胸肉を約 **${addChickenG} g** 追加すると目標に近づきます。`);
  } else if (totals.protein > targets.proteinG * 1.25) {
    tips.push(`たんぱく質がやや多め：脂質やカロリーが過多なら、たんぱく源を少し減らす/低脂肪カットに置き換えを検討。`);
  }

  if (gaps.fatGap > 2) {
    tips.push(`必須脂肪が不足：サーモンを約 **${addSalmonG} g** 追加（オメガ3の補強にも◎）。`);
  } else if (totals.fat > targets.fatG * 1.3) {
    tips.push(`脂質が多め：サーモンや牛など高脂肪食材を少し減らし、チキン胸肉などに置き換えるとバランス改善。`);
  }

  // エネルギーがまだ足りないなら軽めの炭水化物で調整
  if (gaps.energyGap > 30) {
    tips.push(`エネルギーが不足：さつまいもを約 **${addSweetPotatoG} g** 追加でカロリー補完。`);
  }

  // オメガ3がなさそうなら軽い提案
  if (!hasOmega) {
    tips.push(`オメガ3がやや不足傾向：サーモン 20–40 g 追加、もしくはフィッシュオイル 1–2 g/日 を検討。`);
  }

  // 野菜が少なそうなら軽い提案
  if (!hasVeg) {
    tips.push(`ビタミン・食物繊維の強化：にんじん／ブロッコリー／かぼちゃを **30–50 g** 追加がおすすめ。`);
  }

  // カルシウム源がなさそうなら（一般的な目安として）
  if (!hasCalciumSource) {
    tips.push(`カルシウムの微調整：卵殻パウダー **0.5–1.0 g** を目安に検討（体質や既往歴は必ず獣医師に相談）。`);
  }

  // 何も不足が大きくなければ褒める
  if (tips.length === 0) {
    tips.push("バランス良し！この調子で継続。オメガ3と野菜が毎日少量でも入るとさらに安定します。");
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Daily Suggestions 💡</h2>
      <div style={{ color: "var(--taupe)", marginBottom: 8 }}>
        {dogProfile.name ? `${dogProfile.name} のための提案` : "今日の提案"}（体重 {dogProfile.weight || "?"}{dogProfile.weightUnit || "kg"}・活動 {dogProfile.activityLevel || "Moderate"} を基準）
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
