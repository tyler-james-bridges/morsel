import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRecipeById } from "@/lib/tool-queries";

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
