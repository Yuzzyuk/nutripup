"use client";
import React, { useMemo, useState } from "react";

export default function MainComponent() {
  /* ---------------- State ---------------- */
  const [step, setStep] = useState("home"); // "home" / "profile" / "meals" / "summary"
  const [dog, setDog] = useState({
    name: "",
    age: "",
    breed: "",
    weight: "",
    weightUnit: "kg",
    activityLevel: "Moderate",
    healthFocus: [], // 配列（includesエラーを避けるために常に配列）
  });

  const [search, setSearch] = useState("");
  const [portion, setPortion] = useState("100");
  const [method, setMethod] = useState("raw");
  const [dailyMeals, setDailyMeals] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiText, setAiText] = useState("");

  /* ---------------- Data ---------------- */
  const ingredients = [
    { name: "Chicken Breast", protein: 31, fat: 3.6, carbs: 0, calories: 165 },
    { name: "Salmon", protein: 25, fat: 14, carbs: 0, calories: 208 },
    { name: "Sweet Potato", protein: 2, fat: 0.1, carbs: 20, calories: 86 },
    { name: "Brown Rice", protein: 2.6, fat: 0.9, carbs: 23, calories: 111 },
    { name: "Carrots", protein: 0.9, fat: 0.2, carbs: 10, calories: 41 },
    { name: "Spinach", protein: 2.9, fat: 0.4, carbs: 3.6, calories: 23 },
    { name: "Beef", protein: 26, fat: 15, carbs: 0, calories: 250 },
    { name: "Pumpkin", protein: 1, fat: 0.1, carbs: 7, calories: 26 },
    { name: "Blueberries", protein: 0.7, fat: 0.3, carbs: 14, calories: 57 },
    { name: "Eggs", protein: 13, fat: 11, carbs: 1.1, calories: 155 },
  ];

  const filtered = useMemo(() => {
    if (!search) return [];
    return ingredients.filter((i) =>
      i.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  /* ---------------- Helpers ---------------- */
  const score = useMemo(() => {
    if (!dailyMeals.length) {
      return {
        protein: 0, fats: 0, minerals: 0, vitamins: 0,
        energy: 0, fiber: 0, calcium: 0, phosphorus: 0,
      };
    }
    const total = dailyMeals.reduce(
      (acc, m) => {
        acc.protein += m.protein || 0;
        acc.fat += m.fat || 0;
        acc.carbs += m.carbs || 0;
        acc.calories += m.calories || 0;
        return acc;
      },
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    );
    return {
      protein: Math.min(100, (total.protein / 50) * 100),
      fats: Math.min(100, (total.fat / 15) * 100),
      minerals: 60,
      vitamins: 60,
      energy: Math.min(100, (total.calories / 800) * 100),
      fiber: 60,
      calcium: 60,
      phosphorus: 60,
    };
  }, [dailyMeals]);

  const overall =
    Object.values(score).reduce((a, b) => a + b, 0) / 8;

  const dogFace = overall >= 80 ? "😊" : overall >= 60 ? "😐" : "😔";

  const addMeal = (ing) => {
    const p = parseFloat(portion) || 0;
    const ratio = p / 100; // 100g基準
    const m = {
      id: Date.now() + Math.random(),
      name: ing.name,
      portion: p,
      method,
      protein: Number((ing.protein * ratio).toFixed(1)),
      fat: Number((ing.fat * ratio).toFixed(1)),
      carbs: Number((ing.carbs * ratio).toFixed(1)),
      calories: Math.round(ing.calories * ratio),
    };
    setDailyMeals((prev) => [...prev, m]);
    setSearch("");
    setPortion("100");
    setMethod("raw");
  };

  const removeMeal = (id) =>
    setDailyMeals((prev) => prev.filter((m) => m.id !== id));

  const toggleFocus = (id) => {
    const curr = Array.isArray(dog.healthFocus) ? dog.healthFocus : [];
    const next = curr.includes(id)
      ? curr.filter((x) => x !== id)
      : [...curr, id];
    setDog({ ...dog, healthFocus: next });
  };

  /* ---------------- AI ---------------- */
  const runAI = async () => {
    setLoadingAI(true);
    setAiText("");
    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dog, meals: dailyMeals }),
      });
      if (!res.ok) throw new Error("AI API error");
      const data = await res.json();
      setAiText(data.text || "No suggestions.");
    } catch (e) {
      setAiText("AIエラー：しばらくしてから再実行してください。");
    } finally {
      setLoadingAI(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="wrap">
      {/* ヘッダー */}
      <header className="header">
        <div className="brand">NutriPup</div>
        <nav className="tabs">
          <button
            className={`tab ${step === "home" ? "active" : ""}`}
            onClick={() => setStep("home")}
          >
            Home
          </button>
          <button
            className={`tab ${step === "meals" ? "active" : ""}`}
            onClick={() => setStep("meals")}
          >
            Meals
          </button>
          <button
            className={`tab ${step === "summary" ? "active" : ""}`}
            onClick={() => setStep("summary")}
          >
            Summary
          </button>
          <button
            className={`tab ${step === "profile" ? "active" : ""}`}
            onClick={() => setStep("profile")}
          >
            Profile
          </button>
        </nav>
      </header>

      {/* HOME */}
      {step === "home" && (
        <div className="container">
          <div className="card center">
            <div className="face">{dogFace}</div>
            <h1 className="title">
              {dog.name ? `${dog.name}'s Health` : "NutriPup Dashboard"}
            </h1>
            <div className="subtitle">
              Overall Nutrition Score: {Math.round(overall)}%
            </div>
          </div>

          <div className="card">
            <h3 className="sectionTitle">8-Axis Nutrition Radar</h3>
            {/* シンプル表示（SVGレーダーは後でもOK） */}
            <div className="grid2">
              {Object.entries(score).map(([k, v]) => (
                <div key={k} className="pill">
                  <span className="pillLabel">{k}</span>
                  <span className="pillValue">{Math.round(v)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="sectionTitle">Daily Suggestions (AI)</h3>
            <div className="row">
              <button className="btn primary" onClick={runAI} disabled={loadingAI}>
                {loadingAI ? "Analyzing..." : "Get AI Suggestions"}
              </button>
            </div>
            {aiText && <div className="aiBox">{aiText}</div>}
          </div>
        </div>
      )}

      {/* PROFILE */}
      {step === "profile" && (
        <div className="container">
          <div className="card">
            <h2 className="title" style={{ marginTop: 0 }}>
              Dog Profile
            </h2>

            <label className="label">Name</label>
            <input
              className="input"
              type="text"
              value={dog.name}
              onChange={(e) => setDog({ ...dog, name: e.target.value })}
              placeholder="e.g., Momo"
            />

            <div className="row2">
              <div>
                <label className="label">Age (years)</label>
                <input
                  className="input"
                  type="number"
                  value={dog.age}
                  onChange={(e) => setDog({ ...dog, age: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div>
                <label className="label">
                  Weight ({dog.weightUnit})
                </label>
                <input
                  className="input"
                  type="number"
                  value={dog.weight}
                  onChange={(e) => setDog({ ...dog, weight: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>

            <label className="label">Breed</label>
            <input
              className="input"
              type="text"
              value={dog.breed}
              onChange={(e) => setDog({ ...dog, breed: e.target.value })}
              placeholder="Shiba"
            />

            <label className="label">Activity Level</label>
            <div className="chips">
              {["Low", "Moderate", "High"].map((lvl) => (
                <button
                  key={lvl}
                  className={`chip ${dog.activityLevel === lvl ? "chipOn" : ""}`}
                  onClick={() => setDog({ ...dog, activityLevel: lvl })}
                  type="button"
                >
                  {lvl}
                </button>
              ))}
            </div>

            <label className="label">Health Focus (optional)</label>
            <div className="chips">
              {[
                { id: "skin", label: "Skin & Coat" },
                { id: "joints", label: "Joints" },
                { id: "kidneys", label: "Kidneys" },
                { id: "digestion", label: "Digestion" },
                { id: "weight", label: "Weight" },
                { id: "energy", label: "Energy" },
              ].map((o) => (
                <button
                  key={o.id}
                  className={`chip ${
                    (Array.isArray(dog.healthFocus) ? dog.healthFocus : []).includes(o.id)
                      ? "chipOn"
                      : ""
                  }`}
                  onClick={() => toggleFocus(o.id)}
                  type="button"
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="row">
              <button className="btn" onClick={() => setStep("home")}>
                Back
              </button>
              <button className="btn primary" onClick={() => setStep("home")}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEALS */}
      {step === "meals" && (
        <div className="container">
          <div className="card">
            <h2 className="title" style={{ marginTop: 0 }}>
              Today’s Meals {dog.name ? `— ${dog.name}` : ""}
            </h2>

            <label className="label">Search Ingredient</label>
            <input
              className="input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g., Chicken, Salmon"
            />

            {!!filtered.length && (
              <div className="list">
                {filtered.map((ing) => (
                  <button
                    key={ing.name}
                    className="listItem"
                    onClick={() => addMeal(ing)}
                    type="button"
                  >
                    <div className="listTitle">{ing.name}</div>
                    <div className="listSub">
                      {ing.protein}g protein · {ing.calories} cal / 100g
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="row2">
              <div>
                <label className="label">Portion (g)</label>
                <input
                  className="input"
                  type="number"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="label">Method</label>
                <select
                  className="input"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="raw">Raw</option>
                  <option value="boiled">Boiled</option>
                  <option value="steamed">Steamed</option>
                  <option value="baked">Baked</option>
                </select>
              </div>
            </div>
          </div>

          {!!dailyMeals.length && (
            <div className="card">
              <h3 className="sectionTitle">Added</h3>
              {dailyMeals.map((m) => (
                <div key={m.id} className="mealCard">
                  <div>
                    <div className="mealTitle">
                      {m.name} — {m.portion}g · {m.method}
                    </div>
                    <div className="mealSub">
                      P {m.protein}g / F {m.fat}g / C {m.carbs}g · {m.calories} kcal
                    </div>
                  </div>
                  <button className="btn ghost" onClick={() => removeMeal(m.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="row">
            <button className="btn" onClick={() => setStep("home")}>
              Back
            </button>
            <button className="btn primary" onClick={() => setStep("summary")}>
              View Summary
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {step === "summary" && (
        <div className="container">
          <div className="card center">
            <div className="face">{dogFace}</div>
            <h1 className="title">{dog.name || "Summary"}</h1>
            <div className="subtitle">
              Overall Nutrition Score: {Math.round(overall)}%
            </div>
          </div>

          <div className="card">
            <h3 className="sectionTitle">Nutrition Breakdown</h3>
            <div className="grid2">
              {Object.entries(score).map(([k, v]) => (
                <div key={k} className="pill">
                  <span className="pillLabel">{k}</span>
                  <span className="pillValue">{Math.round(v)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="sectionTitle">Daily Suggestions (AI)</h3>
            <div className="row">
              <button className="btn primary" onClick={runAI} disabled={loadingAI}>
                {loadingAI ? "Analyzing..." : "Get AI Suggestions"}
              </button>
            </div>
            {aiText && <div className="aiBox">{aiText}</div>}
          </div>

          <div className="row">
            <button className="btn" onClick={() => setStep("home")}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* ------- Minimal Styles (styled-jsx) ------- */}
      <style jsx global>{`
        :root {
          --bg: #f7f3f0;
          --paper: #ffffff;
          --coffee: #8b7355;
          --taupe: #a0916b;
          --sage: #9db5a1;
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: #2f2a25; }
        .wrap { max-width: 680px; margin: 0 auto; padding: 16px; }

        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0;
        }
        .brand { font-weight: 800; color: var(--coffee); font-size: 18px; }
        .tabs { display: flex; gap: 8px; }
        .tab {
          border: 1px solid transparent; padding: 8px 12px; border-radius: 12px;
          background: #efe9e2; color: var(--coffee); cursor: pointer;
        }
        .tab.active { background: var(--sage); color: white; }

        .container { display: grid; gap: 12px; }
        .card {
          background: var(--paper); border-radius: 18px; padding: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }
        .center { text-align: center; }
        .face { font-size: 48px; margin-bottom: 6px; }
        .title { margin: 6px 0; color: var(--coffee); }
        .subtitle { color: var(--taupe); }

        .sectionTitle { margin: 0 0 12px; color: var(--coffee); }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .pill {
          background: #f1ece6; padding: 10px 12px; border-radius: 12px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .pillLabel { color: var(--coffee); font-weight: 600; }
        .pillValue { color: var(--sage); font-weight: 800; }

        .label { display: block; margin: 10px 0 6px; color: var(--coffee); font-weight: 700; }
        .input {
          width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #e3d9cd;
          font-size: 16px; background: white;
        }
        .row { display: flex; gap: 8px; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        .btn {
          border-radius: 12px; padding: 12px 14px; font-weight: 700; cursor: pointer;
          border: 1px solid transparent; background: #efe9e2; color: var(--coffee);
        }
        .btn.primary { background: var(--sage); color: white; }
        .btn.ghost { background: #f1ece6; }

        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          padding: 8px 12px; border-radius: 999px; border: 1.5px solid #e3d9cd;
          background: white; color: var(--coffee); cursor: pointer; font-weight: 600;
        }
        .chipOn { background: var(--sage); color: white; border-color: var(--sage); }

        .list { border: 1px solid #e3d9cd; border-radius: 12px; overflow: hidden; margin: 8px 0; }
        .listItem {
          width: 100%; text-align: left; border: none; background: white; padding: 10px 12px;
          cursor: pointer;
        }
        .listItem + .listItem { border-top: 1px solid #eee3d6; }
        .listTitle { font-weight: 700; color: var(--coffee); }
        .listSub { color: var(--taupe); font-size: 14px; }

        .mealCard {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; border-radius: 12px; background: #f8f4ef; margin-bottom: 8px;
        }
        .mealTitle { font-weight: 700; color: var(--coffee); }
        .mealSub { color: var(--taupe); font-size: 14px; }

        .aiBox {
          white-space: pre-wrap; padding: 12px; border: 1px solid #e3d9cd;
          border-radius: 12px; background: #fff; margin-top: 8px; color: #2f2a25;
        }

        @media (max-width: 480px) {
          .row2 { grid-template-columns: 1fr; }
          .tabs { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
