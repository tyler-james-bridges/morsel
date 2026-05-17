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
          const fullRes = await fetch(`/api/recipes/${data.id}/full`);
          if (!cancelled) {
            if (fullRes.ok) {
              setFullContent(await fullRes.json());
              setLocked(false);
            } else {
              setLocked(true);
            }
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
          <div className="w-10 h-10 rounded-full bg-gray-900" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-900 rounded w-24" />
            <div className="h-2 bg-gray-900 rounded w-16" />
          </div>
        </div>
        <div className="h-8 bg-gray-900 rounded w-3/4 mb-4" />
        <div className="h-64 bg-gray-900 rounded-xl mb-8" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-900 rounded w-full" />
          <div className="h-4 bg-gray-900 rounded w-5/6" />
          <div className="h-4 bg-gray-900 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
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

  const publishDate = new Date(recipe.publishedAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <article className="max-w-2xl mx-auto px-4 py-8">
      {/* Creator byline */}
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/creator/${recipe.creator.address}`}>
          {recipe.creator.avatarUrl ? (
            <img
              src={recipe.creator.avatarUrl}
              alt={recipe.creator.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <span className="text-amber-500 text-sm font-bold">
                {recipe.creator.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>
        <div>
          <Link
            href={`/creator/${recipe.creator.address}`}
            className="text-sm font-medium text-gray-200 hover:text-amber-500 transition-colors"
          >
            {recipe.creator.name}
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <time>{publishDate}</time>
            <span>-</span>
            <span>{totalTime} min read</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 leading-tight mb-4">
        {recipe.title}
      </h1>

      {/* Subtitle / description */}
      <p className="text-lg text-gray-400 mb-8 leading-relaxed">
        {recipe.description}
      </p>

      {/* Hero image */}
      <div className="relative rounded-xl overflow-hidden mb-10">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-64 sm:h-96 object-cover"
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-900 text-gray-400 border border-gray-800/50 capitalize">
          {recipe.cuisine}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-900 text-gray-400 border border-gray-800/50 capitalize">
          {recipe.mealType}
        </span>
        {recipe.dietaryTags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full bg-gray-900 text-gray-400 border border-gray-800/50 capitalize"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Intro content - always visible */}
      {recipe.introContent && (
        <div className="mb-10">
          <IntroContent content={recipe.introContent} />
        </div>
      )}

      {/* Divider / paywall boundary */}
      {locked && (
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-950 px-4 text-sm text-gray-500">
              Continue reading for the full recipe
            </span>
          </div>
        </div>
      )}

      {/* Content or Paywall */}
      <div>
        {locked ? (
          <PaywallOverlay
            price={recipe.price}
            creatorName={recipe.creator.name}
            recipeTitle={recipe.title}
            recipeId={recipe.id}
            onUnlocked={handleUnlocked}
          />
        ) : fullContent ? (
          <div className="border-t border-gray-800/50 pt-8">
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

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-800/50">
        <div className="flex items-center gap-3">
          <Link href={`/creator/${recipe.creator.address}`}>
            {recipe.creator.avatarUrl ? (
              <img
                src={recipe.creator.avatarUrl}
                alt={recipe.creator.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <span className="text-amber-500 font-bold">
                  {recipe.creator.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/creator/${recipe.creator.address}`}
              className="text-sm font-medium text-gray-200 hover:text-amber-500 transition-colors"
            >
              {recipe.creator.name}
            </Link>
            {recipe.creator.bio && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {recipe.creator.bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
