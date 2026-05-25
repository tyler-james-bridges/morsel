import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
import { formatRecipePrice } from "@/lib/money";
import { recipes, creators } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();

  const rows = await db
    .select({
      id: recipes.id,
      creatorAddress: recipes.creatorAddress,
      creatorName: creators.name,
      creatorBio: creators.bio,
      creatorAvatarUrl: creators.avatarUrl,
      creatorSlug: creators.slug,
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
      slug: recipes.slug,
      introContent: recipes.introContent,
      isFree: recipes.isFree,
      publishedAt: recipes.publishedAt,
      unlockCount: recipes.unlockCount,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .leftJoin(creators, eq(recipes.creatorAddress, creators.address))
    .where(eq(recipes.id, id));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const row = rows[0];

  return NextResponse.json({
    ...row,
    price: formatRecipePrice(row),
    dietaryTags: JSON.parse(row.dietaryTags),
    slug: row.slug,
    introContent: row.introContent,
    isFree: row.isFree === 1,
    publishedAt: row.publishedAt,
    creator: {
      address: row.creatorAddress,
      name: row.creatorName,
      bio: row.creatorBio,
      avatarUrl: row.creatorAvatarUrl,
      slug: row.creatorSlug,
    },
  });
}
