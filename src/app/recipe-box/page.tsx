"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import MasonryGrid from "@/components/MasonryGrid";
import RecipeCard from "@/components/RecipeCard";
import { RecipePreview } from "@/lib/types";

export default function RecipeBoxPage() {
  const { address, isConnected } = useAccount();

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
        <div className="press-card inline-block p-[60px_30px]">
          <div className="w-14 h-14 mx-auto mb-[18px] rounded-[4px] bg-accent/10 grid place-items-center text-accent">
            <svg className="w-[26px] h-[26px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16 14h2" />
            </svg>
          </div>
          <h1 className="display text-2xl mb-2">Your Recipe Box</h1>
          <p className="text-ink-3 text-[15px] max-w-[380px] mx-auto mb-[22px] leading-relaxed">
            Connect your wallet to see recipes you&apos;ve unlocked. Full access, forever.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-7">
        <h1 className="display text-[clamp(34px,5vw,48px)] mb-1.5">Your Recipe Box</h1>
        <p className="text-ink-3 text-[17px]">Everything you&apos;ve unlocked, in one place.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="press-card overflow-hidden animate-pulse"
            >
              <div className="bg-paper-2" style={{ height: `${180 + (i % 3) * 60}px` }} />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-paper-2 rounded-[3px] w-1/3" />
                <div className="h-4 bg-paper-2 rounded-[3px] w-3/4" />
                <div className="h-3 bg-paper-2 rounded-[3px] w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="press-card p-[60px_30px] text-center">
          <div className="w-14 h-14 mx-auto mb-[18px] rounded-[4px] bg-accent/10 grid place-items-center text-accent">
            <svg className="w-[26px] h-[26px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 017-2.5" />
            </svg>
          </div>
          <h3 className="display text-2xl mb-2">No unlocked recipes yet</h3>
          <p className="text-ink-3 text-[15px] max-w-[380px] mx-auto mb-[22px] leading-relaxed">
            Unlock a recipe for a few cents and it&apos;ll live here forever.
          </p>
          <Link href="/" className="btn-ink inline-flex items-center gap-2 px-5 py-2.5 text-sm">
            Browse recipes
            <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
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
