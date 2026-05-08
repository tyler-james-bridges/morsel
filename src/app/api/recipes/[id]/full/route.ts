import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import db, { getDb } from "@/lib/db";
import { recipes } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();

  const recipe = (
    await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1)
  )[0];

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const handler = async () => {
    return NextResponse.json({
      ingredients: JSON.parse(recipe.ingredients),
      steps: JSON.parse(recipe.steps),
      notes: recipe.notes,
    });
  };

  const wrapped = withX402(
    handler,
    recipe.creatorAddress as `0x${string}`,
    {
      price: `$${recipe.price.toFixed(2)}`,
      network: "base",
      config: {
        description: `Unlock "${recipe.title}"`,
      },
    },
  );

  return wrapped(req);
}
