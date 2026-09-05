import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";
import { seedBlueberryMuffins } from "@/lib/seed-blueberry-muffins";

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

  const recipe = request.nextUrl.searchParams.get("recipe");
  if (recipe !== null && recipe !== "blueberry-muffins") {
    return NextResponse.json({ error: "Unknown recipe import" }, { status: 400 });
  }

  const result = recipe === "blueberry-muffins"
    ? await seedBlueberryMuffins()
    : await seedDatabase();
  return NextResponse.json(result);
}

export const dynamic = "force-dynamic";
