// components/Layout.jsx
"use client";
export default function Layout({ step, setStep, children }) {
  return (
    <div>
      <header className="header">
        <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between', padding:'14px 16px'}}>
          <div className="brand">NutriPup</div>
          <div style={{color:'var(--taupe)', fontWeight:600}}>Premium Care</div>
        </div>
      </header>

      <main className="container" style={{paddingBottom: 0}}>
        {children}
      </main>

      {/* 下部ナビを撤去（今後不要） */}
    </div>
  );
}
