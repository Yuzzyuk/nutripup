// components/data/supplements.js
// 100gあたりの目安（MVP・近似値）。必要に応じて調整してください。
export const SUPPLEMENTS = [
  // 油系（EPA+DHAを反映させる）
  { name: "Fish Oil",              protein: 0,   fat: 100, carbs: 0, calories: 884, fiber: 0, calcium: 0,     phosphorus: 0,     omega3: 20.0 },
  { name: "Salmon Oil",            protein: 0,   fat: 100, carbs: 0, calories: 884, fiber: 0, calcium: 0,     phosphorus: 0,     omega3: 18.0 },

  // カルシウム系
  { name: "Eggshell Powder",       protein: 0,   fat: 0,   carbs: 0, calories: 0,   fiber: 0, calcium: 37.0, phosphorus: 0.0,   omega3: 0.0 },

  // 貝/ムール貝由来（関節など）
  { name: "Green-Lipped Mussel (powder)", protein: 56, fat: 5,   carbs: 17, calories: 380, fiber: 5, calcium: 1.0, phosphorus: 0.8, omega3: 2.0 },

  // 種子系（ALA中心）
  { name: "Flaxseed (ground)",     protein: 18,  fat: 42, carbs: 29, calories: 534, fiber: 27, calcium: 0.255, phosphorus: 0.642, omega3: 22.8 },

  // ビタミンEキャリア（目安）
  { name: "Vitamin E Oil (carrier)", protein: 0, fat: 100, carbs: 0, calories: 884, fiber: 0, calcium: 0, phosphorus: 0, omega3: 0 },

  // 乳酸菌（栄養寄与は少ないが便宜上0扱い）
  { name: "Probiotic (capsule)",   protein: 0,   fat: 0,   carbs: 0, calories: 0,   fiber: 0, calcium: 0,     phosphorus: 0,     omega3: 0 },
];
