"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RecipeContent from "@/components/RecipeContent";
import PaywallOverlay from "@/components/PaywallOverlay";
import { Recipe, RecipePreview } from "@/lib/types";

export default function RecipePage() {
  const params = useParams();
  const id = params.id as string;

  const [preview, setPreview] = useState<RecipePreview | null>(null);
  const [fullRecipe, setFullRecipe] = useState<Recipe | null>(null);
  const [locked, setLocked] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      try {
        // Fetch preview
        const previewRes = await fetch(`/api/recipes/${id}`);
        if (previewRes.ok) {
          setPreview(await previewRes.json());
        }

        // Try to fetch full content (will 402 if not paid)
        const fullRes = await fetch(`/api/recipes/${id}/full`);
        if (fullRes.ok) {
          setFullRecipe(await fullRes.json());
          setLocked(false);
        } else {
          setLocked(true);
        }
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function handleUnlock() {
    // For MVP, open the x402 endpoint in a new tab
    window.open(`/api/recipes/${id}/full`, "_blank");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-80 bg-gray-900 rounded-xl mb-8" />
        <div className="h-8 bg-gray-900 rounded w-2/3 mb-4" />
        <div className="h-4 bg-gray-900 rounded w-1/3 mb-8" />
        <div className="space-y-3">
          <div className="h-3 bg-gray-900 rounded w-full" />
          <div className="h-3 bg-gray-900 rounded w-5/6" />
          <div className="h-3 bg-gray-900 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">Recipe not found.</p>
        <Link
          href="/"
          className="text-amber-500 hover:text-amber-400 text-sm mt-2 inline-block"
        >
          Back to browse
        </Link>
      </div>
    );
  }

  const difficultyColor = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Hero image */}
      <div className="relative rounded-2xl overflow-hidden mb-8">
        <img
          src={preview.imageUrl}
          alt={preview.title}
          className="w-full h-64 sm:h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-gray-950">
              {preview.price}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800/80 text-gray-300 capitalize">
              {preview.cuisine}
            </span>
            <span
              className={`text-xs capitalize ${difficultyColor[preview.difficulty]}`}
            >
              {preview.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Title + Meta */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2">
        {preview.title}
      </h1>
      <div className="flex items-center gap-4 mb-4">
        <Link
          href={`/creator/${preview.creatorAddress}`}
          className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
        >
          {preview.creatorName}
        </Link>
        <span className="text-xs text-gray-600">
          {preview.unlockCount} unlocks
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-8 leading-relaxed">
        {preview.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {preview.dietaryTags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full bg-gray-900 text-gray-400 border border-gray-800/50 capitalize"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Content or Paywall */}
      <div className="border-t border-gray-800/50 pt-8">
        {locked ? (
          <PaywallOverlay
            price={preview.price}
            creatorName={preview.creatorName}
            recipeTitle={preview.title}
            onUnlock={handleUnlock}
          />
        ) : fullRecipe?.ingredients && fullRecipe?.steps ? (
          <RecipeContent
            ingredients={fullRecipe.ingredients}
            steps={fullRecipe.steps}
            notes={fullRecipe.notes}
            prepTime={preview.prepTime}
            cookTime={preview.cookTime}
            servings={preview.servings}
            difficulty={preview.difficulty}
          />
        ) : null}
      </div>
    </div>
  );
}
