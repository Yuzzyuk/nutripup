// components/utils/nutrition.js

/* ===== 日付ユーティリティ ===== */
export function toYMD(d) {
  const dt = (d instanceof Date) ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getLastNDates(n = 7, anchor = new Date()) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - i);
    out.push(toYMD(d));
  }
  return out;
}

/* ===== 栄養合計 ===== */
export function sumDay(meals = []) {
  const rows = Array.isArray(meals) ? meals : [];
  return rows.reduce(
    (a, m) => ({
      protein:     a.protein     + (Number(m?.protein)     || 0),
      fat:         a.fat         + (Number(m?.fat)         || 0),
      carbs:       a.carbs       + (Number(m?.carbs)       || 0),
      calories:    a.calories    + (Number(m?.calories)    || 0),
      fiber:       a.fiber       + (Number(m?.fiber)       || 0),
      calcium:     a.calcium     + (Number(m?.calcium)     || 0),
      phosphorus:  a.phosphorus  + (Number(m?.phosphorus)  || 0),
    }),
    { protein:0, fat:0, carbs:0, calories:0, fiber:0, calcium:0, phosphorus:0 }
  );
}

export function sumWindow({ history = [], mealsToday = [], days = 7 }) {
  // history: [{date: ISO or any, meals: []}, ...]
  const dates = getLastNDates(days);
  const byDate = new Map();
  (Array.isArray(history) ? history : []).forEach((h) => {
    const key = toYMD(h?.date);
    const prev = byDate.get(key) || [];
    byDate.set(key, prev.concat(h?.meals || []));
  });
  // 今日の未保存分（mealsToday）も入れる
  const todayKey = toYMD(new Date());
  const todayPrev = byDate.get(todayKey) || [];
  byDate.set(todayKey, todayPrev.concat(Array.isArray(mealsToday) ? mealsToday : []));

  // 集計
  return dates.reduce((tot, d) => {
    const day = sumDay(byDate.get(d) || []);
    Object.keys(tot).forEach((k) => (tot[k] += (day[k] || 0)));
    return tot;
  }, { protein:0, fat:0, carbs:0, calories:0, fiber:0, calcium:0, phosphorus:0 });
}

/* ===== 目標（体重 & 活動レベル） ===== */
export function dailyTargets(dog = {}) {
  const wt = Number(dog?.weight) || 10; // kg
  // RER → MER
  const rer = 70 * Math.pow(wt, 0.75);
  const act =
    dog?.activityLevel === "High" ? 1.6 :
    dog?.activityLevel === "Low"  ? 1.2 : 1.4;
  const mer = rer * act; // kcal/day

  // 仮の係数（後でチューニング可能）
  return {
    calories:   mer,        // kcal/day
    protein:    wt * 2.5,   // g/day
    fat:        wt * 1.2,   // g/day
    fiber:      Math.max(8, Math.min(18, wt * 0.7)), // g/day（下限8, 上限18）
    calcium:    wt * 0.07,  // g/day
    phosphorus: wt * 0.06,  // g/day
  };
}

export function windowTargets(dog = {}, days = 7) {
  const d = dailyTargets(dog);
  return Object.fromEntries(Object.entries(d).map(([k,v]) => [k, v * days]));
}

/* ===== スコア／進捗 ===== */
export function bandScore(actual, target, bandLow = 0.9, bandHigh = 1.1) {
  if (!target || target <= 0) return 100;
  const r = actual / target;
  if (r >= bandLow && r <= bandHigh) return 100;
  const dist = r < bandLow ? (bandLow - r) / bandLow : (r - bandHigh) / bandHigh;
  return Math.max(0, Math.round(100 - dist * 200));
}

export function caPratioScore(ca, p, ideal = 1.4, tol = 0.3) {
  if (ca <= 0 || p <= 0) return 0;
  const ratio = ca / p;
  const low = ideal - tol, high = ideal + tol;
  if (ratio >= low && ratio <= high) return 100;
  const dist = ratio < low ? (low - ratio) / low : (ratio - high) / high;
  return Math.max(0, Math.round(100 - dist * 250));
}

export function weeklyProgress(weekSum, weekTarget) {
  // 達成率（%）: 100%を上限にクリップ（レーダー用）
  const pct = (a,t) => (t>0 ? Math.max(0, Math.min(100, Math.round((a/t) * 100))) : 100);

  const progress = {
    protein:    pct(weekSum.protein,    weekTarget.protein),
    fats:       pct(weekSum.fat,        weekTarget.fat),
    energy:     pct(weekSum.calories,   weekTarget.calories),
    fiber:      pct(weekSum.fiber,      weekTarget.fiber),
    calcium:    pct(weekSum.calcium,    weekTarget.calcium),
    phosphorus: pct(weekSum.phosphorus, weekTarget.phosphorus),
  };

  // 代理：ミネラル＝Ca/P充足＋比率の平均、ビタミンは当面固定60
  const caSc = bandScore(weekSum.calcium, weekTarget.calcium, 0.85, 1.15);
  const pSc  = bandScore(weekSum.phosphorus, weekTarget.phosphorus, 0.85, 1.15);
  const ratioSc = caPratioScore(weekSum.calcium, weekSum.phosphorus);
  progress.minerals = Math.round(((caSc + pSc) / 2 + ratioSc) / 2);
  progress.vitamins = 60;

  return progress;
}

export function weeklyGaps(weekSum, weekTarget) {
  // 残量（負は0に）
  const gap = (t,a) => Math.max(0, (t||0) - (a||0));
  return {
    calories:   Math.round(gap(weekTarget.calories,   weekSum.calories)),
    protein:    Math.round(gap(weekTarget.protein,    weekSum.protein)),
    fat:        Math.round(gap(weekTarget.fat,        weekSum.fat)),
    fiber:      Math.round(gap(weekTarget.fiber,      weekSum.fiber)),
    calcium:    +(gap(weekTarget.calcium,             weekSum.calcium)).toFixed(1),
    phosphorus: +(gap(weekTarget.phosphorus,          weekSum.phosphorus)).toFixed(1),
  };
}
