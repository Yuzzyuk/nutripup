"use client";
import React, { useState } from "react";
import AiSuggestions from "./AiSuggestions";

function MainComponent() {
  // 画面ステップ
  const [currentStep, setCurrentStep] = useState("home");

  // プロフィール
  const [dogProfile, setDogProfile] = useState({
    name: "",
    age: "",
    breed: "",
    weight: "",
    weightUnit: "kg",
    activityLevel: "",
    healthFocus: [], // ← 配列で初期化（多頭/多選択対応）
  });

  // 食事関連
  const [dailyMeals, setDailyMeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // 履歴
  const [mealHistory, setMealHistory] = useState([]);
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // 入力補助
  const [portion, setPortion] = useState("100");
  const [cookingMethod, setCookingMethod] = useState("raw");
  const [customIngredients, setCustomIngredients] = useState([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    protein: "",
    fat: "",
    carbs: "",
    calories: "",
  });

  // よく使う食材（100g あたり栄養）
  const commonIngredients = [
    { name: "Chicken Breast", protein: 31, fat: 3.6, carbs: 0, calories: 165 },
    { name: "Salmon", protein: 25, fat: 14, carbs: 0, calories: 208 },
    { name: "Sweet Potato", protein: 2, fat: 0.1, carbs: 20, calories: 86 },
    { name: "Brown Rice", protein: 2.6, fat: 0.9, carbs: 23, calories: 111 },
    { name: "Carrots", protein: 0.9, fat: 0.2, carbs: 10, calories: 41 },
    { name: "Spinach", protein: 2.9, fat: 0.4, carbs: 3.6, calories: 23 },
    { name: "Beef", protein: 26, fat: 15, carbs: 0, calories: 250 },
    { name: "Pumpkin", protein: 1, fat: 0.1, carbs: 7, calories: 26 },
    { name: "Blueberries", protein: 0.7, fat: 0.3, carbs: 14, calories: 57 },
    { name: "Eggs", protein: 13, fat: 11, carbs: 1.1, calories: 155 },
  ];

  const breeds = [
    "Golden Retriever",
    "Labrador Retriever",
    "German Shepherd",
    "French Bulldog",
    "Bulldog",
    "Poodle",
    "Beagle",
    "Rottweiler",
    "Yorkshire Terrier",
    "Dachshund",
    "Siberian Husky",
    "Boxer",
    "Border Collie",
    "Australian Shepherd",
    "Shih Tzu",
    "Shiba",
  ];

  const healthFocusOptions = [
    { id: "skin", label: "Skin & Coat Health", icon: "✨" },
    { id: "joints", label: "Joint Support", icon: "🦴" },
    { id: "kidneys", label: "Kidney Health", icon: "💧" },
    { id: "digestion", label: "Digestive Health", icon: "🌿" },
    { id: "weight", label: "Weight Management", icon: "⚖️" },
    { id: "energy", label: "Energy & Vitality", icon: "⚡" },
  ];

  const allIngredients = [...commonIngredients, ...customIngredients];

  const filteredIngredients = allIngredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 栄養スコア（簡易）
  const calculateNutritionScore = (meals) => {
    if (!Array.isArray(meals) || meals.length === 0)
      return {
        protein: 0,
        fats: 0,
        minerals: 0,
        vitamins: 0,
        energy: 0,
        fiber: 0,
        calcium: 0,
        phosphorus: 0,
      };

    const totals = meals.reduce(
      (acc, meal) => {
        acc.protein += Number(meal.protein) || 0;
        acc.fat += Number(meal.fat) || 0;
        acc.carbs += Number(meal.carbs) || 0;
        acc.calories += Number(meal.calories) || 0;
        return acc;
      },
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    );

    return {
      protein: Math.min(100, (totals.protein / 50) * 100),
      fats: Math.min(100, (totals.fat / 15) * 100),
      minerals: Math.min(100, 60),
      vitamins: Math.min(100, 60),
      energy: Math.min(100, (totals.calories / 800) * 100),
      fiber: Math.min(100, 60),
      calcium: Math.min(100, 60),
      phosphorus: Math.min(100, 60),
    };
  };

  const getDogFace = (score) => {
    if (score >= 80) return "😊";
    if (score >= 60) return "😐";
    return "😔";
  };

  const getMealFeedback = (meal) => {
    const feedback = [];
    const p = Number(meal.protein) || 0;
    const f = Number(meal.fat) || 0;
    const c = Number(meal.carbs) || 0;
    const cal = Number(meal.calories) || 0;

    if (p < 20) feedback.push("Add more protein sources like chicken or fish");
    if (f < 5) feedback.push("Include healthy fats like salmon or fish oil");
    if (c < 10 && meal.name !== "Beef" && meal.name !== "Chicken Breast")
      feedback.push("Consider adding vegetables for fiber and micronutrients");
    if (cal < 100) feedback.push("Quite light — consider a larger portion");

    return feedback[0] || "Great choice! Well-balanced ingredient";
  };

  const addCustomIngredient = () => {
    if (
      newIngredient.name &&
      newIngredient.protein &&
      newIngredient.fat &&
      newIngredient.carbs &&
      newIngredient.calories
    ) {
      const ingredient = {
        name: newIngredient.name,
        protein: parseFloat(newIngredient.protein),
        fat: parseFloat(newIngredient.fat),
        carbs: parseFloat(newIngredient.carbs),
        calories: parseFloat(newIngredient.calories),
      };
      setCustomIngredients([...customIngredients, ingredient]);
      setNewIngredient({
        name: "",
        protein: "",
        fat: "",
        carbs: "",
        calories: "",
      });
      setShowAddIngredient(false);
    }
  };

  const addMeal = (ingredient, portionAmount, cookingMethodValue) => {
    const meal = {
      id: Date.now(),
      ...ingredient,
      portion: parseFloat(portionAmount),
      cookingMethod: cookingMethodValue,
      timestamp: new Date().toISOString(),
    };
    setDailyMeals([...dailyMeals, meal]);
    setSelectedIngredient(null);
    setSearchTerm("");
    setPortion("100");
    setCookingMethod("raw");
  };

  const nutritionScore = calculateNutritionScore(dailyMeals);
  const averageScore =
    Object.values(nutritionScore).reduce((a, b) => a + b, 0) / 8;

  const editCustomIngredient = (index) => {
    const ingredient = customIngredients[index];
    setNewIngredient({
      name: ingredient.name,
      protein: ingredient.protein.toString(),
      fat: ingredient.fat.toString(),
      carbs: ingredient.carbs.toString(),
      calories: ingredient.calories.toString(),
    });
    setCustomIngredients(customIngredients.filter((_, i) => i !== index));
    setShowAddIngredient(true);
  };

  const deleteCustomIngredient = (index) => {
    setCustomIngredients(customIngredients.filter((_, i) => i !== index));
  };

  // ======= Home =======
  if (currentStep === "home") {
    const radarPoints = [
      { label: "Protein", value: nutritionScore.protein, angle: 0 },
      { label: "Fats", value: nutritionScore.fats, angle: 45 },
      { label: "Minerals", value: nutritionScore.minerals, angle: 90 },
      { label: "Vitamins", value: nutritionScore.vitamins, angle: 135 },
      { label: "Energy", value: nutritionScore.energy, angle: 180 },
      { label: "Fiber", value: nutritionScore.fiber, angle: 225 },
      { label: "Calcium", value: nutritionScore.calcium, angle: 270 },
      { label: "Phosphorus", value: nutritionScore.phosphorus, angle: 315 },
    ];

    const createRadarPath = (points, radius = 120) => {
      const centerX = 140;
      const centerY = 140;
      const pathPoints = points.map((point) => {
        const angleRad = (point.angle * Math.PI) / 180;
        const r = (point.value / 100) * radius;
        const x = centerX + r * Math.cos(angleRad);
        const y = centerY + r * Math.sin(angleRad);
        return `${x},${y}`;
      });
      return `M ${pathPoints.join(" L ")} Z`;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f3f0] to-[#e8ddd4] font-inter">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{getDogFace(averageScore)}</div>
            <h1 className="text-3xl font-bold text-[#8b7355] mb-2">
              {dogProfile.name
                ? `${dogProfile.name}'s Health`
                : "NutriPup Dashboard"}
            </h1>
            <p className="text-[#a0916b] text-lg">
              Overall Nutrition Score: {Math.round(averageScore)}%
            </p>
          </div>

          {/* 8-Axis Radar */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#8b7355] mb-4 text-center">
              8-Axis Nutrition Radar
            </h3>

            <div className="flex justify-center mb-6 relative">
              <svg width="280" height="280" className="transform -rotate-90">
                {[30, 60, 90, 120].map((radius) => (
                  <circle
                    key={radius}
                    cx="140"
                    cy="140"
                    r={radius}
                    fill="none"
                    stroke="#e8ddd4"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                ))}

                {radarPoints.map((point) => {
                  const angleRad = (point.angle * Math.PI) / 180;
                  const x2 = 140 + 120 * Math.cos(angleRad);
                  const y2 = 140 + 120 * Math.sin(angleRad);
                  return (
                    <line
                      key={point.label}
                      x1="140"
                      y1="140"
                      x2={x2}
                      y2={y2}
                      stroke="#e8ddd4"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  );
                })}

                <path
                  d={createRadarPath(radarPoints, 120)}
                  fill="#9db5a1"
                  fillOpacity="0.3"
                  stroke="#9db5a1"
                  strokeWidth="2"
                />

                {radarPoints.map((point) => {
                  const angleRad = (point.angle * Math.PI) / 180;
                  const r = (point.value / 100) * 120;
                  const x = 140 + r * Math.cos(angleRad);
                  const y = 140 + r * Math.sin(angleRad);
                  return (
                    <circle
                      key={point.label}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#9db5a1"
                    />
                  );
                })}
              </svg>

              {/* ラベル */}
              {radarPoints.map((point) => {
                const angleRad = (point.angle * Math.PI) / 180;
                const labelRadius = 150;
                const x = 140 + labelRadius * Math.cos(angleRad);
                const y = 140 + labelRadius * Math.sin(angleRad);

                return (
                  <div
                    key={point.label}
                    className="absolute text-xs font-semibold text-[#8b7355] pointer-events-none"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                      width: "60px",
                      textAlign: "center",
                    }}
                  >
                    {point.label}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {radarPoints.map((point) => (
                <div
                  key={point.label}
                  className="flex items-center justify-between p-3 bg-[#f7f3f0] rounded-xl"
                >
                  <span className="text-sm font-medium text-[#8b7355]">
                    {point.label}
                  </span>
                  <span className="text-sm font-bold text-[#9db5a1]">
                    {Math.round(point.value)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#8b7355] mb-4 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Daily Suggestions
            </h3>
            <AiSuggestions meals={dailyMeals} dogProfile={dogProfile} />
          </div>

          {/* ナビゲーション */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentStep("meals")}
              className="bg-[#9db5a1] text-white font-bold py-4 rounded-2xl text-lg hover:bg-[#8ba394] transition-colors"
            >
              Add Meals
            </button>
            <button
              onClick={() => setCurrentStep("profile")}
              className="bg-[#e8ddd4] text-[#8b7355] font-semibold py-4 rounded-2xl hover:bg-[#d4c7b8] transition-colors"
            >
              Dog Profile
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => setCurrentStep("history")}
              className="bg-[#e8ddd4] text-[#8b7355] font-semibold py-4 rounded-2xl hover:bg-[#d4c7b8] transition-colors"
            >
              View History
            </button>
            <button
              onClick={() => setCurrentStep("ingredients")}
              className="bg-[#e8ddd4] text-[#8b7355] font-semibold py-4 rounded-2xl hover:bg-[#d4c7b8] transition-colors"
            >
              Manage Ingredients
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======= Ingredients =======
  if (currentStep === "ingredients") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f3f0] to-[#e8ddd4] font-inter">
        <div className="container mx-auto px-4 py-6 max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#8b7355]">
                Manage Ingredients
              </h1>
              <p className="text-[#a0916b]">
                Add, edit, or delete custom ingredients
              </p>
            </div>
            <button
              onClick={() => setCurrentStep("home")}
              className="px-4 py-2 bg-[#e8ddd4] text-[#8b7355] font-semibold rounded-xl hover:bg-[#d4c7b8] transition-colors"
            >
              Home
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#8b7355]">
                Custom Ingredients
              </h3>
              <button
                onClick={() => setShowAddIngredient(true)}
                className="bg-[#9db5a1] text-white px-4 py-2 rounded-xl hover:bg-[#8ba394] transition-colors"
              >
                + Add New
              </button>
            </div>

            {customIngredients.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🥗</div>
                <p className="text-[#a0916b]">No custom ingredients yet</p>
                <p className="text-sm text-[#a0916b] mt-2">
                  Click "Add New" to create your first custom ingredient
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customIngredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-[#f7f3f0] rounded-xl"
                  >
                    <div>
                      <div className="font-semibold text-[#8b7355]">
                        {ingredient.name}
                      </div>
                      <div className="text-sm text-[#a0916b]">
                        {ingredient.protein}g protein • {ingredient.fat}g fat •{" "}
                        {ingredient.calories} cal/100g
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editCustomIngredient(index)}
                        className="text-[#9db5a1] hover:text-[#8ba394] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCustomIngredient(index)}
                        className="text-[#a0916b] hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddIngredient && (
              <div className="mt-6 p-4 bg-[#f7f3f0] rounded-2xl">
                <h4 className="font-semibold text-[#8b7355] mb-4">
                  {newIngredient.name ? "Edit" : "Add"} Custom Ingredient
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[#8b7355] font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newIngredient.name}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          name: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none"
                      placeholder="Ingredient name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#8b7355] font-medium mb-2">
                        Protein (g/100g)
                      </label>
                      <input
                        type="number"
                        value={newIngredient.protein}
                        onChange={(e) =>
                          setNewIngredient({
                            ...newIngredient,
                            protein: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8b7355] font-medium mb-2">
                        Fat (g/100g)
                      </label>
                      <input
                        type="number"
                        value={newIngredient.fat}
                        onChange={(e) =>
                          setNewIngredient({
                            ...newIngredient,
                            fat: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#8b7355] font-medium mb-2">
                        Carbs (g/100g)
                      </label>
                      <input
                        type="number"
                        value={newIngredient.carbs}
                        onChange={(e) =>
                          setNewIngredient({
                            ...newIngredient,
                            carbs: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8b7355] font-medium mb-2">
                        Calories (per 100g)
                      </label>
                      <input
                        type="number"
                        value={newIngredient.calories}
                        onChange={(e) =>
                          setNewIngredient({
                            ...newIngredient,
                            calories: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={addCustomIngredient}
                      disabled={
                        !newIngredient.name ||
                        !newIngredient.protein ||
                        !newIngredient.fat ||
                        !newIngredient.carbs ||
                        !newIngredient.calories
                      }
                      className="flex-1 bg-[#9db5a1] text-white font-semibold py-3 rounded-xl hover:bg-[#8ba394] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {newIngredient.name ? "Update" : "Add"} Ingredient
                    </button>
                    <button
                      onClick={() => {
                        setShowAddIngredient(false);
                        setNewIngredient({
                          name: "",
                          protein: "",
                          fat: "",
                          carbs: "",
                          calories: "",
                        });
                      }}
                      className="px-6 bg-[#e8ddd4] text-[#8b7355] font-semibold py-3 rounded-xl hover:bg-[#d4c7b8] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ======= Profile =======
  if (currentStep === "profile") {
    const isSelected = (id) =>
      Array.isArray(dogProfile.healthFocus) &&
      dogProfile.healthFocus.includes(id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f3f0] to-[#e8ddd4] font-inter">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐕</div>
            <h1 className="text-3xl font-bold text-[#8b7355] mb-2">
              Welcome to NutriPup
            </h1>
            <p className="text-[#a0916b] text-lg">
              Let's create your dog's nutrition profile
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
            <div>
              <label className="block text-[#8b7355] font-semibold mb-2">
                Dog's Name
              </label>
              <input
                type="text"
                name="dogName"
                value={dogProfile.name}
                onChange={(e) =>
                  setDogProfile({ ...dogProfile, name: e.target.value })
                }
                className="w-full p-4 rounded-2xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none text-lg"
                placeholder="Enter your dog's name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#8b7355] font-semibold mb-2">
                  Age (years)
                </label>
                <input
                  type="number"
                  name="age"
                  value={dogProfile.age}
                  onChange={(e) =>
                    setDogProfile({ ...dogProfile, age: e.target.value })
                  }
                  className="w-full p-4 rounded-2xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none text-lg"
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="block text-[#8b7355] font-semibold mb-2">
                  Weight ({dogProfile.weightUnit})
                </label>
                <input
                  type="number"
                  name="weight"
                  value={dogProfile.weight}
                  onChange={(e) =>
                    setDogProfile({ ...dogProfile, weight: e.target.value })
                  }
                  className="w-full p-4 rounded-2xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none text-lg"
                  placeholder="Weight"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#8b7355] font-semibold mb-2">
                Breed
              </label>
              <select
                name="breed"
                value={dogProfile.breed}
                onChange={(e) =>
                  setDogProfile({ ...dogProfile, breed: e.target.value })
                }
                className="w-full p-4 rounded-2xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none text-lg"
              >
                <option value="">Select breed</option>
                {breeds.map((breed) => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#8b7355] font-semibold mb-2">
                Activity Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Low", "Moderate", "High"].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setDogProfile({ ...dogProfile, activityLevel: level })
                    }
                    className={`p-3 rounded-2xl font-semibold transition-all ${
                      dogProfile.activityLevel === level
                        ? "bg-[#9db5a1] text-white"
                        : "bg-[#f7f3f0] text-[#8b7355] hover:bg-[#e8ddd4]"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#8b7355] font-semibold mb-3">
                Health Focus Areas (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {healthFocusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const curr = Array.isArray(dogProfile.healthFocus)
                        ? dogProfile.healthFocus
                        : [];
                      const newFocus = curr.includes(option.id)
                        ? curr.filter((f) => f !== option.id)
                        : [...curr, option.id];
                      setDogProfile({ ...dogProfile, healthFocus: newFocus });
                    }}
                    className={`p-3 rounded-2xl text-sm font-medium transition-all ${
                      isSelected(option.id)
                        ? "bg-[#9db5a1] text-white"
                        : "bg-[#f7f3f0] text-[#8b7355] hover:bg-[#e8ddd4]"
                    }`}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setCurrentStep("meals")}
              disabled={
                !dogProfile.name ||
                !dogProfile.age ||
                !dogProfile.weight ||
                !dogProfile.breed ||
                !dogProfile.activityLevel
              }
              className="w-full bg-[#9db5a1] text-white font-bold py-4 rounded-2xl text-lg hover:bg-[#8ba394] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Meal Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======= Meals =======
  if (currentStep === "meals") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f3f0] to-[#e8ddd4] font-inter">
        <div className="container mx-auto px-4 py-6 max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#8b7355]">
                Today's Meals
              </h1>
              <p className="text-[#a0916b]">{dogProfile.name}'s nutrition</p>
            </div>
            <div className="text-right">
              <div className="text-2xl">🍽️</div>
              <div className="text-sm text-[#a0916b]">
                {dailyMeals.length} meals
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#8b7355] mb-4">
              Add Ingredient
            </h3>

            <div className="relative mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none text-lg"
                placeholder="Search ingredients..."
              />
            </div>

            {searchTerm && (
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {filteredIngredients.map((ingredient) => (
                  <button
                    key={ingredient.name}
                    onClick={() => setSelectedIngredient(ingredient)}
                    className="w-full p-3 rounded-xl bg-[#f7f3f0] hover:bg-[#e8ddd4] text-left transition-colors"
                  >
                    <div className="font-semibold text-[#8b7355]">
                      {ingredient.name}
                    </div>
                    <div className="text-sm text-[#a0916b]">
                      {ingredient.protein}g protein • {ingredient.calories} cal/100g
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedIngredient && (
              <div className="bg-[#f7f3f0] rounded-2xl p-4 mb-4">
                <h4 className="font-semibold text-[#8b7355] mb-3">
                  {selectedIngredient.name}
                </h4>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[#8b7355] font-medium mb-2">
                      Portion (grams)
                    </label>
                    <input
                      type="number"
                      value={portion}
                      onChange={(e) => setPortion(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8b7355] font-medium mb-2">
                      Cooking Method
                    </label>
                    <select
                      value={cookingMethod}
                      onChange={(e) => setCookingMethod(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-[#e8ddd4] focus:border-[#9db5a1] outline-none"
                    >
                      <option value="raw">Raw</option>
                      <option value="boiled">Boiled</option>
                      <option value="steamed">Steamed</option>
                      <option value="baked">Baked</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      addMeal(selectedIngredient, portion, cookingMethod)
                    }
                    disabled={!portion || portion <= 0}
                    className="flex-1 bg-[#9db5a1] text-white font-semibold py-3 rounded-xl hover:bg-[#8ba394] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Meal
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIngredient(null);
                      setPortion("100");
                      setCookingMethod("raw");
                    }}
                    className="px-6 bg-[#e8ddd4] text-[#8b7355] font-semibold py-3 rounded-xl hover:bg-[#d4c7b8] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {dailyMeals.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#8b7355] mb-4">
                Today's Meals
              </h3>
              <div className="space-y-3">
                {dailyMeals.map((meal) => (
                  <div key={meal.id} className="p-3 bg-[#f7f3f0] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-[#8b7355]">
                          {meal.name}
                        </div>
                        <div className="text-sm text-[#a0916b]">
                          {meal.portion}g • {meal.cookingMethod}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setDailyMeals(dailyMeals.filter((m) => m.id !== meal.id))
                        }
                        className="text-[#a0916b] hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="mt-2 p-2 bg-white rounded-lg border-l-4 border-[#9db5a1]">
                      <div className="text-xs text-[#8b7355] font-medium">
                        💡 Tip:
                      </div>
                      <div className="text-xs text-[#a0916b] mt-1">
                        {getMealFeedback(meal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep("nutrition")}
              disabled={dailyMeals.length === 0}
              className="flex-1 bg-[#9db5a1] text-white font-bold py-4 rounded-2xl text-lg hover:bg-[#8ba394] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Nutrition Summary
            </button>
            <button
              onClick={() => setCurrentStep("profile")}
              className="px-6 bg-[#e8ddd4] text-[#8b7355] font-semibold py-4 rounded-2xl hover:bg-[#d4c7b8] transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======= Nutrition Summary =======
  if (currentStep === "nutrition") {
    const radarPoints = [
      { label: "Protein", value: nutritionScore.protein, angle: 0 },
      { label: "Essential Fats", value: nutritionScore.fats, angle: 45 },
      { label: "Minerals", value: nutritionScore.minerals, angle: 90 },
      { label: "Vitamins", value: nutritionScore.vitamins, angle: 135 },
      { label: "Energy", value: nutritionScore.energy, angle: 180 },
      { label: "Fiber", value: nutritionScore.fiber, angle: 225 },
      { label: "Calcium", value: nutritionScore.calcium, angle: 270 },
      { label: "Phosphorus", value: nutritionScore.phosphorus, angle: 315 },
    ];

    const createRadarPath = (points, radius = 80) => {
      const centerX = 120;
      const centerY = 120;
      const pathPoints = points.map((point) => {
        const angleRad = (point.angle * Math.PI) / 180;
        const r = (point.value / 100) * radius;
        const x = centerX + r * Math.cos(angleRad);
        const y = centerY + r * Math.sin(angleRad);
        return `${x},${y}`;
      });
      return `M ${pathPoints.join(" L ")} Z`;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f3f0] to-[#e8ddd4] font-inter">
        <div className="container mx-auto px-4 py-6 max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#8b7355]">
                Nutrition Summary
              </h1>
              <p className="text-[#a0916b]">{dogProfile.name}'s daily nutrition</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#9db5a1]">
                {Math.round(averageScore)}%
              </div>
              <div className="text-sm text-[#a0916b]">Complete</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="flex justify-center mb-6">
              <svg width="240" height="240" className="transform -rotate-90">
                {[20, 40, 60, 80].map((radius) => (
                  <circle
                    key={radius}
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke="#e8ddd4"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                ))}
                {radarPoints.map((point) => {
                  const angleRad = (point.angle * Math.PI) / 180;
                  const x2 = 120 + 80 * Math.cos(angleRad);
                  const y2 = 120 + 80 * Math.sin(angleRad);
                  return (
                    <line
                      key={point.label}
                      x1="120"
                      y1="120"
                      x2={x2}
                      y2={y2}
                      stroke="#e8ddd4"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  );
                })}
                <path
                  d={createRadarPath(radarPoints)}
                  fill="#9db5a1"
                  fillOpacity="0.3"
                  stroke="#9db5a1"
                  strokeWidth="2"
                />
                {radarPoints.map((point) => {
                  const angleRad = (point.angle * Math.PI) / 180;
                  const r = (point.value / 100) * 80;
                  const x = 120 + r * Math.cos(angleRad);
                  const y = 120 + r * Math.sin(angleRad);
                  return <circle key={point.label} cx={x} cy={y} r="4" fill="#9db5a1" />;
                })}
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {radarPoints.map((point) => (
                <div
                  key={point.label}
                  className="flex items-center justify-between p-3 bg-[#f7f3f0] rounded-xl"
                >
                  <span className="text-sm font-medium text-[#8b7355]">
                    {point.label}
                  </span>
                  <span className="text-sm font-bold text-[#9db5a1]">
                    {Math.round(point.value)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions（要約＋補完提案） */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#8b7355] mb-4 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Daily Suggestions
            </h3>
            <AiSuggestions meals={dailyMeals} dogProfile={dogProfile} />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setMealHistory([
                  ...mealHistory,
                  { date: currentDate, meals: [...dailyMeals], score: averageScore },
                ]);
                setDailyMeals([]);
                setCurrentStep("history");
              }}
              className="flex-1 bg-[#9db5a1] text-white font-bold py-4 rounded-2xl text-lg hover:bg-[#8ba394] transition-colors"
            >
              Save & View History
            </button>
            <button
              onClick={() => setCurrentStep("meals")}
              className="px-6 bg-[#e8ddd4] text-[#8b7355] font-semibold py-4 rounded-2xl hover:bg-[#d4c7b8] transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======= History =======
  if (currentStep === "history") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f3f0] to-[#e8ddd4] font-inter">
        <div className="container mx-auto px-4 py-6 max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#8b7355]">Nutrition History</h1>
              <p className="text-[#a0916b]">{dogProfile.name}'s progress</p>
            </div>
            <div className="text-center">
              <div className="text-2xl">📊</div>
              <div className="text-sm text-[#a0916b]">{mealHistory.length} days</div>
            </div>
          </div>

          {mealHistory.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold text-[#8b7355] mb-2">
                Start Your Journey
              </h3>
              <p className="text-[#a0916b] mb-6">
                Begin tracking {dogProfile.name}'s nutrition to see progress over time
              </p>
              <button
                onClick={() => setCurrentStep("meals")}
                className="bg-[#9db5a1] text-white font-semibold py-3 px-6 rounded-2xl hover:bg-[#8ba394] transition-colors"
              >
                Add First Meal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mealHistory.map((day, index) => (
                <div key={index} className="bg-white rounded-3xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-[#8b7355]">
                        {new Date(day.date).toLocaleDateString()}
                      </h3>
                      <p className="text-sm text-[#a0916b]">
                        {day.meals.length} meals logged
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#9db5a1]">
                        {Math.round(day.score)}%
                      </div>
                      <div className="text-xs text-[#a0916b]">Complete</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {day.meals.slice(0, 3).map((meal, mealIndex) => (
                      <div
                        key={mealIndex}
                        className="flex items-center justify-between p-2 bg-[#f7f3f0] rounded-xl"
                      >
                        <span className="text-sm text-[#8b7355]">{meal.name}</span>
                        <span className="text-xs text-[#a0916b]">{meal.portion}g</span>
                      </div>
                    ))}
                    {day.meals.length > 3 && (
                      <div className="text-center text-sm text-[#a0916b]">
                        +{day.meals.length - 3} more meals
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setCurrentStep("meals")}
              className="flex-1 bg-[#9db5a1] text-white font-bold py-4 rounded-2xl text-lg hover:bg-[#8ba394] transition-colors"
            >
              Add Today's Meals
            </button>
            <button
              onClick={() => setCurrentStep("nutrition")}
              className="px-6 bg-[#e8ddd4] text-[#8b7355] font-semibold py-4 rounded-2xl hover:bg-[#d4c7b8] transition-colors"
            >
              Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default MainComponent;
