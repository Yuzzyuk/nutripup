// components/MealInput.jsx
"use client";
import React, { useMemo, useState } from "react";
import { INGREDIENTS } from "./data/ingredients";

// どちらのスキーマでも読めるようにアダプタ
function readPer100(item = {}) {
  // 旧：{ per100: { protein, fat, carbs, calories, fiber, calcium, phosphorus, vitScore100 } }
  if (item.per100 && typeof item.per100 === "object") {
    const p = item.per100 || {};
    return {
      protein: p.protein ?? 0,
      fat: p.fat ?? 0,
      carbs: p.carbs ?? 0,
      calories: p.calories ?? 0,
      fiber: p.fiber ?? 0,
      calcium: p.calcium ?? 0,      // g
      phosphorus: p.phosphorus ?? 0,// g
      vitScore100: p.vitScore100 ?? 0, // 任意スコア/100g
    };
  }
  // あなたの現行：フラット（vitamin_score: 0〜1 の相対指標）
  return {
    protein: item.protein ?? 0,
    fat: item.fat ?? 0,
    carbs: item.carbs ?? 0,
    calories: item.calories ?? 0,
    fiber: item.fiber ?? 0,
    calcium: item.calcium ?? 0,        // g
    phosphorus: item.phosphorus ?? 0,  // g
    // vitamin_score(0..1) → 0..100 にスケールして暫定ビタミンスコア化
    vitScore100:
      item.vitScore100 ?? ((item.vitamin_score ?? 0) * 100),
  };
}

export default function MealInput({ meals, setMeals, dogName = "", onNext, onBack }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [portion, setPortion] = useState(100); // g
  const [method, setMethod] = useState("Raw"); // Raw / Boiled / Steamed / Baked

  const options = Array.isArray(INGREDIENTS) ? INGREDIENTS : [];

  const filtered = useMemo(() => {
    if (!search) return options.slice(0, 12);
    return options.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, options]);

  const addMeal = () => {
    if (!selected || !portion) return;
    const per100 = readPer100(selected);
    const scale = Number(portion) / 100;

    const entry = {
      id: Date.now(),
      name: selected.name,
      portion: Number(portion),
      method,
      // 8-Axis に必要な栄養を全部保存
      protein:     +( (per100.protein     || 0) * scale ).toFixed(2),
      fat:         +( (per100.fat         || 0) * scale ).toFixed(2),
      carbs:       +( (per100.carbs       || 0) * scale ).toFixed(2),
      calories:    Math.round( (per100.calories || 0) * scale ),
      fiber:       +( (per100.fiber       || 0) * scale ).toFixed(2),
      calcium:     +( (per100.calcium     || 0) * scale ).toFixed(3),   // g
      phosphorus:  +( (per100.phosphorus  || 0) * scale ).toFixed(3),   // g
      vitScore:    +( (per100.vitScore100 || 0) * scale ).toFixed(1),   // 0..100ベースを分量に按分
    };

    setMeals([...(meals || []), entry]);
    setSelected(null);
    setPortion(100);
    setMethod("Raw");
    setSearch("");
  };

  const removeMeal = (id) => setMeals((meals || []).filter(m => m.id !== id));

  const today = new Date().toLocaleDateString();

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>
        {dogName ? `${dogName}’s Meals` : "Today’s Meals"} 🍽️
      </h2>
      <div style={{ color: "var(--taupe)", marginBottom: 8 }}>{today}</div>

      {/* 検索 */}
      <div style={{ display: "grid", gap: 8 }}>
        <input
          type="text"
          value={search}
          placeholder="Search ingredient…"
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
        />

        {/* 候補リスト */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {filtered.map((i) => {
            const per100 = readPer100(i);
            return (
              <button
                key={i.name}
                className="btn btn-ghost"
                onClick={() => setSelected(i)}
                style={{ justifyContent: "flex-start" }}
                type="button"
              >
                <span style={{ fontWeight: 700, marginRight: 6 }}>{i.name}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  {per100.protein}g P • {per100.calories} kcal /100g
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 選択詳細 */}
      {selected && (
        <div className="card" style={{ marginTop: 12, background: "var(--cloud)" }}>
          <div style={{ fontWeight: 700, color: "var(--taupe)" }}>{selected.name}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <div>
              <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)" }}>
                Portion (g)
              </label>
              <input
                type="number"
                min="1"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)" }}>
                Method
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {["Raw", "Boiled", "Steamed", "Baked"].map(m => (
                  <button
                    key={m}
                    className={`btn ${method === m ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setMethod(m)}
                    type="button"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            {[50, 100, 200].map(g => (
              <button key={g} className="btn btn-ghost" onClick={() => setPortion(g)} type="button">
                {g} g
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={addMeal} style={{ flex: 1 }} type="button">
              Add to list
            </button>
            <button className="btn btn-ghost" onClick={() => setSelected(null)} type="button">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 追加済み */}
      {meals?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: "var(--taupe)", marginBottom: 8 }}>Today’s Meals</div>
          <div style={{ display: "grid", gap: 8 }}>
            {meals.map(m => (
              <div key={m.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.name}</div>
                    <div style={{ fontSize: 14, color: "var(--taupe)" }}>
                      {m.portion}g • {m.method} • {m.calories} kcal
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {m.protein}g P / {m.fat}g F / {m.carbs}g C • {m.fiber ?? 0}g fiber
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => removeMeal(m.id)} type="button">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {onNext && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              {onBack && <button className="btn btn-ghost" onClick={onBack} type="button">Back</button>}
              <button className="btn btn-primary" onClick={onNext} style={{ flex: 1 }} type="button">
                Go to Summary
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
