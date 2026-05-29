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
          <div className="h-48 sm:h-64 bg-card-2 mb-8" />
          <div className="flex items-center gap-4 mb-8">
            <div className="w-[108px] h-[108px] rounded-[4px] bg-card-2" />
            <div className="space-y-3">
              <div className="h-7 bg-card-2 rounded-[4px] w-48" />
              <div className="h-4 bg-card-2 rounded-[4px] w-72" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-card-2 rounded-[4px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="display text-[40px] mb-2">Not found</h1>
        <p className="text-ink-3">That creator doesn&apos;t seem to exist.</p>
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
        recipeCount={creator.recipeCount}
      />

      {/* Recipe Archive */}
      <div className="mt-8">
        <span className="eyebrow mb-[18px] block">
          Recipes by {creator.name.split(" ")[0]}
        </span>

        {recipes.length === 0 ? (
          <div className="press-card p-[60px_30px] text-center">
            <p className="display text-2xl mb-2">No recipes yet</p>
            <p className="text-ink-3 text-[15px]">This creator hasn&apos;t published any recipes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((recipe) => {
              const totalTime = recipe.prepTime + recipe.cookTime;
              return (
                <Link
                  key={recipe.id}
                  href={`/${creatorSlug}/${recipe.slug}`}
                  className="block group"
                >
                  <article className="press-card">
                    <div className="relative">
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                      />
                      <span className="price-badge absolute top-3 right-3 z-10">
                        {recipe.isFree ? "Free" : recipe.price}
                      </span>
                    </div>
                    <div className="p-[13px_14px_15px]">
                      <h3 className="display text-[19px] mb-1.5 line-clamp-1">{recipe.title}</h3>
                      <p className="text-[13px] text-ink-3 line-clamp-2 leading-relaxed mb-3">
                        {recipe.introContent || recipe.description}
                      </p>
                      <div className="flex items-center gap-3 text-[12.5px] text-ink-3">
                        <span className="px-2.5 py-1 rounded-[3px] border-[1.5px] border-ink/30 text-ink-2 font-semibold capitalize">
                          {recipe.cuisine}
                        </span>
                        <span className="capitalize">{recipe.difficulty}</span>
                        <span>{totalTime}m</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
