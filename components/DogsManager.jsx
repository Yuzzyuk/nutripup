// components/DogsManager.jsx
"use client";
import React from "react";

export default function DogsManager({
  dogs = [],
  selectedDogId,
  onUse,       // (dogId)=>void
  onAddNew,    // ()=>void
  onEdit,      // (dog)=>void
  onDelete,    // (dogId)=>void
  onClose,     // ()=>void
}) {
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Dogs</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={onAddNew}>Add Dog</button>
          {onClose && <button className="btn btn-ghost" onClick={onClose}>Close</button>}
        </div>
      </div>

      {dogs.length === 0 ? (
        <div className="card" style={{ padding: 16 }}>
          まだ犬の登録がありません。「Add Dog」からプロフィールを作成してください。
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {dogs.map((d) => (
            <div key={d.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{d.name || "(no name)"} {selectedDogId === d.id ? <span className="badge">Selected</span> : null}</div>
                  <div style={{ fontSize: 13, color: "var(--taupe)" }}>
                    {d.breed || "—"} • {d.weight || "?"}{d.weightUnit || "kg"} • {d.activityLevel || "Moderate"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost" onClick={() => onUse && onUse(d.id)}>Use</button>
                  <button className="btn btn-ghost" onClick={() => onEdit && onEdit(d)}>Edit</button>
                  <button className="btn" style={{ background: "#ffe5e5", color: "#a33" }} onClick={() => onDelete && onDelete(d.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
