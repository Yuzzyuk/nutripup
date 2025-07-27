// components/DogSwitcher.jsx
"use client";
import React, { useMemo } from "react";

export default function DogSwitcher({ dogs = [], selectedDogId, onSelect, onManage }) {
  const selectedDog = useMemo(
    () => dogs.find(d => d.id === selectedDogId) || null,
    [dogs, selectedDogId]
  );

  return (
    <div className="card" style={{ display: "flex", gap: 12, alignItems: "center", padding: 12 }}>
      {/* Avatar */}
      <div
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--sand)", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(0,0,0,.06)"
        }}
        aria-label="Dog avatar"
      >
        {selectedDog?.photo ? (
          <img
            alt="Dog"
            src={selectedDog.photo}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 18 }}>🐶</span>
        )}
      </div>

      {/* Select */}
      <select
        value={selectedDogId || ""}
        onChange={(e) => onSelect && onSelect(e.target.value)}
        style={{ maxWidth: 280 }}
      >
        {dogs.length === 0 && <option value="">No dogs — add one</option>}
        {dogs.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name || "(no name)"}{d.weight ? ` • ${d.weight}${d.weightUnit || "kg"}` : ""}
          </option>
        ))}
      </select>

      <div style={{ marginLeft: "auto" }}>
        <button className="btn btn-ghost" onClick={onManage}>Manage Dogs</button>
      </div>
    </div>
  );
}
