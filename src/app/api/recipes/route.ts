import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
import { formatRecipePrice } from "@/lib/money";
import { recipes, creators } from "@/lib/schema";
import { eq, like, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  await getDb();
  const { searchParams } = req.nextUrl;
  const cuisine = searchParams.get("cuisine");
  const mealType = searchParams.get("mealType");
  const dietary = searchParams.get("dietary");
  const search = searchParams.get("search");

  const conditions = [];

  if (cuisine) {
    conditions.push(eq(recipes.cuisine, cuisine));
  }
  if (mealType) {
    conditions.push(eq(recipes.mealType, mealType));
  }
  if (dietary) {
    conditions.push(like(recipes.dietaryTags, `%${dietary}%`));
  }
  if (search) {
    conditions.push(
      sql`(${recipes.title} LIKE ${"%" + search + "%"} OR ${recipes.description} LIKE ${"%" + search + "%"})`,
    );
  }

  const rows =
    conditions.length > 0
      ? await db
          .select({
            id: recipes.id,
            creatorAddress: recipes.creatorAddress,
            creatorName: creators.name,
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
          .leftJoin(creators, eq(recipes.creatorAddress, creators.address))
          .where(and(...conditions))
      : await db
          .select({
            id: recipes.id,
            creatorAddress: recipes.creatorAddress,
            creatorName: creators.name,
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
          .leftJoin(creators, eq(recipes.creatorAddress, creators.address));

  const previews = rows.map((row) => ({
    ...row,
    price: formatRecipePrice(row),
    dietaryTags: JSON.parse(row.dietaryTags),
  }));

  return NextResponse.json(previews);
}
