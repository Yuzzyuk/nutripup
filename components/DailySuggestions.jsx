// components/DailySuggestions.jsx
"use client";
import React, { useMemo, useState } from "react";

function sumMeals(meals = []) {
  const arr = Array.isArray(meals) ? meals : [];
  return arr.reduce(
    (a, m) => ({
      protein: a.protein + (Number(m?.protein) || 0),
      fat: a.fat + (Number(m?.fat) || 0),
      carbs: a.carbs + (Number(m?.carbs) || 0),
      calories: a.calories + (Number(m?.calories) || 0),
    }),
    { protein: 0, fat: 0, carbs: 0, calories: 0 }
  );
}

const stripFences = (s = "") =>
  s.replace(/```json/gi, "").replace(/```/g, "").trim();

export default function DailySuggestions({ meals = [], dogProfile = {}, onBack }) {
  const [ai, setAi] = useState({ loading: false, error: "", data: null });

  const totals = useMemo(() => sumMeals(meals), [meals]);
  const healthFocus = Array.isArray(dogProfile?.healthFocus) ? dogProfile.healthFocus : [];
  const name = dogProfile?.name || "Your dog";

  const fallback = useMemo(() => {
    const s = [];
    if ((totals.protein || 0) < 50) s.push("Protein is a bit low — add 50–100 g lean meat (e.g., chicken breast).");
    if ((totals.fat || 0) < 15) s.push("Essential fats slightly low — include salmon/sardine or 1–2 tsp fish oil.");
    if ((totals.calories || 0) < 800) s.push("Energy may be low — add ~100–200 kcal (sweet potato/rice/cottage cheese).");
    if (healthFocus.includes("skin")) s.push("Skin & coat: favor omega-3 (sardine/salmon) + vitamin E sources.");
    if (healthFocus.includes("joints")) s.push("Joints: consider gelatin/collagen or green-lipped mussel.");
    return s.length ? s : ["Looks balanced today — nice work! ✅"];
  }, [totals, healthFocus]);

  const callAI = async () => {
    setAi({ loading: true, error: "", data: null });
    try {
      const r = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dogProfile, meals }),
      });
      if (!r.ok) throw new Error("AI request failed");
      const json = await r.json();

      // サニタイズ（万一）
      if (typeof json.summary === "string") json.summary = stripFences(json.summary);
      if (Array.isArray(json.suggestions)) {
        json.suggestions = json.suggestions.map((it) => ({
          title: stripFences(it?.title || "Tip"),
          detail: stripFences(it?.detail || ""),
          amount: typeof it?.amount === "number" ? it.amount : null,
          unit: it?.unit ?? null,
        }));
      }

      setAi({ loading: false, error: "", data: json });
    } catch (e) {
      setAi({ loading: false, error: "AIの提案を取得できませんでした。時間をおいて再度お試しください。", data: null });
    }
  };

  const data = ai.data;

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>AI Nutritionist</h2>
      <div style={{ color: "var(--taupe)", marginTop: -6, marginBottom: 12 }}>
        Ask AI for personalized tips — grounded in veterinary nutrition.
      </div>

      <div className="kpi" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 800 }}>{name}</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, fontSize: 14, color: "var(--taupe)" }}>
          <span>Protein {Math.round(totals.protein)}g</span>
          <span>Fat {Math.round(totals.fat)}g</span>
          <span>Kcal {Math.round(totals.calories)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={callAI} disabled={ai.loading}>
          {ai.loading ? "Analyzing..." : "Ask AI for personalized tips"}
        </button>
        {onBack && <button className="btn btn-ghost" onClick={onBack}>Back</button>}
      </div>

      {ai.error && (
        <div className="card" style={{ background: "#fff6f6", color: "#a33", marginTop: 10 }}>
          {ai.error} — showing local tips below.
        </div>
      )}

      {data ? (
        <div className="card" style={{ marginTop: 12, background: "var(--cloud)" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            {data.summary || "Personalized suggestions"}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {(data.suggestions || []).map((it, i) => (
              <div key={i} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, color: "var(--taupe)" }}>
                  {it.title || "Tip"}
                  {typeof it.amount === "number" && it.unit ? (
                    <span style={{ marginLeft: 6, fontWeight: 800 }}>
                      · {it.amount} {it.unit}
                    </span>
                  ) : null}
                </div>
                <div style={{ marginTop: 4 }}>{it.detail || ""}</div>
              </div>
            ))}
          </div>

          {(Array.isArray(data.references) && data.references.length > 0) && (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Evidence & Guidance</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {data.references.map((r, idx) => (
                  <li key={idx}>
                    <a href={r.url} target="_blank" rel="noreferrer">{r.title || r.url}</a>
                  </li>
                ))}
              </ul>
              <div style={{ fontSize: 12, color: "var(--taupe)", marginTop: 6 }}>
                Educational use only. For medical conditions, consult your veterinarian.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 12, background: "var(--cloud)" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Local quick tips</div>
          <div style={{ display: "grid", gap: 8 }}>
            {fallback.map((msg, i) => (
              <div key={i} className="card" style={{ padding: 12 }}>{msg}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
