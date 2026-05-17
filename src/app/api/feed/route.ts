import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recipes, creators } from "@/lib/schema";
import { eq, desc, sql, and } from "drizzle-orm";

type FeedTab = "featured" | "latest" | "trending";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = req.nextUrl;

  const tab = (searchParams.get("tab") || "featured") as FeedTab;
  const cursor = searchParams.get("cursor");
  const rawLimit = parseInt(searchParams.get("limit") || "", 10);
  const limit = Math.min(
    Number.isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit,
    MAX_LIMIT,
  );

  const baseSelect = {
    id: recipes.id,
    creatorAddress: recipes.creatorAddress,
    creatorName: creators.name,
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
  };

  const baseQuery = () =>
    db
      .select(baseSelect)
      .from(recipes)
      .leftJoin(creators, eq(recipes.creatorAddress, creators.address));

  let rows;

  if (tab === "featured") {
    const conditions = [];
    if (cursor) {
      conditions.push(
        sql`(${recipes.unlockCount} < ${parseInt(cursor, 10)} OR (${recipes.unlockCount} = ${parseInt(cursor, 10)} AND ${recipes.id} > ${searchParams.get("afterId") || ""}))`,
      );
    }

    rows = await baseQuery()
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(recipes.unlockCount), recipes.id)
      .limit(limit + 1);
  } else if (tab === "latest") {
    const conditions = [];
    if (cursor) {
      conditions.push(
        sql`${recipes.createdAt} < ${new Date(parseInt(cursor, 10))}`,
      );
    }

    rows = await baseQuery()
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(recipes.createdAt))
      .limit(limit + 1);
  } else {
    // trending: highest unlock counts, with recency bias
    // Use unlock_count as primary sort (approximation of trending)
    const conditions = [];
    if (cursor) {
      conditions.push(
        sql`(${recipes.unlockCount} < ${parseInt(cursor, 10)} OR (${recipes.unlockCount} = ${parseInt(cursor, 10)} AND ${recipes.id} > ${searchParams.get("afterId") || ""}))`,
      );
    }

    rows = await baseQuery()
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(recipes.unlockCount), recipes.id)
      .limit(limit + 1);
  }

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1];
    if (tab === "latest") {
      nextCursor = last.createdAt
        ? new Date(last.createdAt).getTime().toString()
        : null;
    } else {
      nextCursor = `${last.unlockCount}`;
    }
  }

  const previews = items.map((row) => ({
    ...row,
    price: `$${row.price.toFixed(2)}`,
    dietaryTags: JSON.parse(row.dietaryTags),
  }));

  return NextResponse.json({
    recipes: previews,
    nextCursor,
  });
}
