import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getFeedRecipes } from "@/lib/tool-queries";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = req.nextUrl;

  const tab = (searchParams.get("tab") || "featured") as
    | "featured"
    | "latest"
    | "trending";
  const cursor = searchParams.get("cursor") || undefined;
  const afterId = searchParams.get("afterId") || undefined;
  const rawLimit = parseInt(searchParams.get("limit") || "", 10);
  const limit = Math.min(
    Number.isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit,
    MAX_LIMIT,
  );

  const result = await getFeedRecipes(db, { tab, cursor, afterId, limit });

  return NextResponse.json(result);
}
