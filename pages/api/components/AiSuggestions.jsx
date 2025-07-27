// components/AiSuggestions.jsx
"use client";
import React, { useMemo, useState } from "react";

export default function AiSuggestions({ meals = [], dogProfile = {} }) {
  const [ai, setAi] = useState({ loading: false, error: "", data: null });

  // ローカルの簡易 fallback（AI失敗時に表示）
  const totals = useMemo(() => {
    return (Array.isArray(meals) ? meals : []).reduce(
      (a, m) => ({
        protein: a.protein + (Number(m?.protein) || 0),
        fat: a.fat + (Number(m?.fat) || 0),
        carbs: a.carbs + (Number(m?.carbs) || 0),
        calories: a.calories + (Number(m?.calories) || 0),
      }),
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    );
  }, [meals]);

  const fallback = useMemo(() => {
    const s = [];
    if ((totals.protein || 0) < 50) s.push("Protein a bit low — add lean meat.");
    if ((totals.fat || 0) < 15) s.push("Essential fats low — add salmon or fish oil.");
    if ((totals.calories || 0) < 800) s.push("Energy low — increase portion or add carbs.");
    return s.length ? s : ["Looks good today! ✅"];
  }, [totals]);

  const callAI = async () => {
    setAi({ loading: true, error: "", data: null });
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dogProfile, meals }),
      });
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      setAi({ loading: false, error: "", data: json });
    } catch {
      setAi({ loading: false, error: "AI request failed", data: null });
    }
  };

  return (
    <div className="space-y-3">
      <button className="bg-[#9db5a1] text-white px-4 py-2 rounded-xl"
              onClick={callAI} disabled={ai.loading}>
        {ai.loading ? "Thinking..." : "Generate with AI"}
      </button>

      {ai.error && (
        <div className="p-3 bg-[#ffecec] rounded-xl text-[#a33]">
          {ai.error} — showing local tips instead.
        </div>
      )}

      {ai.data ? (
        <div className="space-y-2">
          <div className="text-[#8b7355]">{ai.data.summary || "AI suggestions"}</div>
          {(ai.data.suggestions || []).map((it, i) => (
            <div key={i} className="p-3 bg-[#f7f3f0] rounded-xl">
              <div className="font-semibold text-[#8b7355]">{it.title || "Tip"}</div>
              <div className="text-[#a0916b]">{it.detail || ""}</div>
              {it.amount != null && it.unit && (
                <div className="text-sm text-[#a0916b]">{`${it.amount} ${it.unit}`}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {fallback.map((msg, i) => (
            <div key={i} className="p-3 bg-[#f7f3f0] rounded-xl">{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}
