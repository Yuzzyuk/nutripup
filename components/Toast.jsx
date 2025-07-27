// components/Toast.jsx
"use client";
export default function Toast({ show, message, onClose, duration = 2200 }) {
  if (!show) return null;

  // 自動で閉じる
  if (typeof window !== "undefined") {
    setTimeout(() => onClose && onClose(), duration);
  }

  return (
    <div
      className="fade-in"
      style={{
        position: "fixed",
        left: 0, right: 0, bottom: 20,
        display: "flex", justifyContent: "center", zIndex: 50
      }}
      aria-live="polite"
      role="status"
    >
      <div
        className="card"
        style={{
          background: "rgba(47,43,39,.92)",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: 14,
          boxShadow: "var(--shadow-lg)",
          maxWidth: 420
        }}
      >
        {message || "Saved"}
      </div>
    </div>
  );
}
