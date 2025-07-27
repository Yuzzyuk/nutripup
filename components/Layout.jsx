// components/Layout.jsx
"use client";
import React from "react";

export default function Layout({ step, setStep, children }) {
  const tabs = [
    { id: "profile",     label: "Profile",     emoji: "🐶" },
    { id: "meals",       label: "Meals",       emoji: "🍽️" },
    { id: "summary",     label: "Summary",     emoji: "📊" },
    { id: "suggestions", label: "Tips",        emoji: "💡" },
    { id: "history",     label: "History",     emoji: "🗓️" },
  ];

  return (
    <div>
      {/* ヘッダー */}
      <header
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 0",
        }}
      >
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--coffee)",
          }}
        >
          NutriPup
        </div>
        <div style={{ color: "var(--taupe)", fontWeight: 600 }}>
          Premium Care
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container" style={{ paddingBottom: "4rem" }}>
        {children}
      </main>

      {/* フッターナビ */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--paper)",
          borderTop: "1px solid #eee",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-around",
            padding: "0.5rem 0",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab ${step === t.id ? "active" : ""}`}
              onClick={() => setStep(t.id)}
              aria-label={t.label}
            >
              <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
                {t.emoji}
              </div>
              <div style={{ fontSize: "0.875rem" }}>{t.label}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
