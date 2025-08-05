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
import OnboardingWizard from "../components/OnboardingWizard";

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

/* ---------- Normalizers ---------- */
function normalizeDog(d = {}) {
  const hf = Array.isArray(d.healthFocus) ? d.healthFocus : [];

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
    photo: d.photo || "",
    name: d.name ?? "",
    age: d.age ?? "",
    ageYears,
    ageMonths,
    ageLabel,
    breed: d.breed ?? "",
    weight: d.weight ?? "",
    weightUnit: d.weightUnit || "kg",
    activityLevel: d.activityLevel || "Moderate",
    spayNeuter: d.spayNeuter === "intact" ? "intact" : "neutered",
    goal: d.goal || "maintain",
    lifeStage: d.lifeStage || "adult",
    healthFocus: hf,
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
      fiber: Number(m?.fiber) || 0,
      calcium: Number(m?.calcium) || 0,
      phosphorus: Number(m?.phosphorus) || 0,
      omega3: Number(m?.omega3) || 0,
      timeOfDay: (m?.timeOfDay ?? "").toString(),
      date: (m?.date ?? "").toString(),
      timestamp: m?.timestamp || new Date().toISOString(),
    }));
}

/* ---------- Page ---------- */
export default function Home() {
  const [step, setStep] = useState("home"); // home / meals / profile / suggestions / history / dogs
  const [toast, setToast] = useState({ show: false, message: "" });

  const [dogs, setDogs] = useState([]);
  const [selectedDogId, setSelectedDogId] = useState("");
  const selectedDog = useMemo(
    () => dogs.find((d) => d.id === selectedDogId) || null,
    [dogs, selectedDogId]
  );

  const today = useMemo(() => todayKey(), []);
  const [meals, setMeals] = useState([]);
  const [history, setHistory] = useState([]);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      const rawDogs = localStorage.getItem(DOGS_KEY);
      const rawSelected = localStorage.getItem(SELECTED_DOG_KEY);
      let list = rawDogs ? JSON.parse(rawDogs) : [];
      list = Array.isArray(list) ? list.map(normalizeDog) : [];
      setDogs(list);
      const sel = rawSelected || (list[0]?.id || "");
      setSelectedDogId(sel);
      if (!list || list.length === 0) {
        setShowOnboarding(true);
        setStep("home");
      } else {
        setShowOnboarding(false);
        setStep("home");
      }
    } catch {
      setDogs([]);
      setSelectedDogId("");
      setShowOnboarding(true);
      setStep("home");
    }
  }, []);

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

  const addDog = () => {
    setShowOnboarding(true); // 追加もWizardで
  };
  const editDog = (dog) => { setSelectedDogId(dog.id); setStep("profile"); };
  const deleteDog = (dogId) => {
    const confirmed = confirm("本当に削除しますか？（履歴・本日の食事も表示されなくなります）");
    if (!confirmed) return;
    setDogs((prev) => prev.filter((d) => d.id !== dogId));
    if (selectedDogId === dogId) {
      const rest = dogs.filter((d) => d.id !== dogId);
      const next = rest[0]?.id || "";
      setSelectedDogId(next);
      setStep("home");
      if (!next) setShowOnboarding(true);
    }
  };
  const useDog = (dogId) => { setSelectedDogId(dogId); setStep("home"); };

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
    setStep("home");
  };

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
    setStep("home"); // History画面へは遷移しない（Home一画面運用）
  };

  const handleWizardComplete = (form) => {
    const dog = normalizeDog({
      id: genId(),
      photo: form.photo || "",
      name: form.name || "",
      ageYears: form.ageYears ?? "",
      ageMonths: form.ageMonths ?? "",
      breed: form.breed || "",
      weight: form.weight ?? "",
      weightUnit: form.weightUnit || "kg",
      activityLevel: form.activityLevel || "Moderate",
      spayNeuter: form.spayNeuter || "neutered",
      goal: form.goal || "maintain",
      lifeStage: form.lifeStage || "adult",
      healthFocus: Array.isArray(form.healthFocus) ? form.healthFocus : [],
    });

    setDogs((prev) => [...prev, dog]);
    setSelectedDogId(dog.id);
    setShowOnboarding(false);
    setToast({ show: true, message: "Profile created ✅" });
    setStep("home");
  };

  if (showOnboarding) {
    return (
      <>
        <div className="container" style={{ paddingTop: 16, paddingBottom: 24 }}>
          <OnboardingWizard onComplete={handleWizardComplete} />
        </div>
        <Toast
          show={toast.show}
          message={toast.message}
          onClose={() => setToast({ show: false, message: "" })}
        />
      </>
    );
  }

  return (
    <>
      <Layout step={step} setStep={setStep}>
        {/* 上部 Dog 切替のみ表示（Home一画面運用） */}
        {["home","meals"].includes(step) && (
          <DogSwitcher
            dogs={dogs}
            selectedDogId={selectedDogId}
            onSelect={useDog}
            onManage={() => setStep("dogs")}
          />
        )}

        {step === "dogs" && (
          <DogsManager
            dogs={dogs}
            selectedDogId={selectedDogId}
            onUse={useDog}
            onAddNew={addDog}
            onEdit={editDog}
            onDelete={deleteDog}
            onUpdatePhoto={updateDogPhoto}
            onClose={() => setStep("home")}
          />
        )}

        {step === "profile" && selectedDog && (
          <ProfileSetup
            dogProfile={normalizeDog(selectedDog)}
            setDogProfile={(patch) => {
              const base = normalizeDog(selectedDog);
              const next = normalizeDog({ ...base, ...patch });
              setDogs((prev) => prev.map((d) => (d.id === next.id ? next : d)));
            }}
            onContinue={() => saveProfile(selectedDog)}
          />
        )}

        {step === "home" && selectedDog && (
          <HomeDashboard
            dogProfile={normalizeDog(selectedDog)}
            meals={meals}
            history={history}
            onGoMeals={() => setStep("meals")}
            onGoSuggestions={() => {}}
            onGoHistory={() => {}}
          />
        )}

        {step === "meals" && selectedDog && (
          <MealInput
            meals={meals}
            setMeals={(m) => setMeals(sanitizeMeals(m))}
            dogName={selectedDog.name}
            onNext={() => setStep("home")}
            onBack={() => setStep("home")}
          />
        )}

        {/* suggestions/history 画面へは遷移しない運用（残してもOK） */}

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
              <button className="btn btn-primary" onClick={() => setShowOnboarding(true)}>
                Add Dog
              </button>
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
