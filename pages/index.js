// pages/index.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Onboarding from "../components/Onboarding";          // ★ 初回だけ表示
import ProfileSetup from "../components/ProfileSetup";       // 既存の編集用（Manage Dogs 経由）
import MealInput from "../components/MealInput";
import DailySuggestions from "../components/DailySuggestions";
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

/* ---------- Normalizers（避妊/去勢やゴール等も持つ） ---------- */
function normalizeDog(d = {}) {
  const hf = Array.isArray(d.healthFocus) ? d.healthFocus : [];

  // 旧 age が数値だったときのフォールバック（年/月に分配）
  let ageYears = d.ageYears ?? "";
  let ageMonths = d.ageMonths ?? "";
  if ((ageYears === "" || ageYears == null) && (ageMonths === "" || ageMonths == null) && d.age != null && d.age !== "") {
    const n = Number(d.age);
    if (!Number.isNaN(n) && n >= 0) {
      const y = Math.floor(n);
      const m = Math.round((n - y) * 12);
      ageYears = y;
      ageMonths = m;
    }
  }

  return {
    id: d.id || genId(),
    photo: d.photo || "",
    name: d.name ?? "",

    // 年齢（旧ageも保持）
    age: d.age ?? "",           // 互換のため残す（未使用OK）
    ageYears: ageYears ?? "",
    ageMonths: ageMonths ?? "",

    breed: d.breed ?? "",
    weight: d.weight ?? "",
    weightUnit: d.weightUnit || "kg",

    // 追加属性
    spayNeuter: d.spayNeuter || "neutered", // "neutered" / "intact"
    activityLevel: d.activityLevel || "Moderate",
    goal: d.goal || "maintain",             // maintain / weight_loss / weight_gain
    lifeStage: d.lifeStage || "adult",      // adult / puppy_lt4m / puppy_ge4m
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

      // 週集計用に将来拡張するなら、calcium/phosphorus/omega3 なども入れる
      calcium: Number(m?.calcium) || 0,
      phosphorus: Number(m?.phosphorus) || 0,
      omega3: Number(m?.omega3) || 0,

      timestamp: m?.timestamp || new Date().toISOString(),
    }));
}

/* ---------- Page ---------- */
export default function Home() {
  // 画面：home / meals / suggestions / history / dogs / profile / onboarding
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

      // 正規化（欠けてるプロパティを補完）
      list = Array.isArray(list) ? list.map(normalizeDog) : [];
      setDogs(list);

      // ★ 初回（犬ゼロ）→ Onboarding。犬あり→ Home
      if (!list || list.length === 0) {
        setSelectedDogId("");
        setStep("onboarding");
      } else {
        const sel = rawSelected || list[0]?.id || "";
        setSelectedDogId(sel);
        setStep("home");
      }
    } catch {
      setDogs([]);
      setSelectedDogId("");
      setStep("onboarding");
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
      localStorage.setItem(
        mealsKey(selectedDogId, today),
        JSON.stringify(meals)
      );
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

  /* ---- 犬の CRUD ---- */
  const addDog = () => {
    // Manage Dogs からの追加は従来どおり Profile で編集
    const blank = normalizeDog({
      id: genId(),
      name: "",
      age: "",
      ageYears: "",
      ageMonths: "",
      breed: "",
      weight: "",
      weightUnit: "kg",
      spayNeuter: "neutered",
      activityLevel: "Moderate",
      goal: "maintain",
      lifeStage: "adult",
      healthFocus: [],
      photo: "",
    });
    setDogs((prev) => [...prev, blank]);
    setSelectedDogId(blank.id);
    setStep("profile");
  };

  const editDog = (dog) => {
    setSelectedDogId(dog.id);
    setStep("profile");
  };

  const deleteDog = (dogId) => {
    const confirmed = confirm(
      "本当に削除しますか？（履歴・本日の食事も表示されなくなります）"
    );
    if (!confirmed) return;
    setDogs((prev) => prev.filter((d) => d.id !== dogId));
    if (selectedDogId === dogId) {
      const rest = dogs.filter((d) => d.id !== dogId);
      const next = rest[0]?.id || "";
      setSelectedDogId(next);
      setStep(next ? "home" : "onboarding");
    }
  };

  const useDog = (dogId) => {
    setSelectedDogId(dogId);
    setStep("home");
  };

  // 写真更新（DogsManager から）
  const updateDogPhoto = (id, dataUrl) => {
    setDogs((prev) => prev.map((d) => (d.id === id ? { ...d, photo: dataUrl } : d)));
    setToast({ show: true, message: "Photo updated ✅" });
  };

  /* ---- ProfileSetup からの保存（追加/編集共通） ---- */
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

  /* ---- 今日を保存（犬ごとの履歴へ） ---- */
  const saveToday = () => {
    if (!selectedDog) return;
    if (!meals || meals.length === 0) return;
    const nowIso = new Date().toISOString();
    const entry = { date: nowIso, meals: meals, score: 0 };
    setHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex(
        (e) =>
          new Date(e.date).toDateString() === new Date(nowIso).toDateString()
      );
      if (idx >= 0) next[idx] = entry;
      else next.push(entry);
      return next;
    });
    setMeals([]);
    setToast({ show: true, message: "Saved today’s meals to History ✅" });
    setStep("history");
  };

  /* ---- Onboarding 完了時（初回のみ想定） ---- */
  const handleOnboardingComplete = (form) => {
    // form は Onboarding から渡される（name/ageYears/ageMonths/weight/weightUnit/spayNeuter/activityLevel/goal/lifeStage/photo/healthFocus）
    const created = normalizeDog({
      id: genId(),
      photo: form.photo || "",
      name: form.name || "",
      age: "", // 旧フィールドは空のままでOK
      ageYears: form.ageYears ?? "",
      ageMonths: form.ageMonths ?? "",
      breed: "", // 後から編集可
      weight: form.weight ?? "",
      weightUnit: form.weightUnit || "kg",
      spayNeuter: form.spayNeuter || "neutered",
      activityLevel: form.activityLevel || "Moderate",
      goal: form.goal || "maintain",
      lifeStage: form.lifeStage || "adult",
      healthFocus: Array.isArray(form.healthFocus) ? form.healthFocus : [],
    });

    setDogs((prev) => [...prev, created]);
    setSelectedDogId(created.id);
    setToast({ show: true, message: "Welcome to NutriPup 🎉" });
    setStep("home");
  };

  /* ---- 画面 ---- */
  return (
    <>
      <Layout step={step} setStep={setStep}>
        {/* 初回オンボーディング（犬ゼロのときだけ） */}
        {step === "onboarding" && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {/* 上部に Dog 切替（home/meals/suggestions/history で表示） */}
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
            onClose={() => setStep(selectedDog ? "home" : "onboarding")}
          />
        )}

        {/* 追加/編集 プロフィール（Manage Dogs から入る） */}
        {step === "profile" && (
          <ProfileSetup
            dogProfile={normalizeDog(selectedDog || { id: selectedDogId })}
            setDogProfile={(patch) => {
              // 入力中も常に正規化して保持（空新規でも即座に作成）
              const base =
                selectedDog || (selectedDogId ? { id: selectedDogId } : { id: genId() });
              const next = normalizeDog({ ...base, ...patch });

              setDogs((prev) => {
                const exists = prev.some((d) => d.id === next.id);
                return exists
                  ? prev.map((d) => (d.id === next.id ? next : d))
                  : [...prev, next];
              });
              if (!selectedDogId) setSelectedDogId(next.id);
            }}
            onContinue={() =>
              saveProfile(
                selectedDog ||
                  dogs.find((d) => d.id === selectedDogId) || { id: selectedDogId }
              )
            }
          />
        )}

        {/* ホーム（ダッシュボード） */}
        {step === "home" && selectedDog && (
          <HomeDashboard
            dogProfile={normalizeDog(selectedDog)} // 念のため
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

        {/* 賢い提案（ローカル + /api/suggest によるAI） */}
        {step === "suggestions" && selectedDog && (
          <DailySuggestions
            meals={meals}
            dogProfile={normalizeDog(selectedDog)} // 念のため
            onBack={() => setStep("home")}
          />
        )}

        {/* 履歴（犬ごと） */}
        {step === "history" && selectedDog && (
          <div className="card">
            <h2 style={{ marginTop: 0 }}>
              History — {selectedDog.name || "Dog"}
            </h2>
            <div style={{ color: "var(--taupe)", marginBottom: 8 }}>
              最近のスコア推移と日別ログ
            </div>

            <div style={{ marginBottom: 12 }}>
              {/* HomeDashboard を再利用（中の HistoryChart も表示される） */}
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
              <button
                className="btn btn-primary"
                onClick={saveToday}
                style={{ flex: 1 }}
              >
                Save Today
              </button>
            </div>
          </div>
        )}

        {/* 犬が選択されていない場合の空状態（通常は出ない想定） */}
        {!selectedDog &&
          !["onboarding", "profile", "dogs"].includes(step) && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 800 }}>No dog selected</div>
              <div style={{ marginBottom: 12, color: "var(--taupe)" }}>
                まず犬を追加して選択してください。
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setStep("dogs")}>
                  Manage Dogs
                </button>
                <button className="btn btn-primary" onClick={addDog}>
                  Add Dog
                </button>
              </div>
            </div>
          )}
      </Layout>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: "" })}
      />
    </>
  );
}
