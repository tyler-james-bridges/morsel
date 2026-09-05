import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import RecipeContent from "@/components/RecipeContent";
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
          Local draft · Not published
        </span>
        <a
          href="#recipe"
          className="text-[13px] font-semibold underline underline-offset-4 hover:text-accent"
        >
          Jump to recipe ↓
        </a>
      </div>

      <p className="text-[14px] text-ink-3 mb-5">
        Recipe by {recipe.source.author} ·{" "}
        <a
          href={recipe.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-accent"
        >
          {recipe.source.name}
        </a>
      </p>

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

      <figure className="mb-8">
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
        <figcaption className="font-mono text-[10px] text-ink-4 mt-2 text-right">
          AI-generated serving illustration
        </figcaption>
      </figure>

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
