import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { creators, recipes } from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  const db = await getDb();

  const rows = await db
    .select({
      address: creators.address,
      name: creators.name,
      avatarUrl: creators.avatarUrl,
      recipeCount: sql<number>`count(${recipes.id})`.as("recipe_count"),
    })
    .from(creators)
    .leftJoin(recipes, eq(creators.address, recipes.creatorAddress))
    .groupBy(creators.address)
    .orderBy(desc(sql`recipe_count`))
    .limit(8);

  return NextResponse.json(rows);
}
