import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getTopCreators } from "@/lib/tool-queries";

export async function GET() {
  const db = await getDb();
  const rows = await getTopCreators(db);
  return NextResponse.json(rows);
}
