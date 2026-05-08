import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
import { creators, recipes } from "@/lib/schema";
import { eq } from "drizzle-orm";

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

  const recipePreviews = creatorRecipes.map((r) => ({
    ...r,
    creatorAddress: address,
    creatorName: creator.name,
    price: `$${r.price.toFixed(2)}`,
    dietaryTags: JSON.parse(r.dietaryTags),
  }));

  return NextResponse.json({
    address: creator.address,
    name: creator.name,
    bio: creator.bio,
    avatarUrl: creator.avatarUrl,
    recipeCount: recipePreviews.length,
    recipes: recipePreviews,
  });
}
