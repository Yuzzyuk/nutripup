// components/MealInput.jsx
"use client";
import React, { useMemo, useState } from "react";
import { INGREDIENTS } from "./data/ingredients";
import { SUPPLEMENTS } from "./data/supplements";

function fmtDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MealInput({
  meals,
  setMeals,
  dogName = "",
  selectedDay,        // ← 追加：親から受け取る（YYYY-MM-DD）
  setSelectedDay,     // ← 追加：親に日付変更を通知
  onNext,
  onBack,
}) {
  // タブ：Foods / Supplements
  const [tab, setTab] = useState("foods"); // "foods" | "supps"

  // 検索と選択
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // 分量・方法・朝/夜
  const [portion, setPortion] = useState(100); // g
  const [method, setMethod] = useState("Raw"); // 食品用
  const [timeOfDay, setTimeOfDay] = useState("AM"); // AM/PM

  // 日付
  const [dateStr, setDateStr] = useState(selectedDay || fmtDate(new Date()));

  // データソース
  const source = tab === "foods" ? INGREDIENTS : SUPPLEMENTS;

  const filtered = useMemo(() => {
    const base = source || [];
    if (!search) return base.slice(0, 12);
    return base.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [source, search]);

  // 追加
  const addMeal = () => {
    if (!selected || !portion) return;

    const scale = Number(portion) / 100;
    // 未定義は0で安全に
    const protein    = +( (selected.protein    || 0) * scale ).toFixed(2);
    const fat        = +( (selected.fat        || 0) * scale ).toFixed(2);
    const carbs      = +( (selected.carbs      || 0) * scale ).toFixed(2);
    const calories   = Math.round( (selected.calories || 0) * scale );
    const fiber      = +( (selected.fiber      || 0) * scale ).toFixed(2);
    const calcium    = +( (selected.calcium    || 0) * scale ).toFixed(3); // g
    const phosphorus = +( (selected.phosphorus || 0) * scale ).toFixed(3); // g
    const omega3     = +( (selected.omega3     || 0) * scale ).toFixed(3); // g

    const entry = {
      id: Date.now(),
      name: selected.name,
      portion: Number(portion),
      method: tab === "supps" ? "Supplement" : method,
      timeOfDay,                // ← 追加
      date: dateStr,            // ← 追加（YYYY-MM-DD）
      isSupplement: tab === "supps",
      protein, fat, carbs, calories, fiber, calcium, phosphorus, omega3,
      timestamp: new Date(`${dateStr}T12:00:00`).toISOString(), // 週次集計のため日付固定
    };

    setMeals([...(meals || []), entry]);

    // リセット
    setSelected(null);
    setPortion(100);
    setMethod("Raw");
    setTimeOfDay("AM");
    setSearch("");
  };

  // 表示用：今日/昨日ショートカット
  const setToday = () => {
    const t = fmtDate(new Date());
    setDateStr(t);
    setSelectedDay && setSelectedDay(t);
  };
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = fmtDate(d);
    setDateStr(y);
    setSelectedDay && setSelectedDay(y);
  };

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>
        {dogName ? `${dogName}’s Meals` : "Today’s Meals"} 🍽️
      </h2>

      {/* 日付＋朝/夜 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Date
          </label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => {
              setDateStr(e.target.value);
              setSelectedDay && setSelectedDay(e.target.value);
            }}
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button className="btn btn-ghost" onClick={setToday}>Today</button>
            <button className="btn btn-ghost" onClick={setYesterday}>Yesterday</button>
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)", marginBottom: 6 }}>
            Time
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {["AM","PM"].map(t => (
              <button
                key={t}
                className={`btn ${timeOfDay === t ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setTimeOfDay(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* タブ：Foods / Supplements */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button
          className={`btn ${tab === "foods" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("foods")}
        >
          Foods
        </button>
        <button
          className={`btn ${tab === "supps" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("supps")}
        >
          Supplements
        </button>
      </div>

      {/* 検索 */}
      <div style={{ display: "grid", gap: 8 }}>
        <input
          type="text"
          value={search}
          placeholder={tab === "foods" ? "Search food…" : "Search supplement…"}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5ddd2" }}
        />

        {/* 候補リスト */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {filtered.map((i) => (
            <button
              key={i.name}
              className="btn btn-ghost"
              onClick={() => {
                setSelected(i);
                if (tab === "supps") setMethod("Supplement");
              }}
              style={{ justifyContent: "flex-start" }}
            >
              <div style={{ fontWeight: 700, marginRight: 6 }}>{i.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {i.protein ?? 0}g P ・ {i.calories ?? 0} kcal /100g
              </div>
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
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                {[25, 50, 100].map(g => (
                  <button key={g} className="btn btn-ghost" onClick={() => setPortion(g)}>
                    {g} g
                  </button>
                ))}
              </div>
            </div>

            {/* 調理法（食品のみ） */}
            {tab === "foods" ? (
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
            ) : (
              <div>
                <label style={{ display: "block", fontWeight: 700, color: "var(--taupe)" }}>
                  Type
                </label>
                <div className="badge">Supplement</div>
              </div>
            )}
          </div>

          {/* 追加アクション */}
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
            Meals on {dateStr}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {meals.map(m => (
              <div key={m.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      [{m.timeOfDay || "AM"}] {m.name} — {m.portion}g
                      {m.method ? ` · ${m.method}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--taupe)" }}>
                      {m.date || dateStr} ・ {m.calories} kcal
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {m.protein}g P / {m.fat}g F / {m.carbs}g C
                      { (m.calcium || 0) > 0 ? ` · Ca ${m.calcium}g` : "" }
                      { (m.phosphorus || 0) > 0 ? ` · P ${m.phosphorus}g` : "" }
                      { (m.omega3 || 0) > 0 ? ` · Ω3 ${m.omega3}g` : "" }
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => setMeals((meals || []).filter(x => x.id !== m.id))}>
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
