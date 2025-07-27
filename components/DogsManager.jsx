// components/DogsManager.jsx
"use client";
import React, { useRef } from "react";
import { fileToDataURL } from "./utils/imageToDataUrl";

export default function DogsManager({
  dogs = [],
  selectedDogId,
  onUse,          // (dogId)=>void
  onAddNew,       // ()=>void
  onEdit,         // (dog)=>void
  onDelete,       // (dogId)=>void
  onUpdatePhoto,  // (dogId, dataUrl)=>void   ← 追加
  onClose,        // ()=>void
}) {
  const fileInputsRef = useRef({});

  const triggerFile = (id) => {
    if (!fileInputsRef.current[id]) return;
    fileInputsRef.current[id].click();
  };

  const handleFile = async (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataURL(file, 256, 0.85);
      onUpdatePhoto && onUpdatePhoto(id, dataUrl);
    } catch (err) {
      alert("画像の読み込みに失敗しました。別のファイルを試してください。");
    } finally {
      e.target.value = ""; // 連続アップロード用にリセット
    }
  };

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
              <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                {/* 左側：アバター＋情報 */}
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: "var(--sand)", overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1px solid rgba(0,0,0,.06)"
                    }}
                    aria-label={`${d.name || "Dog"} avatar`}
                  >
                    {d.photo ? (
                      <img
                        alt="Dog"
                        src={d.photo}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 28 }}>🐕</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {d.name || "(no name)"} {selectedDogId === d.id ? <span className="badge">Selected</span> : null}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--taupe)" }}>
                      {d.breed || "—"} • {d.weight || "?"}{d.weightUnit || "kg"} • {d.activityLevel || "Moderate"}
                    </div>
                  </div>
                </div>

                {/* 右側：操作 */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* 隠しファイル入力 */}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={(el) => { fileInputsRef.current[d.id] = el; }}
                    onChange={(e) => handleFile(d.id, e)}
                  />
                  <button className="btn btn-ghost" onClick={() => triggerFile(d.id)}>Upload Photo</button>

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
