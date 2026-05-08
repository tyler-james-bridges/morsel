import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
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
    .leftJoin(creators, eq(recipes.creatorAddress, creators.address))
    .where(eq(recipes.id, id));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const row = rows[0];

  return NextResponse.json({
    ...row,
    price: `$${row.price.toFixed(2)}`,
    dietaryTags: JSON.parse(row.dietaryTags),
    creator: {
      address: row.creatorAddress,
      name: row.creatorName,
      bio: row.creatorBio,
      avatarUrl: row.creatorAvatarUrl,
    },
  });
}
