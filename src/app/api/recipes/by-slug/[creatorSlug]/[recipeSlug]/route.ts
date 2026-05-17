import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
import { recipes, creators } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ creatorSlug: string; recipeSlug: string }> },
) {
  const { creatorSlug, recipeSlug } = await params;
  await getDb();

  const rows = await db
    .select({
      id: recipes.id,
      creatorAddress: recipes.creatorAddress,
      creatorName: creators.name,
      creatorBio: creators.bio,
      creatorAvatarUrl: creators.avatarUrl,
      creatorSlug: creators.slug,
      creatorBannerUrl: creators.bannerUrl,
      creatorSocialLinks: creators.socialLinks,
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
      slug: recipes.slug,
      introContent: recipes.introContent,
      isFree: recipes.isFree,
      publishedAt: recipes.publishedAt,
      unlockCount: recipes.unlockCount,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .innerJoin(creators, eq(recipes.creatorAddress, creators.address))
    .where(and(eq(creators.slug, creatorSlug), eq(recipes.slug, recipeSlug)));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const row = rows[0];

  return NextResponse.json({
    id: row.id,
    creatorAddress: row.creatorAddress,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    price: `$${row.price.toFixed(2)}`,
    cuisine: row.cuisine,
    mealType: row.mealType,
    dietaryTags: JSON.parse(row.dietaryTags),
    prepTime: row.prepTime,
    cookTime: row.cookTime,
    servings: row.servings,
    difficulty: row.difficulty,
    slug: row.slug,
    introContent: row.introContent,
    isFree: row.isFree === 1,
    publishedAt: row.publishedAt,
    unlockCount: row.unlockCount,
    createdAt: row.createdAt,
    creator: {
      address: row.creatorAddress,
      name: row.creatorName,
      bio: row.creatorBio,
      avatarUrl: row.creatorAvatarUrl,
      slug: row.creatorSlug,
      bannerUrl: row.creatorBannerUrl,
      socialLinks: JSON.parse(row.creatorSocialLinks),
    },
  });
}
