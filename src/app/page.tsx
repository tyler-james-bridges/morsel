"use client";

import { useEffect, useState, useCallback } from "react";
import EmailCapture from "@/components/EmailCapture";
import FeedTabs from "@/components/FeedTabs";
import RecipeFeedCard from "@/components/RecipeFeedCard";
import CreatorSidebar from "@/components/CreatorSidebar";

type FeedTab = "featured" | "latest" | "trending";

interface FeedRecipe {
  id: string;
  creatorAddress: string;
  creatorName: string;
  creatorAvatarUrl: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  cuisine: string;
  mealType: string;
  dietaryTags: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  unlockCount: number;
  createdAt: string;
}

interface FeedResponse {
  recipes: FeedRecipe[];
  nextCursor: string | null;
}

export default function Home() {
  const [tab, setTab] = useState<FeedTab>("featured");
  const [recipes, setRecipes] = useState<FeedRecipe[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(
    async (feedTab: FeedTab, feedCursor?: string | null) => {
      const params = new URLSearchParams({ tab: feedTab, limit: "10" });
      if (feedCursor) params.set("cursor", feedCursor);

      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) return { recipes: [], nextCursor: null } as FeedResponse;
      return res.json() as Promise<FeedResponse>;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchFeed(tab);
        if (!cancelled) {
          setRecipes(data.recipes);
          setCursor(data.nextCursor);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [tab, fetchFeed]);

  function handleTabChange(newTab: FeedTab) {
    if (newTab !== tab) {
      setLoading(true);
      setRecipes([]);
      setCursor(null);
      setTab(newTab);
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchFeed(tab, cursor);
      setRecipes((prev) => [...prev, ...data.recipes]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero - Email Capture */}
      <EmailCapture />

      {/* Feed layout */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="lg:flex lg:gap-8">
          {/* Main feed column */}
          <div className="flex-1 min-w-0">
            <FeedTabs activeTab={tab} onTabChange={handleTabChange} />

            <div className="mt-6 space-y-6">
              {loading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800/50 animate-pulse"
                    >
                      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                        <div className="w-9 h-9 rounded-full bg-gray-800" />
                        <div className="h-3 bg-gray-800 rounded w-24" />
                      </div>
                      <div className="w-full aspect-[16/9] bg-gray-800" />
                      <div className="px-5 py-4 space-y-3">
                        <div className="h-5 bg-gray-800 rounded w-3/4" />
                        <div className="h-3 bg-gray-800 rounded w-full" />
                        <div className="h-3 bg-gray-800 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </>
              ) : recipes.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-lg">No recipes yet.</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Check back soon for new content.
                  </p>
                </div>
              ) : (
                <>
                  {recipes.map((recipe) => (
                    <RecipeFeedCard
                      key={recipe.id}
                      id={recipe.id}
                      title={recipe.title}
                      description={recipe.description}
                      imageUrl={recipe.imageUrl}
                      price={recipe.price}
                      creatorName={recipe.creatorName}
                      creatorAvatarUrl={recipe.creatorAvatarUrl}
                      creatorAddress={recipe.creatorAddress}
                      cuisine={recipe.cuisine}
                      difficulty={recipe.difficulty}
                      prepTime={recipe.prepTime}
                      cookTime={recipe.cookTime}
                      unlockCount={recipe.unlockCount}
                    />
                  ))}

                  {cursor && (
                    <div className="text-center pt-4">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? "Loading..." : "Load more"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar - desktop only */}
          <aside className="hidden lg:block w-72 flex-shrink-0 mt-12">
            <div className="sticky top-24">
              <CreatorSidebar />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
