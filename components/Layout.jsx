// components/Layout.jsx
"use client";
export default function Layout({ step, setStep, children }) {
  const tabs = [
    { id: 'home', label: 'Home', emoji: '🏠' }, // ← Homeだけに
  ];
  return (
    <div>
      <header className="header">
        <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between', padding:'14px 16px'}}>
          <div className="brand">NutriPup</div>
          <div style={{color:'var(--taupe)', fontWeight:600}}>Premium Care</div>
        </div>
      </header>
      <main className="container" style={{paddingBottom: 88}}>
        {children}
      </main>
      <nav className="footer-nav">
        <div className="tabbar">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab ${step===t.id ? 'active' : ''}`}
              onClick={() => setStep(t.id)}
              aria-label={t.label}
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
