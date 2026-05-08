"use client";

import { useEffect, useState, useCallback } from "react";
import MasonryGrid from "@/components/MasonryGrid";
import RecipeCard from "@/components/RecipeCard";
import SearchBar, { SearchFilters } from "@/components/SearchBar";
import { RecipePreview } from "@/lib/types";

export default function Home() {
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async (filters?: SearchFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.query) params.set("search", filters.query);
      if (filters?.cuisine) params.set("cuisine", filters.cuisine);
      if (filters?.mealType) params.set("mealType", filters.mealType);
      if (filters?.dietary?.length) {
        params.set("dietary", filters.dietary.join(","));
      }
      const qs = params.toString();
      const res = await fetch(`/api/recipes${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch {
      // API not available yet - that's fine for the frontend MVP
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-4 pt-16 pb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Discover recipes
          <br />
          <span className="text-amber-500">worth paying for.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          No subscriptions. Just great food. Creators get paid directly for
          every recipe you unlock.
        </p>
      </section>

      {/* Search + Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-8">
          <SearchBar onChange={fetchRecipes} />
        </div>

        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 break-inside-avoid bg-gray-900 rounded-xl overflow-hidden border border-gray-800/50 animate-pulse"
              >
                <div
                  className="bg-gray-800"
                  style={{ height: `${180 + (i % 3) * 60}px` }}
                />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-gray-800 rounded w-1/3" />
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No recipes found.</p>
            <p className="text-gray-600 text-sm mt-1">
              Try adjusting your filters or check back later.
            </p>
          </div>
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
      </section>
    </div>
  );
}
