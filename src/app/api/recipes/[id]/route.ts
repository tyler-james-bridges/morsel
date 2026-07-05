import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAddress } from "viem";
import { getDb } from "@/lib/db";
import { parseUsdInputToUsdcAtomic, usdcAtomicToUsdNumber } from "@/lib/money";
import {
  getAuthenticatedCreatorAddress,
  hasCreatorWalletAuthHeaders,
} from "@/lib/recipe-publish";
import { recipes, unlocks } from "@/lib/schema";
import { getRecipeById } from "@/lib/tool-queries";

const adminSecretHeader = "x-morsel-seed-secret";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

// Builds the set of columns to update from a partial request body.
// Returns an error string for invalid fields; slug and creator are immutable.
function parseRecipeUpdate(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};

  const stringFields = [
    "title",
    "description",
    "imageUrl",
    "cuisine",
    "mealType",
    "introContent",
    "notes",
  ] as const;
  for (const field of stringFields) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "string" || !(body[field] as string).trim()) {
      return { error: `${field} must be a non-empty string` };
    }
    updates[field] = body[field];
  }

  const intFields = ["prepTime", "cookTime", "servings"] as const;
  for (const field of intFields) {
    if (body[field] === undefined) continue;
    const value = body[field];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      return { error: `${field} must be a non-negative integer` };
    }
    updates[field] = value;
  }

  const arrayFields = ["dietaryTags", "ingredients", "steps"] as const;
  for (const field of arrayFields) {
    if (body[field] === undefined) continue;
    if (!isStringArray(body[field])) {
      return { error: `${field} must be an array of strings` };
    }
    updates[field] = JSON.stringify(body[field]);
  }

  if (body.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(body.difficulty as (typeof DIFFICULTIES)[number])) {
      return { error: "difficulty must be one of easy, medium, hard" };
    }
    updates.difficulty = body.difficulty;
  }

  if (body.price !== undefined) {
    const priceUsdcAtomic = parseUsdInputToUsdcAtomic(body.price);
    if (priceUsdcAtomic === null) {
      return { error: "price must be one of $0.25, $0.50, $0.75" };
    }
    updates.priceUsdcAtomic = priceUsdcAtomic;
    updates.price = usdcAtomicToUsdNumber(priceUsdcAtomic);
  }

  if (body.isFree !== undefined) {
    if (typeof body.isFree !== "boolean") {
      return { error: "isFree must be a boolean" };
    }
    updates.isFree = body.isFree ? 1 : 0;
  }

  if (Object.keys(updates).length === 0) {
    return { error: "No updatable fields provided" };
  }

  return { updates };
}

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const creatorAddress = await getAuthenticatedCreatorAddress(request);
  if (!creatorAddress) {
    return NextResponse.json(
      { error: "Valid wallet signature is required to update" },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseRecipeUpdate(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id } = await params;
  const db = await getDb();

  const [recipe] = await db
    .select({
      id: recipes.id,
      slug: recipes.slug,
      creatorAddress: recipes.creatorAddress,
    })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  if (getAddress(recipe.creatorAddress) !== creatorAddress) {
    return NextResponse.json(
      { error: "Only the recipe creator can update this recipe" },
      { status: 403 },
    );
  }

  await db.update(recipes).set(parsed.updates).where(eq(recipes.id, id));

  return NextResponse.json({ success: true, id: recipe.id, slug: recipe.slug });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Creators delete their own recipes with a wallet signature; the admin
  // secret path stays for demo/data resets.
  let authenticatedCreator: string | null = null;
  if (hasCreatorWalletAuthHeaders(request)) {
    authenticatedCreator = await getAuthenticatedCreatorAddress(request);
    if (!authenticatedCreator) {
      return NextResponse.json(
        { error: "Valid wallet signature is required to delete" },
        { status: 401 },
      );
    }
  } else {
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
  }

  const db = await getDb();

  const [recipe] = await db
    .select({
      id: recipes.id,
      slug: recipes.slug,
      creatorAddress: recipes.creatorAddress,
    })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  if (
    authenticatedCreator &&
    getAddress(recipe.creatorAddress) !== authenticatedCreator
  ) {
    return NextResponse.json(
      { error: "Only the recipe creator can delete this recipe" },
      { status: 403 },
    );
  }

  // Unlocks record paid access; never destroy that audit trail
  const [unlock] = await db
    .select({ id: unlocks.id })
    .from(unlocks)
    .where(eq(unlocks.recipeId, id))
    .limit(1);

  if (unlock) {
    return NextResponse.json(
      { error: "Recipe has been unlocked by buyers and cannot be deleted" },
      { status: 409 },
    );
  }

  await db.delete(recipes).where(eq(recipes.id, id));

  return NextResponse.json({
    message: "Recipe deleted",
    id: recipe.id,
    slug: recipe.slug,
  });
}
