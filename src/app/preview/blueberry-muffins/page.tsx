import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import RecipeContent from "@/components/RecipeContent";
import IntroContent from "@/components/IntroContent";
import { blueberryMuffinsDraft as recipe } from "@/content/recipes/blueberry-muffins";

export const metadata: Metadata = {
  title: `${recipe.title} · Local draft · Morsel`,
  robots: { index: false, follow: false },
};

export default function BlueberryMuffinsPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <article className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-4 mb-7">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent">
          Local revision · Preview
        </span>
        <a
          href="#recipe"
          className="text-[13px] font-semibold underline underline-offset-4 hover:text-accent"
        >
          Jump to recipe ↓
        </a>
      </div>

      <a
        href="https://morsel.0x402.sh/tmoney145"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 mb-[22px] group"
      >
        <Image
          src="https://pbs.twimg.com/profile_images/2051778368866316288/8BprVzHq.jpg"
          alt="tmoney_145"
          width={42}
          height={42}
          unoptimized
          className="rounded-[3px] object-cover"
        />
        <span className="text-[15px] font-semibold group-hover:text-accent">tmoney_145</span>
      </a>

      <div className="flex flex-wrap gap-2 mb-4">
        {[recipe.cuisine, recipe.mealType, ...recipe.dietaryTags].map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-[3px] border-[1.5px] border-ink/30 text-[12.5px] font-semibold text-ink-2 capitalize"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1 className="display text-[clamp(34px,5vw,52px)] mb-4 leading-[1.05]">
        {recipe.title}
      </h1>
      <p className="text-[20px] text-ink-2 leading-[1.5] mb-7">
        {recipe.description}
      </p>

      <figure className="mb-3.5">
        <div className="relative aspect-[16/9] rounded-[4px] overflow-hidden bg-paper-2">
          <Image
            src={recipe.imageUrl}
            alt="Blueberry muffins with golden cinnamon crumbs, one split open to show the berries"
            fill
            sizes="(min-width: 672px) 640px, calc(100vw - 32px)"
            preload
            className="object-cover"
          />
        </div>
      </figure>

      <div className="flex justify-end mb-9">
        <span className="agent-badge">
          <span className="diamond" />
          recipe_full · $0.25
        </span>
      </div>

      <div className="mb-10">
        <IntroContent content={recipe.introContent} />
      </div>

      <div id="recipe" className="scroll-mt-24 border-t-[1.5px] border-ink/15 pt-8">
        <RecipeContent
          ingredients={recipe.ingredients}
          steps={recipe.steps}
          notes={recipe.notes}
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          servings={recipe.servings}
          difficulty={recipe.difficulty}
        />
      </div>
    </article>
  );
}
