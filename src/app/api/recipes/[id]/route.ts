import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { paymentEvents, recipes, unlocks } from "@/lib/schema";
import { getRecipeById } from "@/lib/tool-queries";

const adminSecretHeader = "x-morsel-seed-secret";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();

  const recipe = await getRecipeById(db, id);

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json(recipe);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminSecret = process.env.MORSEL_SEED_ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: "Recipe deletion is disabled" },
      { status: 404 },
    );
  }

  if (request.headers.get(adminSecretHeader) !== adminSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = await getDb();

  const [recipe] = await db
    .select({ id: recipes.id, slug: recipes.slug })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  // Payment events are an audit trail of settled x402 payments; never delete them
  const [paymentEvent] = await db
    .select({ id: paymentEvents.id })
    .from(paymentEvents)
    .where(eq(paymentEvents.recipeId, id))
    .limit(1);

  if (paymentEvent) {
    return NextResponse.json(
      { error: "Recipe has settled payments and cannot be deleted" },
      { status: 409 },
    );
  }

  await db.delete(unlocks).where(eq(unlocks.recipeId, id));
  await db.delete(recipes).where(eq(recipes.id, id));

  return NextResponse.json({
    message: "Recipe deleted",
    id: recipe.id,
    slug: recipe.slug,
  });
}
