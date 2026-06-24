import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { searchRecipes } from "@/lib/tool-queries";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = req.nextUrl;

  const previews = await searchRecipes(db, {
    cuisine: searchParams.get("cuisine") || undefined,
    mealType: searchParams.get("mealType") || undefined,
    dietary: searchParams.get("dietary") || undefined,
    search: searchParams.get("search") || undefined,
  });

  return NextResponse.json(previews);
}
