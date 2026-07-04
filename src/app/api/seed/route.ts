import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

const seedSecretHeader = "x-morsel-seed-secret";

export async function POST(request: NextRequest) {
  const seedSecret = process.env.MORSEL_SEED_ADMIN_SECRET;
  if (!seedSecret) {
    return NextResponse.json(
      { error: "Sample seeding is disabled" },
      { status: 404 },
    );
  }

  if (request.headers.get(seedSecretHeader) !== seedSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await seedDatabase();
  return NextResponse.json(result);
}

export const dynamic = "force-dynamic";
