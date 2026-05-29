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

  const metaItems = [
    { label: "Prep", value: `${prepTime} min` },
    { label: "Cook", value: `${cookTime} min` },
    { label: "Serves", value: String(servings) },
    { label: "Level", value: difficulty },
  ];

  return (
    <div className="space-y-0">
      {/* Meta bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-ink/15 border border-ink/15 rounded-[4px] overflow-hidden">
        {metaItems.map(({ label, value }) => (
          <div key={label} className="bg-card p-3.5 text-center">
            <div className="flex justify-center mb-1.5 text-accent">
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                {label === "Prep" && <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>}
                {label === "Cook" && <path d="M12 3c1 3 4 4 4 8a4 4 0 11-8 0c0-2 1-3 2-4 0 2 2 2 2 4" />}
                {label === "Serves" && <><circle cx="9" cy="9" r="3" /><path d="M3 19a6 6 0 0112 0M16 7a3 3 0 010 6M21 19a6 6 0 00-4-5.6" /></>}
                {label === "Level" && <path d="M13 3L5 13h6l-1 8 8-10h-6z" />}
              </svg>
            </div>
            <div className="font-mono text-[10px] text-ink-4 uppercase tracking-[0.1em]">{label}</div>
            <div className="text-[14px] font-semibold mt-0.5 capitalize">{value}</div>
          </div>
        ))}
      </div>

      {/* Ingredients */}
      <h2 className="display text-[30px] mt-11 mb-[18px]">Ingredients</h2>
      <ul className="flex flex-col gap-0.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {ingredients.map((ingredient, i) => (
          <li key={i}>
            <button
              onClick={() => toggleIngredient(i)}
              className="flex items-center gap-3 w-full text-left py-[11px] px-1.5 border-b border-ink/15 transition-colors"
              style={{
                color: checked.has(i) ? "var(--color-ink-4)" : "var(--color-ink)",
                textDecoration: checked.has(i) ? "line-through" : "none",
              }}
            >
              <span
                className="w-5 h-5 rounded-[3px] flex-none grid place-items-center border-[1.5px] transition-all"
                style={{
                  borderColor: checked.has(i) ? "var(--color-accent)" : "var(--color-ink-4)",
                  background: checked.has(i) ? "var(--color-accent)" : "transparent",
                  color: "var(--color-accent-ink)",
                }}
              >
                {checked.has(i) && (
                  <svg className="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4 10-11" />
                  </svg>
                )}
              </span>
              <span className="text-[16px] font-sans">{ingredient}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Method */}
      <h2 className="display text-[30px] mt-11 mb-[22px]">Method</h2>
      <ol className="flex flex-col gap-6" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {steps.map((step, i) => (
          <li key={i} className="flex gap-[18px] items-start">
            <span className="display text-[26px] text-accent leading-none min-w-[30px]">{i + 1}</span>
            <p className="text-[16.5px] leading-[1.65] text-ink m-0">{step}</p>
          </li>
        ))}
      </ol>

      {/* Cook's note */}
      {notes && (
        <div className="mt-9 p-5 rounded-[4px] bg-accent/5 border border-accent/20">
          <span className="eyebrow mb-2 block" style={{ color: "var(--color-accent)" }}>Cook&apos;s note</span>
          <p className="text-[15.5px] leading-relaxed text-ink-2 m-0">{notes}</p>
        </div>
      )}
    </div>
  );
}
