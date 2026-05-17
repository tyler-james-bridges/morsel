"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CreatorHeader from "@/components/CreatorHeader";
import { RecipePreview } from "@/lib/types";

interface CreatorData {
  address: string;
  name: string;
  bio: string;
  avatarUrl: string;
  slug: string;
  bannerUrl: string;
  socialLinks: Record<string, string>;
  recipeCount: number;
  subscriberCount: number;
  totalEarned: string;
}

const difficultyColor: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

export default function CreatorSlugPage() {
  const params = useParams();
  const creatorSlug = params.creatorSlug as string;

  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [recipes, setRecipes] = useState<(RecipePreview & { slug: string; introContent: string; isFree: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!creatorSlug) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/creators/by-slug/${creatorSlug}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
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
  }, [creatorSlug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-48 sm:h-64 rounded-xl bg-gray-900 mb-8" />
          <div className="flex items-center gap-4 mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-900" />
            <div className="space-y-3">
              <div className="h-7 bg-gray-900 rounded w-48" />
              <div className="h-4 bg-gray-900 rounded w-72" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-900 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">Creator not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <CreatorHeader
        address={creator.address}
        name={creator.name}
        bio={creator.bio}
        avatarUrl={creator.avatarUrl}
        bannerUrl={creator.bannerUrl}
        subscriberCount={creator.subscriberCount}
        socialLinks={creator.socialLinks}
      />

      {/* Recipe Archive */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-100 mb-6">
          Recipes ({recipes.length})
        </h2>

        {recipes.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No recipes published yet.
          </p>
        ) : (
          <div className="space-y-4">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/${creatorSlug}/${recipe.slug}`}
                className="block group"
              >
                <article className="flex gap-4 sm:gap-6 p-4 rounded-xl bg-gray-900 border border-gray-800/50 transition-all hover:border-gray-700/50 hover:shadow-lg hover:shadow-amber-500/5">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 capitalize">
                        {recipe.cuisine}
                      </span>
                      <span className={`text-xs capitalize ${difficultyColor[recipe.difficulty] || "text-gray-400"}`}>
                        {recipe.difficulty}
                      </span>
                      {recipe.isFree && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          Free
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                      {recipe.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {recipe.introContent || recipe.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{recipe.prepTime + recipe.cookTime}m</span>
                      <span>{recipe.servings} servings</span>
                      <span>{recipe.unlockCount} unlocks</span>
                      {!recipe.isFree && (
                        <span className="text-amber-500 font-medium">
                          {recipe.price}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
