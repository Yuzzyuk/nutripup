// pages/index.js
"use client";
import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import ProfileSetup from "../components/ProfileSetup";
import MealInput from "../components/MealInput";
import DailySuggestions from "../components/DailySuggestions";
import HomeDashboard from "../components/HomeDashboard";
import DogsManager from "../components/DogsManager";
import DogSwitcher from "../components/DogSwitcher";
import Toast from "../components/Toast";
import AiSuggestions from "../components/AiSuggestions"; // ← ボタンだけのAIパネル版を使う

/* ---------- Helpers & Storage Keys ---------- */
const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
function mealsKey(dogId, day) { return `np_meals_${dogId}_${day}`; }
function historyKey(dogId) { return `np_history_${dogId}`; }
const DOGS_KEY = "np_dogs_v1";
const SELECTED_DOG_KEY = "np_selected_dog_id";
const OLD_PROFILE_KEY = "np_profile_v1";

/* ---------- Normalizers ---------- */
function normalizeDog(d = {}) {
  const hf = Array.isArray(d.healthFocus) ? d.healthFocus : [];
  return {
    id: d.id || genId(),
    name: d.name ?? "",
    age: d.age ?? "",
    breed: d.breed ?? "",
    weight: d.weight ?? "",
    weightUnit: d.weightUnit || "kg",
    activityLevel: d.activityLevel || "Moderate",
    healthFocus: hf,
    photo: d.photo || "",
  };
}
function sanitizeMeals(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean).map((m) => ({
    id: m?.id || genId(),
    name: (m?.name ?? "").toString(),
    method: (m?.method ?? m?.cookingMethod ?? "raw").toString(),
    portion: Number(m?.portion) || 0,
    protein: Number(m?.protein) || 0,
    fat: Number(m?.fat) || 0,
    carbs: Number(m?.carbs) || 0,
    calories: Number(m?.calories) || 0,
    timestamp: m?.timestamp || new Date().toISOString(),
  }));
}

/* ---------- Page ---------- */
export default function Home() {
  const [step, setStep] = useState("home");
  const [toast, setToast] = useState({ show: false, message: "" });

  // 多頭
  const [dogs, setDogs] = useState([]);
  const [selectedDogId, setSelectedDogId] = useState("");
  const selectedDog = useMemo(
    () => dogs.find((d) => d.id === selectedDogId) || null,
    [dogs, selectedDogId]
  );

  // 今日の食事 & 履歴（選択犬ごと）
  const today = useMemo(() => todayKey(), []);
  const [meals, setMeals] = useState([]);
  const [history, setHistory] = useState([]);

  // 初期ロード
  useEffect(() => {
    try {
      const rawDogs = localStorage.getItem(DOGS_KEY);
      const rawSelected = localStorage.getItem(SELECTED_DOG_KEY);
      let list = rawDogs ? JSON.parse(rawDogs) : [];

      // 旧単頭データ移行
      if (!list || list.length === 0) {
        const old = localStorage.getItem(OLD_PROFILE_KEY);
        if (old) {
          const p = JSON.parse(old);
          const migrated = normalizeDog({
            name: p.name || "My Dog",
            age: p.age || "",
            breed: p.breed || "",
            weight: p.weight || "",
            weightUnit: p.weightUnit || "kg",
            activityLevel: p.activityLevel || "Moderate",
            healthFocus: p.healthFocus || [],
            photo: p.photo || "",
          });
          list = [migrated];
        }
      }

      // ★ ここで空なら新規1頭を必ず作る（入力できない問題の根治）
      if (!list || list.length === 0) {
        const blank = normalizeDog({
          id: genId(),
          name: "",
          age: "",
          breed: "",
          weight: "",
          weightUnit: "kg",
          activityLevel: "Moderate",
          healthFocus: [],
          photo: "",
        });
        list = [blank];
      }

      list = Array.isArray(list) ? list.map(normalizeDog) : [];
      const initialSelected = rawSelected && list.some(d => d.id === rawSelected)
        ? rawSelected
        : list[0]?.id || "";

      setDogs(list);
      setSelectedDogId(initialSelected);
      setStep(list.length > 0 ? "home" : "profile");

      // 永続化（作成／移行した場合）
      localStorage.setItem(DOGS_KEY, JSON.stringify(list));
      if (initialSelected) localStorage.setItem(SELECTED_DOG_KEY, initialSelected);
    } catch {
      // 失敗時も最低1頭は用意
      const blank = normalizeDog({ id: genId() });
      setDogs([blank]);
      setSelectedDogId(blank.id);
      setStep("profile");
      try {
        localStorage.setItem(DOGS_KEY, JSON.stringify([blank]));
        localStorage.setItem(SELECTED_DOG_KEY, blank.id);
      } catch {}
    }
  }, []);

  // 選択犬が変わったらロード
  useEffect(() => {
    if (!selectedDogId) return;
    try {
      const m = localStorage.getItem(mealsKey(selectedDogId, today));
      setMeals(sanitizeMeals(m ? JSON.parse(m) : []));
    } catch { setMeals([]); }
    try {
      const h = localStorage.getItem(historyKey(selectedDogId));
      const parsed = h ? JSON.parse(h) : [];
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch { setHistory([]); }
    try { localStorage.setItem(SELECTED_DOG_KEY, selectedDogId); } catch {}
  }, [selectedDogId, today]);

  // 永続化
  useEffect(() => {
    if (!selectedDogId) return;
    try { localStorage.setItem(mealsKey(selectedDogId, today), JSON.stringify(meals)); } catch {}
  }, [meals, selectedDogId, today]);

  useEffect(() => {
    if (!selectedDogId) return;
    try { localStorage.setItem(historyKey(selectedDogId), JSON.stringify(history)); } catch {}
  }, [history, selectedDogId]);

  useEffect(() => {
    try {
      const safeDogs = Array.isArray(dogs) ? dogs.map(normalizeDog) : [];
      localStorage.setItem(DOGS_KEY, JSON.stringify(safeDogs));
    } catch {}
  }, [dogs]);

  /* ---- 犬の CRUD ---- */
  const addDog = () => {
    const blank = normalizeDog({
      id: genId(), name: "", age: "", breed: "", weight: "",
      weightUnit: "kg", activityLevel: "Moderate", healthFocus: [], photo: "",
    });
    setDogs((prev) => [...prev, blank]);
    setSelectedDogId(blank.id);
    setStep("profile");
  };

  const editDog = (dog) => { setSelectedDogId(dog.id); setStep("profile"); };

  const deleteDog = (dogId) => {
    const ok = confirm("本当に削除しますか？");
    if (!ok) return;
    setDogs((prev) => prev.filter((d) => d.id !== dogId));
    if (selectedDogId === dogId) {
      const rest = dogs.filter((d) => d.id !== dogId);
      const next = rest[0]?.id || "";
      setSelectedDogId(next);
      setStep(next ? "home" : "profile");
    }
  };

  const useDog = (dogId) => { setSelectedDogId(dogId); setStep("home"); };

  // 写真更新（DogsManager から）
  const updateDogPhoto = (id, dataUrl) => {
    setDogs((prev) => prev.map((d) => (d.id === id ? { ...d, photo: dataUrl } : d)));
    setToast({ show: true, message: "Photo updated ✅" });
  };

  // プロフィール保存
  const saveProfile = (updated) => {
    if (!updated) return;
    const safe = normalizeDog(updated);
    setDogs((prev) => {
      const exists = prev.some((d) => d.id === safe.id);
      return exists ? prev.map((d) => (d.id === safe.id ? { ...d, ...safe } : d)) : [...prev, safe];
    });
    setSelectedDogId(safe.id);
    setToast({ show: true, message: "Profile saved ✅" });
    setStep("home");
  };

  // 今日を履歴へ保存
  const saveToday = () => {
    if (!selectedDog || !meals.length) return;
    const nowIso = new Date().toISOString();
    const entry = { date: nowIso, meals: meals, score: 0 };
    setHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex(
        (e) => new Date(e.date).toDateString() === new Date(nowIso).toDateString()
      );
      if (idx >= 0) next[idx] = entry; else next.push(entry);
      return next;
    });
    setMeals([]);
    setToast({ show: true, message: "Saved today’s meals to History ✅" });
    setStep("history");
  };

  /* ---- 画面切替 ---- */
  return (
    <>
      <Layout step={step} setStep={setStep}>
        {["home", "meals", "suggestions", "history"].includes(step) && (
          <DogSwitcher
            dogs={dogs}
            selectedDogId={selectedDogId}
            onSelect={useDog}
            onManage={() => setStep("dogs")}
          />
        )}

        {/* 犬の管理 */}
        {step === "dogs" && (
          <DogsManager
            dogs={dogs}
            selectedDogId={selectedDogId}
            onUse={useDog}
            onAddNew={addDog}
            onEdit={editDog}
            onDelete={deleteDog}
            onUpdatePhoto={updateDogPhoto}
            onClose={() => setStep(selectedDog ? "home" : "profile")}
          />
        )}

        {/* プロフィール（追加/編集） */}
        {step === "profile" && (
          <ProfileSetup
            dogProfile={normalizeDog(selectedDog || { id: selectedDogId || genId() })}
            setDogProfile={(patch) => {
              // ★ 挿入 or 更新（これで名前入力が即時反映）
              const base = normalizeDog(selectedDog || { id: selectedDogId || genId() });
              const next = normalizeDog({ ...base, ...patch });
              setDogs((prev) => {
                const exists = prev.some((d) => d.id === next.id);
                return exists ? prev.map((d) => (d.id === next.id ? next : d)) : [...prev, next];
              });
              setSelectedDogId(next.id);
            }}
            onContinue={() => {
              const latest = dogs.find((d) => d.id === selectedDogId) || selectedDog;
              saveProfile(latest || normalizeDog({ id: selectedDogId || genId() }));
            }}
          />
        )}

        {/* ホーム */}
        {step === "home" && selectedDog && (
          <HomeDashboard
            dogProfile={normalizeDog(selectedDog)}
            meals={meals}
            history={history}
            onGoMeals={() => setStep("meals")}
            onGoSuggestions={() => setStep("suggestions")}
            onGoHistory={() => setStep("history")}
          />
        )}

        {/* 食事入力 */}
        {step === "meals" && selectedDog && (
          <MealInput
            meals={meals}
            setMeals={(m) => setMeals(sanitizeMeals(m))}
            dogName={selectedDog.name}
            onNext={() => setStep("home")}
            onBack={() => setStep("home")}
          />
        )}

        {/* 提案（ローカル + AI） */}
        {step === "suggestions" && selectedDog && (
          <>
            <DailySuggestions
              meals={meals}
              dogProfile={normalizeDog(selectedDog)}
              onBack={() => setStep("home")}
            />
            <div style={{ marginTop: 12 }}>
              <AiSuggestions meals={meals} dogProfile={normalizeDog(selectedDog)} />
            </div>
          </>
        )}

        {/* 履歴 */}
        {step === "history" && selectedDog && (
          <div className="card">
            <h2 style={{ marginTop: 0 }}>History — {selectedDog.name || "Dog"}</h2>
            <div style={{ color: "var(--taupe)", marginBottom: 8 }}>
              最近のスコア推移と日別ログ
            </div>

            <div style={{ marginBottom: 12 }}>
              <HomeDashboard
                dogProfile={normalizeDog(selectedDog)}
                meals={meals}
                history={history}
                onGoMeals={() => setStep("meals")}
                onGoSuggestions={() => setStep("suggestions")}
                onGoHistory={() => {}}
              />
            </div>

            <div className="card" style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setStep("home")}>
                Back to Home
              </button>
              <button className="btn btn-primary" onClick={saveToday} style={{ flex: 1 }}>
                Save Today
              </button>
            </div>
          </div>
        )}

        {/* 空状態（安全網） */}
        {!selectedDog && step !== "profile" && step !== "dogs" && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 800 }}>No dog selected</div>
            <div style={{ marginBottom: 12, color: "var(--taupe)" }}>
              まず犬を追加して選択してください。
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setStep("dogs")}>
                Manage Dogs
              </button>
              <button className="btn btn-primary" onClick={addDog}>Add Dog</button>
            </div>
          </div>
        )}
      </Layout>

      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: "" })}
      />
    </>
  );
}
