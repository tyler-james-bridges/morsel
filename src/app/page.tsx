"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import FeedTabs from "@/components/FeedTabs";
import RecipeFeedCard from "@/components/RecipeFeedCard";
import CreatorSidebar from "@/components/CreatorSidebar";
import SearchBar, { SearchFilters } from "@/components/SearchBar";

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
  const [filters, setFilters] = useState<SearchFilters>({ query: "", cuisine: "", mealType: "", dietary: [] });

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

  // Client-side filter the loaded recipes
  const filtered = recipes.filter((r) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      if (
        !r.title.toLowerCase().includes(q) &&
        !r.cuisine.toLowerCase().includes(q) &&
        !r.creatorName.toLowerCase().includes(q) &&
        !r.description.toLowerCase().includes(q)
      ) return false;
    }
    if (filters.cuisine && r.cuisine.toLowerCase() !== filters.cuisine.toLowerCase()) return false;
    if (filters.mealType && r.mealType.toLowerCase() !== filters.mealType.toLowerCase()) return false;
    if (filters.dietary.length > 0) {
      const tags = r.dietaryTags.map((t) => t.toLowerCase());
      if (!filters.dietary.every((d) => tags.includes(d.toLowerCase()))) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Hero — editorial masthead */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[30px] pb-11">
        {/* Issue line */}
        <div className="flex justify-between items-center border-b-2 border-ink pb-2.5 mb-9 flex-wrap gap-2">
          <span className="font-mono text-[11.5px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap">
            The Onchain Recipe Press
          </span>
          <span className="font-mono text-[11.5px] text-ink-3 whitespace-nowrap">
            USDC on Base &middot; Est. 2026
          </span>
        </div>

        <div className="max-w-3xl">
          <h1 className="display display-tight text-[clamp(46px,7.5vw,92px)] mb-[26px] leading-[0.9]">
            Recipes worth{" "}
            <span className="knockout">paying</span>{" "}
            for.
          </h1>
          <p className="text-[18.5px] text-ink-2 max-w-[480px] mb-[30px] leading-relaxed">
            A marketplace where great cooks publish their best work and get paid directly — a few cents in USDC, no subscription, no ads. Read by people{" "}
            <span className="text-ink font-semibold">and</span> machines.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-ink px-6 py-3 text-[15px] inline-flex items-center gap-2"
            >
              Start browsing
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <Link
              href="/publish"
              className="px-6 py-3 rounded-[4px] border-[1.5px] border-ink/30 text-[15px] font-bold text-ink hover:border-ink transition-colors"
            >
              Publish a recipe
            </Link>
          </div>
        </div>
      </section>

      {/* Feed layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20" id="feed" style={{ scrollMarginTop: 80 }}>
        <div className="mb-[22px]">
          <SearchBar onChange={setFilters} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_312px] gap-10">
          {/* Main feed column */}
          <div className="min-w-0">
            <FeedTabs activeTab={tab} onTabChange={handleTabChange} />

            <div className="mt-6 flex flex-col gap-[22px]">
              {loading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="press-card overflow-hidden animate-pulse"
                    >
                      <div className="flex items-center gap-3 px-[18px] pt-3.5 pb-3">
                        <div className="w-[30px] h-[30px] rounded-[3px] bg-paper-2" />
                        <div className="h-3 bg-paper-2 rounded-[3px] w-24" />
                      </div>
                      <div className="w-full aspect-[16/9] bg-paper-2" />
                      <div className="px-[18px] py-4 space-y-3">
                        <div className="h-5 bg-paper-2 rounded-[3px] w-3/4" />
                        <div className="h-3 bg-paper-2 rounded-[3px] w-full" />
                        <div className="h-3 bg-paper-2 rounded-[3px] w-2/3" />
                      </div>
                    </div>
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="display text-2xl mb-2.5">Nothing matches that.</p>
                  <button
                    onClick={() => setFilters({ query: "", cuisine: "", mealType: "", dietary: [] })}
                    className="text-sm text-ink-3 hover:text-ink transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  {filtered.map((recipe, i) => (
                    <div
                      key={recipe.id}
                      style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
                    >
                      <RecipeFeedCard
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
                    </div>
                  ))}

                  {cursor && (
                    <div className="text-center pt-4">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2.5 rounded-[4px] border-[1.5px] border-ink/30 text-ink-2 text-sm font-medium hover:border-ink hover:text-ink transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? "Loading..." : "Load more"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-[86px]">
              <CreatorSidebar />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
