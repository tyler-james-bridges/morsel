"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAccount, useConnect } from "wagmi";

const CUISINES = [
  "italian", "mexican", "japanese", "indian", "thai",
  "french", "american", "mediterranean", "chinese", "korean",
];

const MEAL_TYPES = [
  "breakfast", "lunch", "dinner", "dessert", "snack", "drink",
];

const DIETARY = [
  "vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "paleo", "nut-free",
];

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function PublishPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("0.50");
  const [cuisine, setCuisine] = useState("american");
  const [mealType, setMealType] = useState("dinner");
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState("15");
  const [cookTime, setCookTime] = useState("30");
  const [servings, setServings] = useState("4");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [creatorName, setCreatorName] = useState("");

  function toggleDietary(tag: string) {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((d) => d !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/recipes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          price: `$${price}`,
          cuisine,
          mealType,
          dietaryTags,
          prepTime: parseInt(prepTime),
          cookTime: parseInt(cookTime),
          servings: parseInt(servings),
          difficulty,
          ingredients: ingredients.split("\n").filter(Boolean),
          steps: steps.split("\n").filter(Boolean),
          notes: notes || undefined,
          creatorAddress: address,
          creatorName: creatorName || undefined,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // API not available
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-3">
          Recipe Published
        </h1>
        <p className="text-gray-400 mb-6">
          Your recipe is now live and ready to be discovered.
        </p>
        <Link
          href="/"
          className="text-amber-500 hover:text-amber-400 text-sm transition-colors"
        >
          Back to browse
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 text-sm transition-colors";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider";

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-100 mb-3">
          Publish a Recipe
        </h1>
        <p className="text-gray-400 mb-6">
          Connect your wallet to publish recipes and get paid directly.
        </p>
        <button
          onClick={() => {
            const connector = connectors[0];
            if (connector) connect({ connector });
          }}
          className="px-6 py-3 rounded-lg bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 transition-colors text-sm"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">
        Publish a Recipe
      </h1>
      <p className="text-sm text-gray-500 mb-2">
        Share your creation with the world. Set your price and get paid
        directly for every unlock.
      </p>
      <p className="text-xs text-gray-600 font-mono mb-8">
        Publishing as {address?.slice(0, 6)}...{address?.slice(-4)}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Creator name */}
        <div>
          <label className={labelClass}>Display Name</label>
          <input
            type="text"
            placeholder="Chef Tyler"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Title + Price row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Title</label>
            <input
              type="text"
              placeholder="Grandma's Famous Pasta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Price (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${inputClass} pl-7`}
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            placeholder="A brief description of your recipe..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {/* Image URL */}
        <div>
          <label className={labelClass}>Image URL</label>
          <input
            type="url"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {/* Cuisine + Meal Type + Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Cuisine</label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className={inputClass}
            >
              {CUISINES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Meal Type</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className={inputClass}
            >
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "easy" | "medium" | "hard")
              }
              className={inputClass}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dietary tags */}
        <div>
          <label className={labelClass}>Dietary Tags</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDietary(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                  dietaryTags.includes(d)
                    ? "bg-amber-500 text-gray-950"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Prep / Cook / Servings */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Prep (min)</label>
            <input
              type="number"
              min="0"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Cook (min)</label>
            <input
              type="number"
              min="0"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Servings</label>
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label className={labelClass}>Ingredients (one per line)</label>
          <textarea
            rows={8}
            placeholder={"2 cups all-purpose flour\n1 tsp salt\n3 large eggs\n..."}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className={`${inputClass} font-mono text-xs`}
            required
          />
        </div>

        {/* Steps */}
        <div>
          <label className={labelClass}>Steps (one per line)</label>
          <textarea
            rows={8}
            placeholder={"Preheat oven to 375F.\nMix dry ingredients in a large bowl.\nAdd eggs and combine until smooth.\n..."}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            className={`${inputClass} font-mono text-xs`}
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            rows={3}
            placeholder="Any tips, substitutions, or serving suggestions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Publishing..." : "Publish Recipe"}
        </button>
      </form>
    </div>
  );
}
