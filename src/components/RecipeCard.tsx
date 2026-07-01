import Image from "next/image";
import Link from "next/link";

interface RecipeCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  creatorName: string;
  cuisine: string;
  difficulty: "easy" | "medium" | "hard";
  prepTime: number;
  cookTime: number;
  servings: number;
  unlockCount: number; // kept in type; not displayed pre-launch
}

export default function RecipeCard({
  id,
  title,
  description,
  imageUrl,
  price,
  creatorName,
  cuisine,
  difficulty,
  prepTime,
  cookTime,
}: RecipeCardProps) {
  const totalTime = prepTime + cookTime;

  return (
    <Link href={`/recipe/${id}`} className="block group mb-4 break-inside-avoid">
      <article className="press-card">
        {/* Creator byline */}
        <div className="flex items-center gap-2.5 px-[14px] pt-3 pb-2.5">
          <div className="w-[24px] h-[24px] rounded-[3px] bg-paper-2 grid place-items-center display text-[11px] text-ink-2">
            {creatorName?.charAt(0).toUpperCase() || "?"}
          </div>
          <span className="text-[13.5px] text-ink-2 font-medium truncate">
            {creatorName}
          </span>
        </div>

        {/* Image */}
        <div className="relative aspect-[4/3]">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            unoptimized
            className="object-cover"
          />
          <span className="price-badge absolute top-3 right-3 z-10">{price}</span>
        </div>

        {/* Content */}
        <div className="p-[13px_14px_15px]">
          <h3 className="display text-[19px] mb-1.5">{title}</h3>
          <p className="text-[13px] text-ink-3 line-clamp-2 leading-relaxed mb-3">
            {description}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-[12.5px] text-ink-3">
            <span className="px-2.5 py-1 rounded-[3px] border-[1.5px] border-ink/30 text-ink-2 font-semibold capitalize">
              {cuisine}
            </span>
            <span className="capitalize">{difficulty}</span>
            <span>{totalTime}m</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
