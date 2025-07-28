// components/MealInput.jsx
"use client";
import React, { useMemo, useState } from "react";
import { INGREDIENTS } from "./data/ingredients";

export default function MealInput({ meals, setMeals, dogName = "", onNext, onBack }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [portion, setPortion] = useState(100); // g
  const [method, setMethod] = useState("Raw"); // Raw / Boiled / Steamed / Baked

  // 検索
  const filtered = useMemo(() => {
    if (!search) return INGREDIENTS.slice(0, 12);
    const q = search.toLowerCase();
    return INGREDIENTS.filter(i => i.name.toLowerCase().includes(q)).slice(0, 30);
  }, [search]);

  const addMeal = () => {
    if (!selected || !portion) return;
    const scale = Number(portion) / 100;

    // 8軸に必要なフィールドを全て持たせる
    const entry = {
      id: Date.now(),
      name: selected.name,
      portion: Number(portion),
      method,

      protein: +(selected.protein * scale).toFixed(2),
      fat: +(selected.fat * scale).toFixed(2),
      carbs: +(selected.carbs * scale).toFixed(2),
      calories: Math.round(selected.calories * scale),

      fiber: +(selected.fiber * scale).toFixed(2),
      calcium: +(selected.calcium * scale).toFixed(3),       // g
      phosphorus: +(selected.phosphorus * scale).toFixed(3), // g
      omega3: +(selected.omega3 * scale).toFixed(2),         // g

      // マイクロ栄養はユニット化（相対指標）
      vitaminUnits: +(selected.vitamin_score * scale).toFixed(3),
      mineralUnits: +(selected.mineral_score * scale).toFixed(3),
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

        {/* 候補 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {filtered.map((i) => (
            <button
              key={i.name}
              className="btn btn-ghost"
              onClick={() => setSelected(i)}
              style={{ justifyContent: "flex-start" }}
            >
              <div style={{ fontWeight: 700, marginRight: 6 }}>{i.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {i.protein}g P • {i.fat}g F • {i.calories} kcal /100g
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 詳細 */}
      {selected && (
        <div className="card" style={{ marginTop: 12, background: "var(--cloud)" }}>
          <div style={{ fontWeight: 700, color: "var(--taupe)" }}>{selected.name}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <div>
              <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)" }}>Portion (g)</label>
              <input
                type="number"
                min="1"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)" }}>Method</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {["Raw","Boiled","Steamed","Baked"].map(m => (
                  <button key={m} className={`btn ${method === m ? "btn-primary" : "btn-ghost"}`} onClick={() => setMethod(m)}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* クイック量 */}
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            {[50, 100, 200].map(g => (
              <button key={g} className="btn btn-ghost" onClick={() => setPortion(g)}>{g} g</button>
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={addMeal} style={{ flex: 1 }}>
              Add to list
            </button>
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
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
                      P {m.protein}g / F {m.fat}g / C {m.carbs}g • Fiber {m.fiber}g • Ca {m.calcium}g • P {m.phosphorus}g • ω3 {m.omega3}g
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => removeMeal(m.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {onNext && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              {onBack && <button className="btn btn-ghost" onClick={onBack}>Back</button>}
              <button className="btn btn-primary" onClick={onNext} style={{ flex: 1 }}>Go to Summary</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
