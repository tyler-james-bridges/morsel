import { NextRequest } from "next/server";
import db from "@/lib/db";
import { parseUsdInputToUsdcAtomic, usdcAtomicToUsdNumber } from "@/lib/money";
import { creators, recipes } from "@/lib/schema";
import {
  buildCreatorPublishMessage,
  WALLET_AUTH_WINDOW_MS,
} from "@/lib/wallet-auth";
import { eq } from "drizzle-orm";
import { getAddress, isAddress, verifyMessage, type Hex } from "viem";
import { v4 as uuid } from "uuid";

export const PUBLISH_FEE_USDC_ATOMIC = 100_000;

export interface RecipePublishInput {
  creatorAddress?: string;
  creatorName?: string;
  creatorBio?: string;
  creatorAvatarUrl?: string;
  title: string;
  slug?: string;
  introContent?: string;
  isFree?: boolean;
  description: string;
  imageUrl: string;
  priceUsdcAtomic: number;
  cuisine: string;
  mealType: string;
  dietaryTags?: unknown;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty?: string;
  ingredients: unknown;
  steps: unknown;
  notes?: string;
}

export function hasCreatorWalletAuthHeaders(req: NextRequest) {
  return Boolean(
    req.headers.get("x-wallet-address") ||
      req.headers.get("x-wallet-signature") ||
      req.headers.get("x-wallet-timestamp"),
  );
}

export async function getAuthenticatedCreatorAddress(req: NextRequest) {
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

export function parseRecipePublishInput(body: Record<string, unknown>) {
  const required = [
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
    return { error: `Missing required fields: ${missing.join(", ")}` };
  }

  const priceUsdcAtomic = parseUsdInputToUsdcAtomic(body.price);
  if (priceUsdcAtomic === null) {
    return { error: "price must be one of $0.25, $0.50, $0.75" };
  }

  return {
    input: {
      ...body,
      priceUsdcAtomic,
      prepTime: Number(body.prepTime),
      cookTime: Number(body.cookTime),
      servings: Number(body.servings),
    } as RecipePublishInput,
  };
}

export async function publishRecipe(input: RecipePublishInput, creatorAddress: string) {
  const creatorName =
    typeof input.creatorName === "string" && input.creatorName.trim()
      ? input.creatorName.trim()
      : `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`;

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
      bio: input.creatorBio ?? "",
      avatarUrl: input.creatorAvatarUrl ?? "",
    });
  }

  const id = uuid();
  const slug =
    input.slug ||
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  await db.insert(recipes).values({
    id,
    creatorAddress,
    title: input.title,
    slug,
    introContent: input.introContent ?? "",
    isFree: input.isFree ? 1 : 0,
    publishedAt: new Date(),
    description: input.description,
    imageUrl: input.imageUrl,
    price: usdcAtomicToUsdNumber(input.priceUsdcAtomic),
    priceUsdcAtomic: input.priceUsdcAtomic,
    cuisine: input.cuisine,
    mealType: input.mealType,
    dietaryTags: Array.isArray(input.dietaryTags)
      ? JSON.stringify(input.dietaryTags)
      : ((input.dietaryTags as string) ?? "[]"),
    prepTime: input.prepTime,
    cookTime: input.cookTime,
    servings: input.servings,
    difficulty: input.difficulty ?? "medium",
    ingredients: Array.isArray(input.ingredients)
      ? JSON.stringify(input.ingredients)
      : (input.ingredients as string),
    steps: Array.isArray(input.steps)
      ? JSON.stringify(input.steps)
      : (input.steps as string),
    notes: input.notes ?? "",
  });

  return { id, slug, creatorAddress };
}
