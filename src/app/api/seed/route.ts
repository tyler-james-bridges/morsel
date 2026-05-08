import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function GET() {
  const result = await seedDatabase();
  return NextResponse.json(result);
}

export const dynamic = "force-dynamic";
