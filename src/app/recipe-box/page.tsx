"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useConnect } from "wagmi";
import MasonryGrid from "@/components/MasonryGrid";
import RecipeCard from "@/components/RecipeCard";
import { RecipePreview } from "@/lib/types";

export default function RecipeBoxPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipe-box?address=${address}`);
        if (res.ok) {
          setRecipes(await res.json());
        }
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [address]);

  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-3">
          Your Recipe Box
        </h1>
        <p className="text-gray-400 mb-6">
          Connect your wallet to see recipes you have unlocked.
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          Your Recipe Box
        </h1>
        <p className="text-sm text-gray-500">
          Recipes you have unlocked. Full access, forever.
        </p>
      </div>

      {loading ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          <p className="text-gray-500 text-lg mb-2">No recipes yet.</p>
          <p className="text-gray-600 text-sm">
            Browse recipes and unlock your first one to start your collection.
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
    </div>
  );
}
