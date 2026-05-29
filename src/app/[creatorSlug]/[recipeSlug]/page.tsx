"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import IntroContent from "@/components/IntroContent";
import RecipeContent from "@/components/RecipeContent";
import PaywallOverlay from "@/components/PaywallOverlay";

interface CreatorInfo {
  address: string;
  name: string;
  bio: string;
  avatarUrl: string;
  slug: string;
  bannerUrl: string;
  socialLinks: Record<string, string>;
}

interface RecipeData {
  id: string;
  creatorAddress: string;
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
  slug: string;
  introContent: string;
  isFree: boolean;
  publishedAt: string;
  unlockCount: number;
  creator: CreatorInfo;
}

interface FullContent {
  ingredients: string[];
  steps: string[];
  notes?: string;
}

export default function RecipeArticlePage() {
  const params = useParams();
  const creatorSlug = params.creatorSlug as string;
  const recipeSlug = params.recipeSlug as string;

  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [fullContent, setFullContent] = useState<FullContent | null>(null);
  const [locked, setLocked] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!creatorSlug || !recipeSlug) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/recipes/by-slug/${creatorSlug}/${recipeSlug}`,
        );
        if (!res.ok || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) setRecipe(data);

        if (data.isFree) {
          const fullRes = await fetch(`/api/recipes/${data.id}/full`);
          if (!cancelled && fullRes.ok) {
            setFullContent(await fullRes.json());
            setLocked(false);
          }
        } else {
          if (!cancelled) {
            setLocked(true);
          }
        }
      } catch {
        // API unavailable
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [creatorSlug, recipeSlug]);

  function handleUnlocked(data: FullContent) {
    setFullContent(data);
    setLocked(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-[42px] h-[42px] rounded-[3px] bg-card-2" />
          <div className="space-y-2">
            <div className="h-3 bg-card-2 rounded-[3px] w-24" />
            <div className="h-2 bg-card-2 rounded-[3px] w-16" />
          </div>
        </div>
        <div className="h-8 bg-card-2 rounded-[3px] w-3/4 mb-4" />
        <div className="h-64 bg-card-2 rounded-[4px] mb-8" />
        <div className="space-y-3">
          <div className="h-4 bg-card-2 rounded-[3px] w-full" />
          <div className="h-4 bg-card-2 rounded-[3px] w-5/6" />
          <div className="h-4 bg-card-2 rounded-[3px] w-4/5" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="display text-[40px] mb-2">Not found</h1>
        <p className="text-ink-3 mb-4">That page seems to have been eaten.</p>
        <Link href="/" className="btn-ink inline-block px-5 py-2.5 text-sm">
          Back to browse
        </Link>
      </div>
    );
  }

  const publishDate = new Date(recipe.publishedAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <article className="max-w-2xl mx-auto px-4 py-10">
      {/* Creator byline */}
      <div className="flex items-center justify-between mb-[22px]">
        <Link href={`/${recipe.creator.slug}`} className="flex items-center gap-3 group">
          {recipe.creator.avatarUrl ? (
            <img
              src={recipe.creator.avatarUrl}
              alt={recipe.creator.name}
              className="w-[42px] h-[42px] rounded-[3px] object-cover"
            />
          ) : (
            <div className="w-[42px] h-[42px] rounded-[3px] bg-paper-2 grid place-items-center display text-lg text-ink-2">
              {recipe.creator.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-[15px] font-semibold group-hover:text-accent transition-colors">
              {recipe.creator.name}
            </div>
            <div className="font-mono text-[11.5px] text-ink-4 whitespace-nowrap">
              {publishDate}
            </div>
          </div>
        </Link>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="px-2.5 py-1 rounded-[3px] border-[1.5px] border-ink/30 text-[12.5px] font-semibold text-ink-2 capitalize">
          {recipe.cuisine}
        </span>
        <span className="px-2.5 py-1 rounded-[3px] border-[1.5px] border-ink/30 text-[12.5px] font-semibold text-ink-2 capitalize">
          {recipe.mealType}
        </span>
        {recipe.dietaryTags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-[3px] border-[1.5px] border-ink/30 text-[12.5px] font-semibold text-ink-2 capitalize"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <h1 className="display text-[clamp(34px,5vw,52px)] mb-4 leading-[1.05]">
        {recipe.title}
      </h1>

      {/* Subtitle */}
      <p className="text-[20px] text-ink-2 leading-[1.5] mb-7">
        {recipe.description}
      </p>

      {/* Hero image */}
      <div className="relative rounded-[4px] overflow-hidden mb-3.5">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full aspect-[16/9] object-cover"
        />
      </div>

      {/* Agent badge */}
      <div className="flex justify-end mb-9">
        <span className="agent-badge">
          <span className="diamond" />
          recipe_full &middot; {recipe.price}
        </span>
      </div>

      {/* Intro content — always visible */}
      {recipe.introContent && (
        <div className="mb-10">
          <IntroContent content={recipe.introContent} />
        </div>
      )}

      {/* Divider / paywall boundary */}
      {locked && (
        <div className="relative my-8 text-center">
          <div className="absolute top-1/2 left-0 right-0 border-t-[1.5px] border-ink/15" />
          <span className="relative bg-paper px-3.5 font-mono text-[11.5px] text-ink-4 uppercase tracking-[0.12em]">
            The full recipe
          </span>
        </div>
      )}

      {/* Content or Paywall */}
      <div className={locked ? "" : "mt-10"}>
        {locked ? (
          <PaywallOverlay
            price={recipe.price}
            creatorName={recipe.creator.name}
            recipeTitle={recipe.title}
            recipeId={recipe.id}
            onUnlocked={handleUnlocked}
          />
        ) : fullContent ? (
          <div className="border-t-[1.5px] border-ink/15 pt-8">
            <RecipeContent
              ingredients={fullContent.ingredients}
              steps={fullContent.steps}
              notes={fullContent.notes}
              prepTime={recipe.prepTime}
              cookTime={recipe.cookTime}
              servings={recipe.servings}
              difficulty={recipe.difficulty}
            />
          </div>
        ) : null}
      </div>

      {/* Creator footer */}
      <div className="border-t-[1.5px] border-ink/15 mt-12 pt-7">
        <Link href={`/${recipe.creator.slug}`} className="press-card block p-[22px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {recipe.creator.avatarUrl ? (
                <img
                  src={recipe.creator.avatarUrl}
                  alt={recipe.creator.name}
                  className="w-[52px] h-[52px] rounded-[3px] object-cover"
                />
              ) : (
                <div className="w-[52px] h-[52px] rounded-[3px] bg-paper-2 grid place-items-center display text-2xl text-ink-2">
                  {recipe.creator.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="display text-[19px]">{recipe.creator.name}</div>
                {recipe.creator.bio && (
                  <p className="text-[13.5px] text-ink-3 max-w-[360px] line-clamp-1">{recipe.creator.bio}</p>
                )}
              </div>
            </div>
            <span className="px-3 py-[5px] rounded-[3px] border-[1.5px] border-ink/30 text-[12.5px] font-medium text-ink-2 hover:border-ink hover:text-ink transition-colors shrink-0">
              View profile
            </span>
          </div>
        </Link>
      </div>
    </article>
  );
}
