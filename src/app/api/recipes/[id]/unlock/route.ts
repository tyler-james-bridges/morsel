import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
import { recipes, unlocks } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();

  const recipe = (
    await db.select().from(recipes).where(eq(recipes.id, id)).limit(1)
  )[0];

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  let body: { buyerAddress?: string; txHash?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.buyerAddress) {
    return NextResponse.json(
      { error: "buyerAddress is required" },
      { status: 400 },
    );
  }

  await db.insert(unlocks).values({
    id: uuid(),
    recipeId: id,
    buyerAddress: body.buyerAddress,
    paidAmount: recipe.price,
    txHash: body.txHash ?? null,
  });

  await db
    .update(recipes)
    .set({ unlockCount: sql`${recipes.unlockCount} + 1` })
    .where(eq(recipes.id, id));

  return NextResponse.json({ success: true, recipeId: id });
}
