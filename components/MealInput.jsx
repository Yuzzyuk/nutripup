// components/MealInput.jsx
"use client";
import React, { useMemo, useState } from "react";

export default function MealInput({ meals, setMeals, dogName = "", onNext, onBack }) {
  // よく使う食材（100gあたりの栄養）
  const INGREDIENTS = useMemo(() => [
    { name: "Chicken Breast", protein: 31, fat: 3.6, carbs: 0, calories: 165 },
    { name: "Salmon", protein: 25, fat: 14, carbs: 0, calories: 208 },
    { name: "Beef (lean)", protein: 26, fat: 10, carbs: 0, calories: 217 },
    { name: "Eggs", protein: 13, fat: 11, carbs: 1.1, calories: 155 },
    { name: "Turkey", protein: 29, fat: 7, carbs: 0, calories: 189 },
    { name: "Lamb", protein: 25, fat: 16, carbs: 0, calories: 294 },
    { name: "Brown Rice (cooked)", protein: 2.6, fat: 0.9, carbs: 23, calories: 111 },
    { name: "White Rice (cooked)", protein: 2.4, fat: 0.3, carbs: 28, calories: 130 },
    { name: "Sweet Potato (boiled)", protein: 2, fat: 0.1, carbs: 20, calories: 86 },
    { name: "Pumpkin", protein: 1, fat: 0.1, carbs: 7, calories: 26 },
    { name: "Carrots (raw)", protein: 0.9, fat: 0.2, carbs: 10, calories: 41 },
    { name: "Broccoli (steamed)", protein: 2.8, fat: 0.4, carbs: 7, calories: 35 },
    { name: "Spinach (raw)", protein: 2.9, fat: 0.4, carbs: 3.6, calories: 23 },
    { name: "Blueberries", protein: 0.7, fat: 0.3, carbs: 14, calories: 57 },
    { name: "Apple (no seeds)", protein: 0.3, fat: 0.2, carbs: 14, calories: 52 },
    { name: "Cottage Cheese (low-fat)", protein: 11, fat: 4.3, carbs: 3.4, calories: 98 },
    { name: "Yogurt (plain)", protein: 10, fat: 5, carbs: 3.6, calories: 95 },
    { name: "Oats (cooked)", protein: 2.5, fat: 1.5, carbs: 12, calories: 71 },
    { name: "Olive Oil", protein: 0, fat: 100, carbs: 0, calories: 884 },
    { name: "Sardines (in water)", protein: 25, fat: 11, carbs: 0, calories: 208 },
  ], []);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [portion, setPortion] = useState(100); // g
  const [method, setMethod] = useState("Raw"); // Raw / Boiled / Steamed / Baked

  const filtered = useMemo(() => {
    if (!search) return INGREDIENTS.slice(0, 8);
    return INGREDIENTS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, INGREDIENTS]);

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
    };
    setMeals([...(meals || []), entry]);
    // reset
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
                    <div style={{ fontWeight: 700 }}>{m.name}</div>
                    <div style={{ fontSize: 14, color: "var(--taupe)" }}>
                      {m.portion}g • {m.method} • {m.calories} kcal
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {m.protein}g P / {m.fat}g F / {m.carbs}g C
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
