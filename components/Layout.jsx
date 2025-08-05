// components/Layout.jsx
"use client";
export default function Layout({ step, setStep, children, hideNav = false }) {
  return (
    <div>
      <header className="header">
        <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between', padding:'14px 16px'}}>
          <div className="brand">NutriPup</div>
          <div style={{color:'var(--taupe)', fontWeight:600}}>Premium Care</div>
        </div>
      </header>
      <main className="container" style={{paddingBottom: hideNav ? 16 : 88}}>
        {children}
      </main>
      {!hideNav && (
        <nav className="footer-nav">
          <div className="tabbar">
            {/* 使わないので空。今後必要ならここにタブを戻す */}
          </div>
        </nav>
      )}
    </div>
  );
}
