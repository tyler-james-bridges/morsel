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
  const activeCount = (cuisine ? 1 : 0) + (mealType ? 1 : 0) + dietary.length;

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="7" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-4-4" />
          </svg>
          <input
            type="text"
            placeholder="Search recipes, creators, cuisines..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              update({ query: e.target.value });
            }}
            className="w-full pl-11 pr-4 h-12 rounded-[4px] bg-card border-[1.5px] border-ink/30 text-ink placeholder-ink-4 focus:outline-none focus:border-ink text-[15px] font-sans transition-colors"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); update({ query: "" }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-12 px-4 rounded-[4px] border-[1.5px] text-sm font-medium transition-colors ${
            showFilters || hasFilters
              ? "border-accent text-accent bg-accent/5"
              : "border-ink/30 text-ink-2 hover:border-ink hover:text-ink"
          }`}
        >
          Filters{hasFilters ? ` (${activeCount})` : ""}
        </button>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="h-12 px-3 text-sm text-ink-3 hover:text-ink transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="space-y-4 p-4 bg-card-2 rounded-[4px] border-[1.5px] border-ink/15">
          <div>
            <span className="eyebrow mb-2.5 block">Cuisine</span>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    const next = cuisine === c ? "" : c;
                    setCuisine(next);
                    update({ cuisine: next });
                  }}
                  className={`px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-colors capitalize border-[1.5px] ${
                    cuisine === c
                      ? "bg-accent text-accent-ink border-ink"
                      : "bg-card border-ink/30 text-ink-2 hover:border-ink hover:text-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="eyebrow mb-2.5 block">Meal Type</span>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    const next = mealType === m ? "" : m;
                    setMealType(next);
                    update({ mealType: next });
                  }}
                  className={`px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-colors capitalize border-[1.5px] ${
                    mealType === m
                      ? "bg-accent text-accent-ink border-ink"
                      : "bg-card border-ink/30 text-ink-2 hover:border-ink hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="eyebrow mb-2.5 block">Dietary</span>
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDietary(d)}
                  className={`px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-colors capitalize border-[1.5px] ${
                    dietary.includes(d)
                      ? "bg-accent text-accent-ink border-ink"
                      : "bg-card border-ink/30 text-ink-2 hover:border-ink hover:text-ink"
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
