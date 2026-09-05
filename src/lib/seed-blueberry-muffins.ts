import { and, eq } from "drizzle-orm";
import db from "./db";
import { creators, recipes } from "./schema";
import { blueberryMuffinsDraft as recipe } from "@/content/recipes/blueberry-muffins";

const recipeId = "7165e174-3864-4699-986a-411bb730ba1b";
const creatorAddress = "0xa102a2cb8AAc6C7d2c477412Ebb7d41d0Ce53495";

const recipeContent = {
  description: recipe.description,
  introContent: recipe.introContent,
  ingredients: JSON.stringify(recipe.ingredients),
  steps: JSON.stringify(recipe.steps),
  notes: recipe.notes,
};

// Explicit editorial updates preserve identity, price, dates, and paid access.
export async function updateBlueberryMuffinsContent() {
  const [updated] = await db.update(recipes).set(recipeContent).where(and(
    eq(recipes.id, recipeId),
    eq(recipes.creatorAddress, creatorAddress),
    eq(recipes.slug, recipe.slug),
  )).returning({ id: recipes.id, slug: recipes.slug });

  return updated ? { ...updated, updated: true } : null;
}

// A targeted, repeatable import. Existing recipes and creator profiles are never updated.
export async function seedBlueberryMuffins() {
  const [creator] = await db
    .select({ address: creators.address })
    .from(creators)
    .where(and(eq(creators.slug, "tmoney145"), eq(creators.address, creatorAddress)))
    .limit(1);

  if (!creator) throw new Error("The tmoney145 creator must exist before importing this recipe");

  const [existing] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.creatorAddress, creatorAddress), eq(recipes.slug, recipe.slug)))
    .limit(1);

  if (existing) {
    return { id: existing.id, slug: recipe.slug, created: false };
  }

  const inserted = await db.insert(recipes).values({
    id: recipeId,
    creatorAddress,
    title: recipe.title,
    slug: recipe.slug,
    ...recipeContent,
    imageUrl: recipe.imageUrl,
    price: 0.25,
    priceUsdcAtomic: 250_000,
    isFree: 0,
    cuisine: recipe.cuisine,
    mealType: recipe.mealType,
    dietaryTags: JSON.stringify(recipe.dietaryTags),
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
  }).onConflictDoNothing({ target: recipes.id }).returning({ id: recipes.id });

  return { id: recipeId, slug: recipe.slug, created: inserted.length > 0 };
}
