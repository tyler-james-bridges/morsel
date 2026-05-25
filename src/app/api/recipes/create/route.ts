import { NextRequest, NextResponse } from "next/server";
import db, { getDb } from "@/lib/db";
import { parseUsdInputToUsdcAtomic, usdcAtomicToUsdNumber } from "@/lib/money";
import { recipes, creators } from "@/lib/schema";
import {
  buildCreatorPublishMessage,
  WALLET_AUTH_WINDOW_MS,
} from "@/lib/wallet-auth";
import { eq } from "drizzle-orm";
import { getAddress, isAddress, verifyMessage, type Hex } from "viem";
import { v4 as uuid } from "uuid";

async function getAuthenticatedCreatorAddress(req: NextRequest) {
  const address = req.headers.get("x-wallet-address");
  const signature = req.headers.get("x-wallet-signature");
  const timestamp = req.headers.get("x-wallet-timestamp");

  if (!address || !signature || !timestamp || !isAddress(address)) return null;

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) return null;
  if (Math.abs(Date.now() - issuedAt) > WALLET_AUTH_WINDOW_MS) return null;

  const checksumAddress = getAddress(address);
  const message = buildCreatorPublishMessage(checksumAddress, timestamp);
  const valid = await verifyMessage({
    address: checksumAddress,
    message,
    signature: signature as Hex,
  }).catch(() => false);

  return valid ? checksumAddress : null;
}

export async function POST(req: NextRequest) {
  await getDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required = [
    "creatorAddress",
    "title",
    "description",
    "imageUrl",
    "price",
    "cuisine",
    "mealType",
    "prepTime",
    "cookTime",
    "servings",
    "ingredients",
    "steps",
  ];

  const missing = required.filter((field) => !body[field]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const authenticatedCreatorAddress = await getAuthenticatedCreatorAddress(req);
  if (!authenticatedCreatorAddress) {
    return NextResponse.json(
      { error: "Valid wallet signature is required to publish" },
      { status: 401 },
    );
  }

  if (
    typeof body.creatorAddress !== "string" ||
    !isAddress(body.creatorAddress) ||
    getAddress(body.creatorAddress) !== authenticatedCreatorAddress
  ) {
    return NextResponse.json(
      { error: "creatorAddress must match the publishing wallet" },
      { status: 400 },
    );
  }

  const priceUsdcAtomic = parseUsdInputToUsdcAtomic(body.price);
  if (priceUsdcAtomic === null) {
    return NextResponse.json(
      { error: "price must be a USD amount with at most two decimals" },
      { status: 400 },
    );
  }

  const creatorAddress = authenticatedCreatorAddress;
  const creatorName =
    typeof body.creatorName === "string" && body.creatorName.trim()
      ? body.creatorName.trim()
      : `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`;

  // Auto-create creator if they don't exist
  const existingCreator = (
    await db
      .select()
      .from(creators)
      .where(eq(creators.address, creatorAddress))
      .limit(1)
  )[0];

  if (!existingCreator) {
    const creatorSlug = creatorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    await db.insert(creators).values({
      address: creatorAddress,
      name: creatorName,
      slug: creatorSlug,
      bio: (body.creatorBio as string) ?? "",
      avatarUrl: (body.creatorAvatarUrl as string) ?? "",
    });
  }

  const id = uuid();

  const titleStr = body.title as string;
  const slug =
    (body.slug as string) ||
    titleStr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  await db.insert(recipes).values({
    id,
    creatorAddress,
    title: titleStr,
    slug,
    introContent: (body.introContent as string) ?? "",
    isFree: body.isFree ? 1 : 0,
    publishedAt: new Date(),
    description: body.description as string,
    imageUrl: body.imageUrl as string,
    price: usdcAtomicToUsdNumber(priceUsdcAtomic),
    priceUsdcAtomic,
    cuisine: body.cuisine as string,
    mealType: body.mealType as string,
    dietaryTags: Array.isArray(body.dietaryTags)
      ? JSON.stringify(body.dietaryTags)
      : ((body.dietaryTags as string) ?? "[]"),
    prepTime: body.prepTime as number,
    cookTime: body.cookTime as number,
    servings: body.servings as number,
    difficulty: (body.difficulty as string) ?? "medium",
    ingredients: Array.isArray(body.ingredients)
      ? JSON.stringify(body.ingredients)
      : (body.ingredients as string),
    steps: Array.isArray(body.steps)
      ? JSON.stringify(body.steps)
      : (body.steps as string),
    notes: (body.notes as string) ?? "",
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}
