// components/MealInput.jsx
"use client";
import React, { useMemo, useState } from "react";
import { INGREDIENTS } from "./data/ingredients";

export default function MealInput({ meals, setMeals, dogName = "", onNext, onBack }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [portion, setPortion] = useState(100); // g
  const [method, setMethod] = useState("Raw"); // Raw / Boiled / Steamed / Baked

  const filtered = useMemo(() => {
    if (!search) return INGREDIENTS.slice(0, 12);
    return INGREDIENTS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const addMeal = () => {
    if (!selected || !portion) return;
    const scale = Number(portion) / 100;
    const entry = {
      id: Date.now(),
      name: selected.name,
      portion: Number(portion),
      method,
      protein: +(selected.protein * scale).toFixed(2),
      fat: +(selected.fat * scale).toFixed(2),
      carbs: +(selected.carbs * scale).toFixed(2),
      calories: +(selected.calories * scale).toFixed(0),

      // ★ 追加：7日レーダー用の必須栄養
      fiber: +(Number(selected.fiber || 0) * scale).toFixed(2),
      calcium: +(Number(selected.calcium || 0) * scale).toFixed(3),      // g
      phosphorus: +(Number(selected.phosphorus || 0) * scale).toFixed(3),// g
      omega3: +(Number(selected.omega3 || 0) * scale).toFixed(3),        // g
    };
    setMeals([...(meals || []), entry]);
    setSelected(null);
    setPortion(100);
    setMethod("Raw");
    setSearch("");
  };

  const removeMeal = (id) => {
    setMeals((meals || []).filter(m => m.id !== id));
  };

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
          {filtered.map((i) => (
            <button
              key={i.name}
              className="btn btn-ghost"
              onClick={() => setSelected(i)}
              style={{ justifyContent: "flex-start" }}
            >
              <span style={{ fontWeight: 700, marginRight: 6 }}>{i.name}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                {i.protein}g P • {i.calories} kcal /100g
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 選択詳細 */}
      {selected && (
        <div className="card" style={{ marginTop: 12, background: "var(--cloud)" }}>
          <div style={{ fontWeight: 700, color: "var(--taupe)" }}>{selected.name}</div>

          {/* 分量＆クイックボタン */}
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
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* クイック分量プリセット */}
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            {[50, 100, 200].map(g => (
              <button key={g} className="btn btn-ghost" onClick={() => setPortion(g)}>
                {g} g
              </button>
            ))}
          </div>

          {/* 追加ボタン */}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={addMeal} style={{ flex: 1 }}>
              Add to list
            </button>
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 追加済みの食材一覧 */}
      {meals?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: "var(--taupe)", marginBottom: 8 }}>
            Today’s Meals
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {meals.map(m => (
              <div key={m.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div className="mealTitle" style={{ fontWeight: 700 }}>{m.name}</div>
                    <div className="mealSub" style={{ color: "var(--taupe)", fontSize: 14 }}>
                      {m.portion}g • {m.method} • {m.calories} kcal
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {m.protein}g P / {m.fat}g F / {m.carbs}g C • Ca {m.calcium}g / P {m.phosphorus}g / Ω3 {m.omega3}g
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => removeMeal(m.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 次へ */}
          {onNext && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              {onBack && <button className="btn btn-ghost" onClick={onBack}>Back</button>}
              <button className="btn btn-primary" onClick={onNext} style={{ flex: 1 }}>
                Go to Summary
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
