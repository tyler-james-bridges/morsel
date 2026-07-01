"use client";

import Image from "next/image";
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
  unlockCount: number; // kept in the type; not displayed pre-launch (see README → Honest metrics)
}

/*
  RecipeFeedCard — "Test Kitchen Press" treatment.
  Key changes from the old dark card:
  - `press-card` (cream stock, 1.5px ink border, hard 7px offset-shadow on hover)
  - square corners (radius-card 4px), not rounded-xl
  - price is a `price-badge` deli sticker (accent fill + ink border + offset shadow)
  - avatar is a square `rounded-[3px]` chip, not a circle
  - meta uses font-mono; cuisine is an outlined chip; NO "unlocks" count shown
  - ERC-8257 stamp row at the bottom (the agent layer)
*/
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
}: RecipeFeedCardProps) {
  const totalTime = prepTime + cookTime;

  return (
    <article className="press-card">
      {/* Creator byline */}
      <div className="flex items-center gap-2.5 px-[18px] pt-3.5 pb-3">
        <Link href={`/creator/${creatorAddress}`} className="flex items-center gap-2.5 group min-w-0">
          {creatorAvatarUrl ? (
            <Image
              src={creatorAvatarUrl}
              alt={creatorName}
              width={30}
              height={30}
              unoptimized
              className="w-[30px] h-[30px] rounded-[3px] object-cover"
            />
          ) : (
            <div className="w-[30px] h-[30px] rounded-[3px] bg-paper-2 grid place-items-center display text-sm text-ink-2">
              {creatorName?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <span className="text-[13.5px] font-medium text-ink-2 truncate group-hover:text-ink transition-colors">
            {creatorName}
          </span>
        </Link>
      </div>

      {/* Hero image */}
      <Link href={`/recipe/${id}`} className="block relative aspect-[16/9]">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          unoptimized
          className="object-cover"
        />
        <span className="price-badge absolute top-3 right-3 z-10">{price}</span>
      </Link>

      {/* Content */}
      <div className="px-[18px] py-4">
        <Link href={`/recipe/${id}`} className="block">
          <h2 className="display text-2xl mb-1.5">{title}</h2>
          <p className="text-[14.5px] text-ink-3 line-clamp-2 leading-relaxed mb-3.5">{description}</p>
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[12.5px] text-ink-3">
          <span className="px-2.5 py-1 rounded-[3px] border-[1.5px] border-ink/30 text-ink-2 font-semibold capitalize">
            {cuisine}
          </span>
          <span className="capitalize">{difficulty}</span>
          <span>{totalTime}m</span>
        </div>

        {/* ERC-8257 agent stamp */}
        <div className="mt-3.5 pt-3.5 border-t-[1.5px] border-ink/15">
          <span className="agent-badge">
            <span className="diamond" />
            recipe_full · {price} · Base
          </span>
        </div>
      </div>
    </article>
  );
}
