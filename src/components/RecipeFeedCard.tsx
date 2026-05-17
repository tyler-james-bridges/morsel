"use client";

import Link from "next/link";

interface RecipeFeedCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  creatorName: string;
  creatorAvatarUrl: string;
  creatorAddress: string;
  cuisine: string;
  difficulty: "easy" | "medium" | "hard";
  prepTime: number;
  cookTime: number;
  unlockCount: number;
}

export default function RecipeFeedCard({
  id,
  title,
  description,
  imageUrl,
  price,
  creatorName,
  creatorAvatarUrl,
  creatorAddress,
  cuisine,
  difficulty,
  prepTime,
  cookTime,
  unlockCount,
}: RecipeFeedCardProps) {
  const totalTime = prepTime + cookTime;

  return (
    <article className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800/50 transition-all duration-300 hover:border-gray-700/50 hover:shadow-lg hover:shadow-amber-500/5">
      {/* Creator header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Link
          href={`/creator/${creatorAddress}`}
          className="flex items-center gap-3 group"
        >
          {creatorAvatarUrl ? (
            <img
              src={creatorAvatarUrl}
              alt={creatorName}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-700 group-hover:ring-amber-500/50 transition-all"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-400 ring-1 ring-gray-700">
              {creatorName?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <span className="text-sm font-medium text-gray-300 group-hover:text-amber-400 transition-colors">
            {creatorName}
          </span>
        </Link>
      </div>

      {/* Hero image */}
      <Link href={`/recipe/${id}`} className="block relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full aspect-[16/9] object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-gray-950">
            {price}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="px-5 py-4">
        <Link href={`/recipe/${id}`} className="block group">
          <h2 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-amber-400 transition-colors">
            {title}
          </h2>
          <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed mb-4">
            {description}
          </p>
        </Link>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 capitalize">
              {cuisine}
            </span>
            <span className="capitalize">{difficulty}</span>
            <span>{totalTime}m</span>
          </div>
          <span>{unlockCount} unlocks</span>
        </div>
      </div>
    </article>
  );
}
