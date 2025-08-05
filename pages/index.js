// pages/index.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import ProfileSetup from "../components/ProfileSetup"; // 編集用に残す（モーダル化は任意）
import MealInput from "../components/MealInput";
import HomeDashboard from "../components/HomeDashboard";
import DogsManager from "../components/DogsManager";
import DogSwitcher from "../components/DogSwitcher";
import Toast from "../components/Toast";

/* ---------- Helpers & Storage Keys ---------- */
const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const genId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

function mealsKey(dogId, day) {
  return `np_meals_${dogId}_${day}`;
}
function historyKey(dogId) {
  return `np_history_${dogId}`;
}
const DOGS_KEY = "np_dogs_v1";
const SELECTED_DOG_KEY = "np_selected_dog_id";
const OLD_PROFILE_KEY = "np_profile_v1";

/* ---------- Normalizers (年齢: 年/月, 旧age互換 + 追加属性) ---------- */
function normalizeDog(d = {}) {
  const hf = Array.isArray(d.healthFocus) ? d.healthFocus : [];

  // ageYears/ageMonths が未指定なら旧 age から推定
  let years =
    d.ageYears === "" || d.ageYears == null
      ? ""
      : Number.isFinite(Number(d.ageYears))
      ? Number(d.ageYears)
      : "";
  let monthsRaw =
    d.ageMonths === "" || d.ageMonths == null
      ? ""
      : Number.isFinite(Number(d.ageMonths))
      ? Number(d.ageMonths)
      : "";

  if (years === "" && monthsRaw === "" && (d.age ?? "") !== "") {
    const n = Number(d.age);
    if (!Number.isNaN(n) && n >= 0) {
      years = Math.floor(n);
      const frac = n - years;
      monthsRaw = Math.round(frac * 12);
    }
  }

  const clampInt = (v, min, max) =>
    Number.isFinite(Number(v))
      ? Math.min(max, Math.max(min, Math.round(Number(v))))
      : "";

  const ageYears = years === "" ? "" : clampInt(years, 0, 40);
  const ageMonths = monthsRaw === "" ? "" : clampInt(monthsRaw, 0, 11);

  const ageLabel =
    ageYears === "" && ageMonths === ""
      ? ""
      : `${ageYears || 0}y ${ageMonths || 0}m`;

  return {
    id: d.id || genId(),
    name: d.name ?? "",

    // 旧 age 互換（他画面の安全のため保持）
    age: d.age ?? "",
    ageYears,
    ageMonths,
    ageLabel,

    breed: d.breed ?? "",
    weight: d.weight ?? "",
    weightUnit: d.weightUnit || "kg",
    activityLevel: d.activityLevel || "Moderate",
    healthFocus: hf,
    photo: d.photo || "",

    // 追加属性（将来の計算で利用）
    lifeStage: d.lifeStage || "adult",            // adult / puppy_lt4m / puppy_ge4m
    goal: d.goal || "maintain",                   // maintain / weight_loss / weight_gain
    spayNeuter: d.spayNeuter || "neutered",       // neutered / intact
  };
}

function sanitizeMeals(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(Boolean)
    .map((m) => ({
      id: m?.id || genId(),
      name: (m?.name ?? "").toString(),
      method: (m?.method ?? m?.cookingMethod ?? "raw").toString(),
      portion: Number(m?.portion) || 0,
      protein: Number(m?.protein) || 0,
      fat: Number(m?.fat) || 0,
      carbs: Number(m?.carbs) || 0,
      calories: Number(m?.calories) || 0,
      calcium: Number(m?.calcium) || 0,
      phosphorus: Number(m?.phosphorus) || 0,
      omega3: Number(m?.omega3) || 0,
      timestamp: m?.timestamp || new Date().toISOString(),
    }));
}

/* ---------- Page ---------- */
export default function Home() {
  // Home固定
  const [step] = useState("home");
  const [toast, setToast] = useState({ show: false, message: "" });

  // オーバーレイ表示フラグ
  const [showMealOverlay, setShowMealOverlay] = useState(false);
  const [showDogsOverlay, setShowDogsOverlay] = useState(false);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false); // 任意

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

  /* ---- 初期ロード：dogs/selected を読む。旧データからの移行も ---- */
  useEffect(() => {
    try {
      const rawDogs = localStorage.getItem(DOGS_KEY);
      const rawSelected = localStorage.getItem(SELECTED_DOG_KEY);
      let list = rawDogs ? JSON.parse(rawDogs) : [];

      // 旧単頭データがあれば移行（初回のみ）
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
          localStorage.setItem(DOGS_KEY, JSON.stringify(list));
          localStorage.setItem(SELECTED_DOG_KEY, migrated.id);
        }
      }

      list = Array.isArray(list) ? list.map(normalizeDog) : [];
      setDogs(list);
      setSelectedDogId(rawSelected || (list[0]?.id || ""));
    } catch {
      setDogs([]);
      setSelectedDogId("");
    }
  }, []);

  /* ---- 選択犬が変わったら、その犬の今日の meals と history をロード ---- */
  useEffect(() => {
    if (!selectedDogId) return;
    try {
      const m = localStorage.getItem(mealsKey(selectedDogId, today));
      setMeals(sanitizeMeals(m ? JSON.parse(m) : []));
    } catch {
      setMeals([]);
    }
    try {
      const h = localStorage.getItem(historyKey(selectedDogId));
      const parsed = h ? JSON.parse(h) : [];
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setHistory([]);
    }
    try {
      localStorage.setItem(SELECTED_DOG_KEY, selectedDogId);
    } catch {}
  }, [selectedDogId, today]);

  /* ---- 永続化：meals/history/dogs ---- */
  useEffect(() => {
    if (!selectedDogId) return;
    try {
      localStorage.setItem(mealsKey(selectedDogId, today), JSON.stringify(meals));
    } catch {}
  }, [meals, selectedDogId, today]);

  useEffect(() => {
    if (!selectedDogId) return;
    try {
      localStorage.setItem(historyKey(selectedDogId), JSON.stringify(history));
    } catch {}
  }, [history, selectedDogId]);

  useEffect(() => {
    try {
      const safeDogs = Array.isArray(dogs) ? dogs.map(normalizeDog) : [];
      localStorage.setItem(DOGS_KEY, JSON.stringify(safeDogs));
    } catch {}
  }, [dogs]);

  /* ---- 犬の操作 ---- */
  const useDog = (dogId) => { setSelectedDogId(dogId); };

  const updateDogPhoto = (id, dataUrl) => {
    setDogs((prev) => prev.map((d) => (d.id === id ? { ...d, photo: dataUrl } : d)));
    setToast({ show: true, message: "Photo updated ✅" });
  };

  const saveProfile = (updated) => {
    const safe = normalizeDog(updated || {});
    setDogs((prev) => {
      const exists = prev.some((d) => d.id === safe.id);
      return exists
        ? prev.map((d) => (d.id === safe.id ? { ...d, ...safe } : d))
        : [...prev, safe];
    });
    setSelectedDogId(safe.id);
    setToast({ show: true, message: "Profile saved ✅" });
    setShowProfileOverlay(false);
  };

  const saveToday = () => {
    if (!selectedDog) return;
    if (!meals || meals.length === 0) return;
    const nowIso = new Date().toISOString();
    const entry = { date: nowIso, meals: meals, score: 0 };
    setHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex(
        (e) => new Date(e.date).toDateString() === new Date(nowIso).toDateString()
      );
      if (idx >= 0) next[idx] = entry;
      else next.push(entry);
      return next;
    });
    setMeals([]);
    setToast({ show: true, message: "Saved today’s meals to History ✅" });
  };

  /* ---- 画面（Homeのみ） ---- */
  return (
    <>
      <Layout step="home" setStep={() => {}} hideNav>
        {/* 上部：Dog切替と「Manage Dogs」ボタン */}
        {selectedDogId && (
          <DogSwitcher
            dogs={dogs}
            selectedDogId={selectedDogId}
            onSelect={useDog}
            onManage={() => setShowDogsOverlay(true)}
          />
        )}

        {/* Homeダッシュボード（AI・8角形は内部で維持） */}
        {selectedDog && (
          <HomeDashboard
            dogProfile={normalizeDog(selectedDog)}
            meals={meals}
            history={history}
            onAddMeals={() => setShowMealOverlay(true)}
          />
        )}

        {/* 犬未選択の空状態 */}
        {!selectedDog && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 800 }}>No dog selected</div>
            <div style={{ marginBottom: 12, color: "var(--taupe)" }}>
              まず犬を追加して選択してください（Manage Dogs から追加）。
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={() => setShowDogsOverlay(true)}>
                Manage Dogs
              </button>
            </div>
          </div>
        )}
      </Layout>

      {/* === Overlays === */}
      {/* MealInput オーバーレイ */}
      {showMealOverlay && selectedDog && (
        <div style={overlayWrapStyle} role="dialog" aria-modal="true">
          <div className="card" style={overlayCardStyle}>
            <MealInput
              meals={meals}
              setMeals={(m) => setMeals(sanitizeMeals(m))}
              dogName={selectedDog.name}
              onNext={() => setShowMealOverlay(false)}
              onBack={() => setShowMealOverlay(false)}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => setShowMealOverlay(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { saveToday(); setShowMealOverlay(false); }}>Save Today</button>
            </div>
          </div>
        </div>
      )}

      {/* DogsManager オーバーレイ */}
      {showDogsOverlay && (
        <div style={overlayWrapStyle} role="dialog" aria-modal="true">
          <div className="card" style={overlayCardStyle}>
            <DogsManager
              dogs={dogs}
              selectedDogId={selectedDogId}
              onUse={(id) => { setSelectedDogId(id); setShowDogsOverlay(false); }}
              onAddNew={() => {
                const blank = normalizeDog({
                  id: genId(),
                  name: "", age: "", ageYears: "", ageMonths: "",
                  breed: "", weight: "", weightUnit: "kg",
                  activityLevel: "Moderate", healthFocus: [], photo: "",
                  lifeStage: "adult", goal: "maintain", spayNeuter: "neutered",
                });
                setDogs((prev) => [...prev, blank]);
              }}
              onEdit={() => setShowProfileOverlay(true)}
              onDelete={(dogId) => {
                const ok = confirm("本当に削除しますか？");
                if (!ok) return;
                setDogs((prev) => prev.filter((d) => d.id !== dogId));
                if (selectedDogId === dogId) {
                  const rest = dogs.filter((d) => d.id !== dogId);
                  const next = rest[0]?.id || "";
                  setSelectedDogId(next);
                }
              }}
              onUpdatePhoto={updateDogPhoto}
              onClose={() => setShowDogsOverlay(false)}
            />
          </div>
        </div>
      )}

      {/* ProfileSetup オーバーレイ（必要時のみ） */}
      {showProfileOverlay && selectedDog && (
        <div style={overlayWrapStyle} role="dialog" aria-modal="true">
          <div className="card" style={overlayCardStyle}>
            <ProfileSetup
              dogProfile={normalizeDog(selectedDog)}
              setDogProfile={(patch) => {
                const next = normalizeDog({ ...selectedDog, ...patch });
                setDogs((prev) => prev.map((d) => (d.id === next.id ? next : d)));
              }}
              onContinue={() => { saveProfile(selectedDog); setShowProfileOverlay(false); }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => setShowProfileOverlay(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { saveProfile(selectedDog); setShowProfileOverlay(false); }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: "" })}
      />
    </>
  );
}

/* ---- Overlay styles ---- */
const overlayWrapStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.28)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60
};
const overlayCardStyle = { width: "min(720px, 92vw)", maxHeight: "90vh", overflow: "auto" };
