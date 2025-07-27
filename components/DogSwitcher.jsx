// components/DogSwitcher.jsx
"use client";
import React from "react";

export default function DogSwitcher({ dogs = [], selectedDogId, onSelect, onManage }) {
  return (
    <div className="card" style={{ display: "flex", gap: 8, alignItems: "center", padding: 12 }}>
      <div style={{ fontWeight: 800, color: "var(--taupe)" }}>Dog</div>
      <select
        value={selectedDogId || ""}
        onChange={(e) => onSelect && onSelect(e.target.value)}
        style={{ maxWidth: 260 }}
      >
        {dogs.length === 0 && <option value="">No dogs — add one</option>}
        {dogs.map((d) => (
          <option key={d.id} value={d.id}>{d.name || "(no name)"}{d.weight ? ` • ${d.weight}${d.weightUnit || "kg"}` : ""}</option>
        ))}
      </select>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button className="btn btn-ghost" onClick={onManage}>Manage Dogs</button>
      </div>
    </div>
  );
}
