"use client";
import React, { useState } from "react";

export default function AiSuggestions({ meals, dogProfile }) {
  const [model, setModel] = useState("gpt-4o-mini");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [promptText, setPromptText] = useState(
`You are a canine nutrition assistant for affluent owners who cook at home.
Use AAFCO-style completeness as a reference. Be warm, concise, and specific.
If nutrients are excessive, tell exactly how many grams to reduce.
Return 3 bullet suggestions max.

Output in the user's language.`
  );

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals, dogProfile, model, promptText }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Request failed");
      }
      const data = await res.json();
      setResult(data.text || "");
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* モデルとプロンプト編集 */}
      <div className="grid grid-cols-1 gap-3">
        <label className="text-sm text-[#8b7355] font-medium">
          Model
          <select
            className="mt-1 w-full p-3 rounded-xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gpt-4o-mini">gpt-4o-mini (fast, low-cost)</option>
            <option value="gpt-4.1-mini">gpt-4.1-mini (higher quality)</option>
          </select>
        </label>

        <label className="text-sm text-[#8b7355] font-medium">
          Optional instruction to AI
          <textarea
            rows={4}
            className="mt-1 w-full p-3 rounded-xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />
        </label>
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        className="w-full bg-[#9db5a1] text-white font-semibold py-3 rounded-xl hover:bg-[#8ba394] transition-colors disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate with AI"}
      </button>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {result && (
        <div className="p-4 rounded-2xl bg-[#f7f3f0] text-[#8b7355] whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}
