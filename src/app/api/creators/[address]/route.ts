import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCreatorByAddress } from "@/lib/tool-queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const db = await getDb();

  const result = await getCreatorByAddress(db, address);

  if (!result) {
    return NextResponse.json(
      { error: "Creator not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
