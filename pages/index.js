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

/* ---------- Normalizers (年齢: 年/月, 旧ageも維持) ---------- */
function normalizeDog(d = {}) {
  const hf = Array.isArray(d.healthFocus) ? d.healthFocus : [];

  // 旧 age → years/months 推定
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

    // 互換: 旧 age も保持（他画面の安全のため）
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
      timestamp: m?.timestamp || new Date().toISOString(),
    }));
}

/* ---------- Page ---------- */
export default function Home() {
  const [step, setStep] = useState("home"); // home/profile/meals/suggestions/history/dogs
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

  // 🔑 プロフィール編集中のドラフト（親が上書きしないように分離）
  const [profileDraft, setProfileDraft] = useState(null);

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
      setSelectedDogId(rawSelected || (list[0]?.id || ""));
      setStep(list && list.length > 0 ? "home" : "profile");
    } catch {
      setDogs([]);
      setSelectedDogId("");
      setStep("profile");
    }
  }, []);

  /* ---- step が profile に入ったタイミングでだけドラフトを初期化 ---- */
  useEffect(() => {
    if (step !== "profile") return;
    const base =
      selectedDog ||
      (selectedDogId ? { id: selectedDogId } : { id: genId() });
    setProfileDraft((prev) => {
      // 既に同じIDの編集中なら維持（打鍵を上書きしない）
      if (prev && prev.id === base.id) return prev;
      return normalizeDog(base);
    });
  }, [step, selectedDogId, selectedDog]);

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
    const blank = normalizeDog({
      id: genId(),
      name: "",
      age: "",
      ageYears: "",
      ageMonths: "",
      breed: "",
      weight: "",
      weightUnit: "kg",
      activityLevel: "Moderate",
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
      setStep(next ? "home" : "profile");
    }
  };

  const useDog = (dogId) => {
    setSelectedDogId(dogId);
    setStep("home");
  };

  // ✅ 写真更新（DogsManager から呼ばれる）
  const updateDogPhoto = (id, dataUrl) => {
    setDogs((prev) => prev.map((d) => (d.id === id ? { ...d, photo: dataUrl } : d)));
    setToast({ show: true, message: "Photo updated ✅" });
  };

  /* ---- 保存（ドラフトを dogs に反映してから Home） ---- */
  const saveProfile = (draft) => {
    const safe = normalizeDog(draft || {});
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

  /* ---- 画面 ---- */
  return (
    <>
      <Layout step={step} setStep={setStep}>
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
            onClose={() => setStep(selectedDog ? "home" : "profile")}
          />
        )}

        {/* 追加/編集 プロフィール（入力はドラフト、保存時のみ親へ反映） */}
        {step === "profile" && (
          <ProfileSetup
            dogProfile={profileDraft || normalizeDog(selectedDog || { id: selectedDogId })}
            setDogProfile={setProfileDraft}               // ← 親は上書きしない。ドラフトにだけ反映
            onContinue={() => saveProfile(profileDraft)}  // ← Save & Continue で保存
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
              {/* HomeDashboard の下半分（HistoryChart）を再利用 */}
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

        {/* 犬が選択されていない場合の空状態 */}
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
