// components/utils/scoring.js
// === 7日間スコア算出（MVP：Energy/Protein/Fat/Ca/P/Omega3） ===

// AAFCO-ish minima per 1000 kcal (adult maintenance, approximated)
const MIN_PER_1000KCAL = {
  protein_g: 45,     // g
  fat_g: 13.8,       // g
  calcium_g: 1.25,   // g
  phosphorus_g: 1.0, // g
};

// Omega-3 (EPA+DHA) practical target
const OMEGA3_G_PER_KG_PER_DAY = 0.07; // 0.05–0.1 の中間値 → 週で ×7

export function calcRER(weightKg) {
  const w = Math.max(0.5, Number(weightKg) || 0.5);
  return 70 * Math.pow(w, 0.75);
}

// ✅ 避妊/去勢（spayNeuter）を係数に反映
export function merFactor({
  lifeStage = "adult",
  activityLevel = "Moderate",
  goal = "maintain",
  spayNeuter = "neutered", // "neutered" or "intact"
} = {}) {
  // 子犬は高係数（避妊有無の影響は小さいので同じ扱い）
  if (lifeStage === "puppy_lt4m") return 3.0;
  if (lifeStage === "puppy_ge4m") return 2.0;

  const neutered = spayNeuter === "neutered";

  // 目標に応じた微調整（簡易）
  if (goal === "weight_loss") return neutered ? 1.1 : 1.2;
  if (goal === "weight_gain") {
    // 増量は活動レベルを考慮しつつ少し高め
    if (activityLevel === "High") return neutered ? 2.1 : 2.3;
    if (activityLevel === "Low")  return neutered ? 1.6 : 1.8;
    return neutered ? 1.8 : 2.0;
  }

  // 維持
  if (activityLevel === "High") return neutered ? 2.0 : 2.2;
  if (activityLevel === "Low")  return neutered ? 1.3 : 1.5;
  return neutered ? 1.6 : 1.8; // Moderate
}

export function calcMERperDay(dog) {
  const rer = calcRER(dog?.weight || 0);
  return rer * merFactor({
    lifeStage: dog?.lifeStage || "adult",
    activityLevel: dog?.activityLevel || "Moderate",
    goal: dog?.goal || "maintain",
    spayNeuter: dog?.spayNeuter || "neutered",
  });
}

export function weeklyTargets(dog) {
  const mer = calcMERperDay(dog);
  const k = (mer / 1000) * 7; // 7日ぶんの 1000kcal 単位
  return {
    energy_kcal: mer * 7,
    protein_g: MIN_PER_1000KCAL.protein_g * k,
    fat_g: MIN_PER_1000KCAL.fat_g * k,
    calcium_g: MIN_PER_1000KCAL.calcium_g * k,
    phosphorus_g: MIN_PER_1000KCAL.phosphorus_g * k,
    omega3_g: (Number(dog?.weight) || 0) * (OMEGA3_G_PER_KG_PER_DAY * 7), // 週目標
    ca_p_ratio: { min: 1.2, max: 1.5, ideal: 1.3 },
  };
}

// 履歴7日 + 今日の食事を合算（history: [{date, meals:[]}]）
export function weeklyIntake(history = [], todayMeals = []) {
  const last6 = (Array.isArray(history) ? history : []).slice(-6);
  const days = [...last6.map(d => d.meals || []), (Array.isArray(todayMeals) ? todayMeals : [])];

  const sum = { energy_kcal: 0, protein_g: 0, fat_g: 0, calcium_g: 0, phosphorus_g: 0, omega3_g: 0 };
  for (const meals of days) {
    for (const m of meals) {
      sum.energy_kcal += Number(m?.calories) || 0;
      sum.protein_g   += Number(m?.protein) || 0;
      sum.fat_g       += Number(m?.fat) || 0;
      sum.calcium_g   += Number(m?.calcium) || 0;
      sum.phosphorus_g+= Number(m?.phosphorus) || 0;
      sum.omega3_g    += Number(m?.omega3) || 0;
    }
  }
  return sum;
}

function pct(intake, target) {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(120, (intake / target) * 100)); // 0〜120%でクリップ
}

function ratioScore(ca, p, {min, max, ideal}) {
  if ((ca || 0) <= 0 || (p || 0) <= 0) return 0;
  const r = ca / p;
  if (r >= min && r <= max) {
    const span = Math.max(ideal - min, max - ideal);
    const d = Math.abs(r - ideal);
    const s = 100 - (d / span) * 10; // ideal→100, 境界→約90
    return Math.max(90, Math.min(100, s));
  }
  const dist = r < min ? (min - r) : (r - max);
  const s = 90 - dist * 60; // 例：0.3ズレで 72
  return Math.max(60, Math.min(89, s));
}

export function computeWeeklyScores(dog, history, todayMeals) {
  const tgt = weeklyTargets(dog);
  const in7 = weeklyIntake(history, todayMeals);

  const scores = {
    energy:      Math.round(pct(in7.energy_kcal, tgt.energy_kcal)),
    protein:     Math.round(pct(in7.protein_g,   tgt.protein_g)),
    fat:         Math.round(pct(in7.fat_g,       tgt.fat_g)),
    calcium:     Math.round(pct(in7.calcium_g,   tgt.calcium_g)),
    phosphorus:  Math.round(pct(in7.phosphorus_g,tgt.phosphorus_g)),
    omega3:      Math.round(pct(in7.omega3_g,    tgt.omega3_g)),
    ca_p_balance: Math.round(ratioScore(in7.calcium_g, in7.phosphorus_g, tgt.ca_p_ratio)),
  };

  const radar = [
    { label: "Energy",     value: scores.energy },
    { label: "Protein",    value: scores.protein },
    { label: "Fat",        value: scores.fat },
    { label: "Calcium",    value: scores.calcium },
    { label: "Phosphorus", value: scores.phosphorus },
    { label: "Omega-3",    value: scores.omega3 },
  ];

  return { targets: tgt, intake: in7, scores, radar };
}

// 不足量→提案例（MVP）
export function simpleFixes(deficits) {
  const out = [];
  if (deficits.calcium_g > 0.01) {
    const grams = Math.ceil((deficits.calcium_g / 0.37) * 10) / 10; // 卵殻Ca=0.37 g/g
    out.push({ title: "カルシウムを補う", detail: "卵殻パウダーを追加", amount: grams, unit: "g/週" });
  }
  if (deficits.omega3_g > 0.05) {
    const grams = Math.ceil((deficits.omega3_g / 0.30) * 10) / 10; // フィッシュオイルEPA+DHA目安
    out.push({ title: "オメガ3を補う", detail: "フィッシュオイルやサーディンを追加", amount: grams, unit: "g/週（油換算）" });
  }
  if (deficits.protein_g > 1) {
    const grams = Math.ceil((deficits.protein_g / 0.31) / 10) * 10; // 鶏胸肉P=0.31 g/g
    out.push({ title: "タンパク質を補う", detail: "鶏胸肉や白身魚を追加", amount: grams, unit: "g/週（鶏胸目安）" });
  }
  if (deficits.fat_g > 1) {
    const grams = Math.ceil((deficits.fat_g / 0.14) / 10) * 10; // サーモン脂質=0.14 g/g
    out.push({ title: "脂質を補う", detail: "サーモンやオイルを少量追加", amount: grams, unit: "g/週（サーモン目安）" });
  }
  return out;
}
