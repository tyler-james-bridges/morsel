"use client";

import { useState } from "react";

interface RecipeContentProps {
  ingredients: string[];
  steps: string[];
  notes?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
}

export default function RecipeContent({
  ingredients,
  steps,
  notes,
  prepTime,
  cookTime,
  servings,
  difficulty,
}: RecipeContentProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggleIngredient(index: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Prep", value: `${prepTime}m` },
          { label: "Cook", value: `${cookTime}m` },
          { label: "Servings", value: String(servings) },
          { label: "Difficulty", value: difficulty },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-gray-900 rounded-lg p-3 text-center border border-gray-800/50"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="text-sm font-medium text-gray-200 capitalize">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-4">
          Ingredients
        </h2>
        <ul className="space-y-2">
          {ingredients.map((ingredient, i) => (
            <li key={i} className="flex items-start gap-3">
              <button
                onClick={() => toggleIngredient(i)}
                className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  checked.has(i)
                    ? "bg-amber-500 border-amber-500"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              >
                {checked.has(i) && (
                  <svg
                    className="w-3 h-3 text-gray-950"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
              <span
                className={`text-sm transition-colors ${
                  checked.has(i)
                    ? "text-gray-500 line-through"
                    : "text-gray-300"
                }`}
              >
                {ingredient}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Steps</h2>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {notes && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-amber-400 mb-2">Notes</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}
