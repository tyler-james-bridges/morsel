import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
import { recipes, creators, unlocks } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  await getDb();
  const address = req.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "address query parameter is required" },
      { status: 400 },
    );
  }

  const userUnlocks = await db
    .select({
      recipeId: unlocks.recipeId,
      unlockedAt: unlocks.unlockedAt,
      paidAmount: unlocks.paidAmount,
    })
    .from(unlocks)
    .where(eq(unlocks.buyerAddress, address.toLowerCase()));

  if (userUnlocks.length === 0) {
    return NextResponse.json([]);
  }

  const recipeIds = userUnlocks.map((u) => u.recipeId);

  const recipeRows = await db
    .select({
      id: recipes.id,
      creatorAddress: recipes.creatorAddress,
      creatorName: creators.name,
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
    .leftJoin(creators, eq(recipes.creatorAddress, creators.address));

  const unlockMap = new Map(
    userUnlocks.map((u) => [u.recipeId, u.unlockedAt]),
  );

  const results = recipeRows
    .filter((r) => recipeIds.includes(r.id))
    .map((r) => ({
      ...r,
      price: `$${r.price.toFixed(2)}`,
      dietaryTags: JSON.parse(r.dietaryTags),
      unlockedAt: unlockMap.get(r.id),
    }));

  return NextResponse.json(results);
}
