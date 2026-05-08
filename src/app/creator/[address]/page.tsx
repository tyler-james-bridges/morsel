"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MasonryGrid from "@/components/MasonryGrid";
import RecipeCard from "@/components/RecipeCard";
import { Creator, RecipePreview } from "@/lib/types";

export default function CreatorPage() {
  const params = useParams();
  const address = params.address as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/creators/${address}`);
        if (res.ok) {
          const data = await res.json();
          setCreator(data.creator);
          setRecipes(data.recipes || []);
        }
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [address]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-6 mb-12 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-gray-900" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-900 rounded w-48" />
            <div className="h-4 bg-gray-900 rounded w-72" />
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">Creator not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Creator header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
        <img
          src={creator.avatarUrl}
          alt={creator.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-gray-800"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-100">{creator.name}</h1>
          <p className="text-sm text-gray-400 mt-1 max-w-lg">{creator.bio}</p>
          <p className="text-xs text-gray-600 mt-2 font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800/50 text-center">
          <p className="text-2xl font-bold text-gray-100">
            {creator.recipeCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">Recipes</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800/50 text-center">
          <p className="text-2xl font-bold text-gray-100">
            {recipes.reduce((sum, r) => sum + r.unlockCount, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total Unlocks</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800/50 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-amber-500">
            {creator.totalEarned}
          </p>
          <p className="text-xs text-gray-500 mt-1">Earned</p>
        </div>
      </div>

      {/* Recipes grid */}
      {recipes.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No recipes published yet.
        </p>
      ) : (
        <MasonryGrid>
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              description={recipe.description}
              imageUrl={recipe.imageUrl}
              price={recipe.price}
              creatorName={recipe.creatorName}
              cuisine={recipe.cuisine}
              difficulty={recipe.difficulty}
              prepTime={recipe.prepTime}
              cookTime={recipe.cookTime}
              servings={recipe.servings}
              unlockCount={recipe.unlockCount}
            />
          ))}
        </MasonryGrid>
      )}
    </div>
  );
}
