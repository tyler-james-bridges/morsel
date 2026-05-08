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
  unlockCount: number;
}

const difficultyColor = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

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
  unlockCount,
}: RecipeCardProps) {
  return (
    <Link href={`/recipe/${id}`} className="block group mb-4 break-inside-avoid">
      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800/50 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-amber-500/5 group-hover:border-gray-700/50">
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="w-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-gray-950">
              {price}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 capitalize">
              {cuisine}
            </span>
            <span className={`text-xs capitalize ${difficultyColor[difficulty]}`}>
              {difficulty}
            </span>
          </div>

          <h3 className="text-base font-semibold text-gray-100 mb-1 line-clamp-2 group-hover:text-amber-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{creatorName}</span>
            <div className="flex items-center gap-3">
              <span>{prepTime + cookTime}m</span>
              <span>{unlockCount} unlocks</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
