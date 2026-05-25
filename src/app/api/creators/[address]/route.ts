import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
import { formatRecipePrice, formatUsdcAtomicAsUsd } from "@/lib/money";
import { creators, recipes, unlocks } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  await getDb();

  const creator = (
    await db
      .select()
      .from(creators)
      .where(eq(creators.address, address))
      .limit(1)
  )[0];

  if (!creator) {
    return NextResponse.json(
      { error: "Creator not found" },
      { status: 404 },
    );
  }

  const creatorRecipes = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      imageUrl: recipes.imageUrl,
      price: recipes.price,
      priceUsdcAtomic: recipes.priceUsdcAtomic,
      cuisine: recipes.cuisine,
      mealType: recipes.mealType,
      dietaryTags: recipes.dietaryTags,
      prepTime: recipes.prepTime,
      cookTime: recipes.cookTime,
      servings: recipes.servings,
      difficulty: recipes.difficulty,
      unlockCount: recipes.unlockCount,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(eq(recipes.creatorAddress, address));

  // Compute total earned from unlocks on this creator's recipes
  const recipeIds = creatorRecipes.map((r) => r.id);
  let totalEarnedUsdcAtomic = 0;

  if (recipeIds.length > 0) {
    const earningsResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${unlocks.paidAmountUsdcAtomic}), 0)`,
      })
      .from(unlocks)
      .where(
        sql`${unlocks.recipeId} IN (${sql.join(
          recipeIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    totalEarnedUsdcAtomic = earningsResult[0]?.total ?? 0;
  }

  const recipePreviews = creatorRecipes.map((r) => ({
    ...r,
    creatorAddress: address,
    creatorName: creator.name,
    price: formatRecipePrice(r),
    dietaryTags: JSON.parse(r.dietaryTags),
  }));

  return NextResponse.json({
    creator: {
      address: creator.address,
      name: creator.name,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      slug: creator.slug,
      bannerUrl: creator.bannerUrl,
      socialLinks: JSON.parse(creator.socialLinks),
      recipeCount: recipePreviews.length,
      totalEarned: formatUsdcAtomicAsUsd(totalEarnedUsdcAtomic),
    },
    recipes: recipePreviews,
  });
}
