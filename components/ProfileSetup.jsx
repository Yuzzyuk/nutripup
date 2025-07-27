// components/ProfileSetup.jsx
"use client";
import React from "react";

const breeds = [
  "Golden Retriever","Labrador Retriever","German Shepherd","French Bulldog",
  "Bulldog","Poodle","Beagle","Rottweiler","Yorkshire Terrier","Dachshund",
  "Siberian Husky","Boxer","Border Collie","Australian Shepherd","Shih Tzu","Shiba",
];

const healthFocusOptions = [
  { id: "skin",    label: "Skin & Coat Health", icon: "✨" },
  { id: "joints",  label: "Joint Support",      icon: "🦴" },
  { id: "kidneys", label: "Kidney Health",      icon: "💧" },
  { id: "digestion", label: "Digestive Health", icon: "🌿" },
  { id: "weight",  label: "Weight Management",  icon: "⚖️" },
  { id: "energy",  label: "Energy & Vitality",  icon: "⚡" },
];

export default function ProfileSetup({ dogProfile = {}, setDogProfile, onContinue }) {
  const safe = {
    id: dogProfile.id || "",
    name: dogProfile.name ?? "",
    age: dogProfile.age ?? "",
    breed: dogProfile.breed ?? "",
    weight: dogProfile.weight ?? "",
    weightUnit: dogProfile.weightUnit || "kg",
    activityLevel: dogProfile.activityLevel || "Moderate",
    healthFocus: Array.isArray(dogProfile.healthFocus) ? dogProfile.healthFocus : [],
  };

  const update = (patch) => setDogProfile && setDogProfile({ ...safe, ...patch });
  const canContinue = safe.name && safe.age !== "" && safe.weight !== "" && safe.breed;

  return (
    <div className="card space-y-6">
      <div className="text-center">
        <div className="text-[48px] mb-2">🐕</div>
        <h2 className="text-2xl font-bold">Welcome to NutriPup</h2>
        <p className="text-sm text-gray-500">Let's create your dog's profile</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
            value={safe.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g., Momo"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
            <input
              type="number"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
              value={safe.age}
              onChange={(e) => update({ age: e.target.value })}
              placeholder="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight ({safe.weightUnit})</label>
            <input
              type="number"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
              value={safe.weight}
              onChange={(e) => update({ weight: e.target.value })}
              placeholder="10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <select
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
            value={safe.breed}
            onChange={(e) => update({ breed: e.target.value })}
          >
            <option value="">Select a breed</option>
            {breeds.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
          <div className="flex space-x-3">
            {['Low','Moderate','High'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => update({ activityLevel: lvl })}
                className={
                  `flex-1 py-2 rounded-lg text-sm font-medium border 
                  ${safe.activityLevel === lvl ? 'bg-moss text-white border-moss' : 'bg-sand text-gray-700 border-transparent'}
                `}
                type="button"
              >{lvl}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Health Focus (optional)</label>
          <div className="grid grid-cols-3 gap-2">
            {healthFocusOptions.map((opt) => {
              const selected = safe.healthFocus.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const next = selected
                      ? safe.healthFocus.filter(f => f !== opt.id)
                      : [...safe.healthFocus, opt.id];
                    update({ healthFocus: next });
                  }}
                  className={
                    `flex items-center space-x-1 py-2 px-3 rounded-lg text-sm 
                    ${selected ? 'bg-moss text-white' : 'bg-sand text-gray-700'}
                  `}
                  type="button"
                >
                  <span>{opt.icon}</span><span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onContinue && onContinue()}
          disabled={!canContinue}
          className={
            `px-6 py-3 rounded-lg font-semibold focus:outline-none 
            ${canContinue ? 'bg-moss text-white hover:bg-moss/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`
          }
        >Continue</button>
      </div>
    </div>
  );
}
