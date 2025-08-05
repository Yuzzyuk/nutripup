// components/Layout.jsx
"use client";
export default function Layout({ step, setStep, children }) {
  const tabs = [
    { id: 'profile',     label: 'Profile',     emoji: '🐶' },
    { id: 'meals',       label: 'Meals',       emoji: '🍽️' },
    { id: 'summary',     label: 'Summary',     emoji: '📊' },
    { id: 'suggestions', label: 'Tips',        emoji: '💡' },
    { id: 'history',     label: 'History',     emoji: '🗓️' },
  ];
  return (
    <div>
      <header className="header">
        <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between', padding:'14px 16px'}}>
          <div className="brand">NutriPup</div>
          <div style={{color:'var(--taupe)', fontWeight:600}}>Premium Care</div>
        </div>
      </header>
      {/* ▼ ここだけ変更：paddingBottom を 120 に */}
      <main className="container" style={{paddingBottom: 120, position:'relative', zIndex:1}}>
        {children}
      </main>
      <nav className="footer-nav" style={{ position:'sticky', bottom:0, zIndex: 20 }}>
        <div className="tabbar">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab ${step===t.id ? 'active' : ''}`}
              onClick={() => setStep(t.id)}
              aria-label={t.label}
              type="button"
            >
              <div style={{fontSize:20, marginBottom:4}}>{t.emoji}</div>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
