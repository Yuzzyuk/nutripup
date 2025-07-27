// pages/index.js
"use client";
import { useState } from 'react';
import Layout from '../components/Layout';

export default function Home() {
  const [step, setStep] = useState('profile');

  return (
    <Layout step={step} setStep={setStep}>
      {step === 'profile' && (
        <section className="card">
          <h1 style={{color:'var(--taupe)', marginTop:0}}>Let’s set up your dog 🐕</h1>
          <p>次のステップで、年齢・体重・品種・活動量を入れられるフォームを追加します。</p>
          <button className="btn btn-primary" onClick={() => setStep('meals')}>Continue</button>
        </section>
      )}

      {step === 'meals' && (
        <section className="card">
          <h2 style={{marginTop:0}}>Add today’s meal 🍽️</h2>
          <p>ここに食材検索＆分量入力UIを作成します（次のSTEPで追加）。</p>
          <button className="btn btn-ghost" onClick={() => setStep('summary')}>Go to Summary</button>
        </section>
      )}

      {step === 'summary' && (
        <section className="card">
          <h2 style={{marginTop:0}}>Nutrition Summary 📊</h2>
          <p>レーダーチャートをこのセクションに配置します（recharts使用）。</p>
          <button className="btn btn-ghost" onClick={() => setStep('suggestions')}>See Tips</button>
        </section>
      )}

      {step === 'suggestions' && (
        <section className="card">
          <h2 style={{marginTop:0}}>Daily Suggestions 💡</h2>
          <ul>
            <li>Omega-3 を少し強化：明日はサーモン 5g を追加</li>
            <li>カルシウム 1g を卵殻パウダーで補完</li>
          </ul>
          <button className="btn btn-ghost" onClick={() => setStep('history')}>View History</button>
        </section>
      )}

      {step === 'history' && (
        <section className="card">
          <h2 style={{marginTop:0}}>History 🗓️</h2>
          <p>後でスコア推移のチャートを追加します。</p>
          <button className="btn btn-ghost" onClick={() => setStep('profile')}>Back to Profile</button>
        </section>
      )}
    </Layout>
  );
}
