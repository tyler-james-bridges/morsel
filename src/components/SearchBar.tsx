"use client";

import { useState } from "react";

const CUISINES = [
  "italian",
  "mexican",
  "japanese",
  "indian",
  "thai",
  "french",
  "american",
  "mediterranean",
  "chinese",
  "korean",
] as const;

const MEAL_TYPES = [
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snack",
  "drink",
] as const;

const DIETARY = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "dairy-free",
  "keto",
  "paleo",
  "nut-free",
] as const;

export interface SearchFilters {
  query: string;
  cuisine: string;
  mealType: string;
  dietary: string[];
}

interface SearchBarProps {
  onChange: (filters: SearchFilters) => void;
}

export default function SearchBar({ onChange }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [mealType, setMealType] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  function update(patch: Partial<SearchFilters>) {
    const next = {
      query: patch.query ?? query,
      cuisine: patch.cuisine ?? cuisine,
      mealType: patch.mealType ?? mealType,
      dietary: patch.dietary ?? dietary,
    };
    onChange(next);
  }

  function toggleDietary(tag: string) {
    const next = dietary.includes(tag)
      ? dietary.filter((d) => d !== tag)
      : [...dietary, tag];
    setDietary(next);
    update({ dietary: next });
  }

  function clearAll() {
    setQuery("");
    setCuisine("");
    setMealType("");
    setDietary([]);
    onChange({ query: "", cuisine: "", mealType: "", dietary: [] });
  }

  const hasFilters = cuisine || mealType || dietary.length > 0;

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search recipes..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              update({ query: e.target.value });
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 text-sm transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showFilters || hasFilters
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200"
          }`}
        >
          Filters{hasFilters ? ` (${(cuisine ? 1 : 0) + (mealType ? 1 : 0) + dietary.length})` : ""}
        </button>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Cuisine
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    const next = cuisine === c ? "" : c;
                    setCuisine(next);
                    update({ cuisine: next });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                    cuisine === c
                      ? "bg-amber-500 text-gray-950"
                      : "bg-gray-800 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Meal Type
            </label>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    const next = mealType === m ? "" : m;
                    setMealType(next);
                    update({ mealType: next });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                    mealType === m
                      ? "bg-amber-500 text-gray-950"
                      : "bg-gray-800 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Dietary
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDietary(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                    dietary.includes(d)
                      ? "bg-amber-500 text-gray-950"
                      : "bg-gray-800 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
