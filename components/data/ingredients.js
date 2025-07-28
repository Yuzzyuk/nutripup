// components/data/ingredients.js
// 100gあたりの栄養（犬向け手作りでよく使う食材）
// 追加方法: 同じキーでオブジェクトを push してください。
// units: g=グラム, kcal, omega3=EPA+DHA目安g, vitamin_score/mineral_scoreは0.0〜1.0の相対指標
export const INGREDIENTS = [
  // --- 肉・魚（生 or 一般）
  { name: "Chicken Breast",           protein: 31,  fat: 3.6,  carbs: 0,   calories: 165, fiber: 0,   calcium: 0.015, phosphorus: 0.22,  omega3: 0.02, vitamin_score: 0.05, mineral_score: 0.20 },
  { name: "Chicken Thigh (skinless)", protein: 26,  fat: 6.0,  carbs: 0,   calories: 165, fiber: 0,   calcium: 0.012, phosphorus: 0.20,  omega3: 0.02, vitamin_score: 0.05, mineral_score: 0.20 },
  { name: "Beef (lean)",              protein: 26,  fat: 10,   carbs: 0,   calories: 217, fiber: 0,   calcium: 0.015, phosphorus: 0.19,  omega3: 0.03, vitamin_score: 0.05, mineral_score: 0.25 },
  { name: "Pork (lean)",              protein: 27,  fat: 6,    carbs: 0,   calories: 180, fiber: 0,   calcium: 0.010, phosphorus: 0.20,  omega3: 0.02, vitamin_score: 0.04, mineral_score: 0.20 },
  { name: "Turkey",                   protein: 29,  fat: 7,    carbs: 0,   calories: 189, fiber: 0,   calcium: 0.012, phosphorus: 0.21,  omega3: 0.02, vitamin_score: 0.05, mineral_score: 0.20 },
  { name: "Lamb (lean)",              protein: 25,  fat: 16,   carbs: 0,   calories: 294, fiber: 0,   calcium: 0.012, phosphorus: 0.19,  omega3: 0.03, vitamin_score: 0.05, mineral_score: 0.25 },

  // --- 魚・オメガ3ソース
  { name: "Salmon",                   protein: 25,  fat: 14,   carbs: 0,   calories: 208, fiber: 0,   calcium: 0.009, phosphorus: 0.20,  omega3: 1.8,  vitamin_score: 0.20, mineral_score: 0.25 },
  { name: "Sardines (in water)",      protein: 25,  fat: 11,   carbs: 0,   calories: 208, fiber: 0,   calcium: 0.38,  phosphorus: 0.50,  omega3: 1.5,  vitamin_score: 0.20, mineral_score: 0.60 },
  { name: "Mackerel",                 protein: 24,  fat: 13,   carbs: 0,   calories: 205, fiber: 0,   calcium: 0.012, phosphorus: 0.25,  omega3: 1.6,  vitamin_score: 0.18, mineral_score: 0.30 },

  // --- 卵・乳
  { name: "Eggs",                     protein: 13,  fat: 11,   carbs: 1.1, calories: 155, fiber: 0,   calcium: 0.050, phosphorus: 0.19,  omega3: 0.08, vitamin_score: 0.20, mineral_score: 0.30 },
  { name: "Cottage Cheese (low-fat)", protein: 11,  fat: 4.3,  carbs: 3.4, calories: 98,  fiber: 0,   calcium: 0.083, phosphorus: 0.15,  omega3: 0.02, vitamin_score: 0.10, mineral_score: 0.30 },
  { name: "Yogurt (plain)",           protein: 10,  fat: 5,    carbs: 3.6, calories: 95,  fiber: 0,   calcium: 0.12,  phosphorus: 0.10,  omega3: 0.02, vitamin_score: 0.08, mineral_score: 0.30 },

  // --- 穀類・デンプン
  { name: "White Rice (cooked)",      protein: 2.4, fat: 0.3,  carbs: 28,  calories: 130, fiber: 0.3, calcium: 0.01,  phosphorus: 0.04,  omega3: 0.00, vitamin_score: 0.02, mineral_score: 0.05 },
  { name: "Brown Rice (cooked)",      protein: 2.6, fat: 0.9,  carbs: 23,  calories: 111, fiber: 1.8, calcium: 0.01,  phosphorus: 0.08,  omega3: 0.00, vitamin_score: 0.04, mineral_score: 0.08 },
  { name: "Oats (cooked)",            protein: 2.5, fat: 1.5,  carbs: 12,  calories: 71,  fiber: 1.7, calcium: 0.02,  phosphorus: 0.06,  omega3: 0.02, vitamin_score: 0.06, mineral_score: 0.10 },
  { name: "Quinoa (cooked)",          protein: 4.4, fat: 1.9,  carbs: 21,  calories: 120, fiber: 2.8, calcium: 0.017, phosphorus: 0.15,  omega3: 0.06, vitamin_score: 0.08, mineral_score: 0.15 },
  { name: "Sweet Potato (boiled)",    protein: 2.0, fat: 0.1,  carbs: 20,  calories: 86,  fiber: 3.0, calcium: 0.03,  phosphorus: 0.05,  omega3: 0.00, vitamin_score: 0.25, mineral_score: 0.12 },
  { name: "White Potato (boiled)",    protein: 2.0, fat: 0.1,  carbs: 17,  calories: 87,  fiber: 1.8, calcium: 0.01,  phosphorus: 0.04,  omega3: 0.00, vitamin_score: 0.08, mineral_score: 0.08 },

  // --- 野菜
  { name: "Pumpkin",                  protein: 1.0, fat: 0.1,  carbs: 7,   calories: 26,  fiber: 0.5, calcium: 0.02,  phosphorus: 0.04,  omega3: 0.00, vitamin_score: 0.25, mineral_score: 0.10 },
  { name: "Carrots (raw)",            protein: 0.9, fat: 0.2,  carbs: 10,  calories: 41,  fiber: 2.8, calcium: 0.033, phosphorus: 0.035, omega3: 0.01, vitamin_score: 0.40, mineral_score: 0.10 },
  { name: "Broccoli (steamed)",       protein: 2.8, fat: 0.4,  carbs: 7,   calories: 35,  fiber: 3.3, calcium: 0.047, phosphorus: 0.066, omega3: 0.06, vitamin_score: 0.35, mineral_score: 0.20 },
  { name: "Spinach (raw)",            protein: 2.9, fat: 0.4,  carbs: 3.6, calories: 23,  fiber: 2.2, calcium: 0.099, phosphorus: 0.049, omega3: 0.14, vitamin_score: 0.35, mineral_score: 0.30 },
  { name: "Kale",                     protein: 2.9, fat: 0.6,  carbs: 10,  calories: 49,  fiber: 3.6, calcium: 0.15,  phosphorus: 0.09,  omega3: 0.12, vitamin_score: 0.50, mineral_score: 0.30 },
  { name: "Green Beans (boiled)",     protein: 1.8, fat: 0.1,  carbs: 7,   calories: 35,  fiber: 3.2, calcium: 0.037, phosphorus: 0.038, omega3: 0.03, vitamin_score: 0.20, mineral_score: 0.12 },
  { name: "Zucchini",                 protein: 1.2, fat: 0.3,  carbs: 3.1, calories: 17,  fiber: 1.1, calcium: 0.016, phosphorus: 0.038, omega3: 0.03, vitamin_score: 0.18, mineral_score: 0.10 },
  { name: "Cabbage",                  protein: 1.3, fat: 0.1,  carbs: 6,   calories: 25,  fiber: 2.5, calcium: 0.04,  phosphorus: 0.03,  omega3: 0.03, vitamin_score: 0.20, mineral_score: 0.12 },
  { name: "Bell Pepper (red)",        protein: 1.0, fat: 0.3,  carbs: 6,   calories: 31,  fiber: 2.1, calcium: 0.007, phosphorus: 0.020, omega3: 0.02, vitamin_score: 0.45, mineral_score: 0.08 },

  // --- 果物（少量のご褒美）
  { name: "Blueberries",              protein: 0.7, fat: 0.3,  carbs: 14,  calories: 57,  fiber: 2.4, calcium: 0.006, phosphorus: 0.012, omega3: 0.01, vitamin_score: 0.30, mineral_score: 0.06 },
  { name: "Apple (no seeds)",         protein: 0.3, fat: 0.2,  carbs: 14,  calories: 52,  fiber: 2.4, calcium: 0.006, phosphorus: 0.012, omega3: 0.00, vitamin_score: 0.08, mineral_score: 0.04 },
  { name: "Banana",                   protein: 1.1, fat: 0.3,  carbs: 23,  calories: 96,  fiber: 2.6, calcium: 0.005, phosphorus: 0.022, omega3: 0.02, vitamin_score: 0.10, mineral_score: 0.06 },

  // --- オイル・サプリ系
  { name: "Olive Oil",                protein: 0,   fat: 100,  carbs: 0,   calories: 884, fiber: 0,   calcium: 0,     phosphorus: 0,     omega3: 0.7,  vitamin_score: 0.05, mineral_score: 0.00 },
  { name: "Fish Oil",                 protein: 0,   fat: 100,  carbs: 0,   calories: 884, fiber: 0,   calcium: 0,     phosphorus: 0,     omega3: 20.0, vitamin_score: 0.00, mineral_score: 0.00 },
  { name: "Flaxseed (ground)",        protein: 18,  fat: 42,   carbs: 29,  calories: 534, fiber: 27,  calcium: 0.255, phosphorus: 0.642, omega3: 22.8, vitamin_score: 0.15, mineral_score: 0.40 },
  { name: "Eggshell Powder",          protein: 0,   fat: 0,    carbs: 0,   calories: 0,   fiber: 0,   calcium: 37.0,  phosphorus: 0.0,   omega3: 0.00, vitamin_score: 0.00, mineral_score: 1.00 },

  // --- 内臓
  { name: "Beef Liver",               protein: 20.4,fat: 3.6,  carbs: 4.8, calories: 135, fiber: 0,   calcium: 0.005, phosphorus: 0.387, omega3: 0.10, vitamin_score: 0.80, mineral_score: 0.60 },
  { name: "Chicken Liver",            protein: 17,  fat: 5,    carbs: 1.1, calories: 119, fiber: 0,   calcium: 0.011, phosphorus: 0.297, omega3: 0.10, vitamin_score: 0.70, mineral_score: 0.40 },
  { name: "Chicken Heart",            protein: 15,  fat: 10,   carbs: 0,   calories: 185, fiber: 0,   calcium: 0.006, phosphorus: 0.21,  omega3: 0.07, vitamin_score: 0.20, mineral_score: 0.30 },

  // --- その他
  { name: "Tofu (firm)",              protein: 8,   fat: 4.8,  carbs: 2.0, calories: 76,  fiber: 0.9, calcium: 0.350, phosphorus: 0.120, omega3: 0.30, vitamin_score: 0.08, mineral_score: 0.30 },
  { name: "Edamame (boiled)",         protein: 11,  fat: 5.2,  carbs: 8.4, calories: 141, fiber: 5.2, calcium: 0.063, phosphorus: 0.169, omega3: 0.28, vitamin_score: 0.12, mineral_score: 0.20 },
  { name: "Cheddar (low-fat)",        protein: 25,  fat: 9,    carbs: 1.3, calories: 250, fiber: 0,   calcium: 0.72,  phosphorus: 0.50,  omega3: 0.10, vitamin_score: 0.05, mineral_score: 0.60 },
  { name: "Plain Rice Cake",          protein: 7.3, fat: 2.2,  carbs: 80,  calories: 387, fiber: 4.0, calcium: 0.01,  phosphorus: 0.13,  omega3: 0.02, vitamin_score: 0.02, mineral_score: 0.06 },
  { name: "Seaweed (Nori)",           protein: 29,  fat: 0.4,  carbs: 41,  calories: 290, fiber: 36,  calcium: 0.70,  phosphorus: 0.65,  omega3: 1.2,  vitamin_score: 0.70, mineral_score: 0.80 },
  { name: "Green-Lipped Mussel",      protein: 16,  fat: 3,    carbs: 7,   calories: 140, fiber: 0,   calcium: 0.10,  phosphorus: 0.25,  omega3: 0.60, vitamin_score: 0.10, mineral_score: 0.25 },
];

// ★数値は一般的な食品成分表の近似・MVP用目安。犬の健康状態に応じて必ず調整してください。
