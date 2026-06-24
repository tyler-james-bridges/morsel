import { NextRequest, NextResponse } from "next/server";
import { decodeXPaymentResponse, getDefaultAsset } from "x402/shared";
import { withX402 } from "x402-next";
import db, { getDb } from "@/lib/db";
import { getPriceUsdcAtomic, usdcAtomicToUsdNumber } from "@/lib/money";
import { PAYOUT_ADDRESS, X402_FACILITATOR_URL } from "@/lib/payment";
import { recipes, unlocks } from "@/lib/schema";
import {
  buildRecipeAccessMessage,
  WALLET_AUTH_WINDOW_MS,
} from "@/lib/wallet-auth";
import { and, eq, sql } from "drizzle-orm";
import { getAddress, isAddress, verifyMessage, type Hex } from "viem";
import { v4 as uuid } from "uuid";

function getFullRecipeContent(recipe: typeof recipes.$inferSelect) {
  return {
    ingredients: JSON.parse(recipe.ingredients),
    steps: JSON.parse(recipe.steps),
    notes: recipe.notes,
  };
}

async function getAuthenticatedBuyerAddress(req: NextRequest, recipeId: string) {
  const address = req.headers.get("x-wallet-address");
  const signature = req.headers.get("x-wallet-signature");
  const timestamp = req.headers.get("x-wallet-timestamp");

  if (!address || !signature || !timestamp || !isAddress(address)) return null;

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) return null;
  if (Math.abs(Date.now() - issuedAt) > WALLET_AUTH_WINDOW_MS) return null;

  const checksumAddress = getAddress(address);
  const message = buildRecipeAccessMessage(recipeId, checksumAddress, timestamp);
  const valid = await verifyMessage({
    address: checksumAddress,
    message,
    signature: signature as Hex,
  }).catch(() => false);

  return valid ? checksumAddress.toLowerCase() : null;
}

function isUniqueConstraintError(error: unknown) {
  const message = String(error).toLowerCase();
  return message.includes("unique constraint") || message.includes("constraint failed");
}

async function recordUnlockOnce(
  recipe: typeof recipes.$inferSelect,
  buyerAddress: string,
  txHash: string,
) {
  const existingUnlock = (
    await db
      .select({ id: unlocks.id })
      .from(unlocks)
      .where(
        and(eq(unlocks.recipeId, recipe.id), eq(unlocks.buyerAddress, buyerAddress)),
      )
      .limit(1)
  )[0];

  if (existingUnlock) return false;

  const priceUsdcAtomic = getPriceUsdcAtomic(recipe);

  try {
    await db.insert(unlocks).values({
      id: uuid(),
      recipeId: recipe.id,
      buyerAddress,
      paidAmount: usdcAtomicToUsdNumber(priceUsdcAtomic),
      paidAmountUsdcAtomic: priceUsdcAtomic,
      txHash,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return false;
    throw error;
  }

  await db
    .update(recipes)
    .set({ unlockCount: sql`${recipes.unlockCount} + 1` })
    .where(eq(recipes.id, recipe.id));

  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();

  const recipe = (
    await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1)
  )[0];

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  if (recipe.isFree === 1) {
    return NextResponse.json(getFullRecipeContent(recipe));
  }

  const authenticatedBuyerAddress = await getAuthenticatedBuyerAddress(req, id);
  if (authenticatedBuyerAddress) {
    const existingUnlock = (
      await db
        .select({ id: unlocks.id })
        .from(unlocks)
        .where(
          and(
            eq(unlocks.recipeId, id),
            eq(unlocks.buyerAddress, authenticatedBuyerAddress),
          ),
        )
        .limit(1)
    )[0];

    if (existingUnlock) {
      return NextResponse.json(getFullRecipeContent(recipe));
    }
  }

  const handler = async () => {
    return NextResponse.json(getFullRecipeContent(recipe));
  };

  const wrapped = withX402(
    handler,
    // Payments settle to the reputable PAYOUT_ADDRESS (ack-onchain.base.eth),
    // decoupled from the creator's identity address.
    PAYOUT_ADDRESS,
    {
      price: {
        amount: getPriceUsdcAtomic(recipe).toString(),
        asset: getDefaultAsset("base"),
      },
      network: "base",
      config: {
        description: `Unlock "${recipe.title}"`,
      },
    },
    // Base-mainnet-capable facilitator (payai). Without this, x402-next
    // defaults to the testnet-only facilitator and settlement fails with
    // "unexpected_error". payai needs no API keys.
    { url: X402_FACILITATOR_URL },
  );

  const response = await wrapped(req);
  const paymentResponse = response.headers.get("x-payment-response");

  if (response.ok && paymentResponse) {
    try {
      const settlement = decodeXPaymentResponse(paymentResponse);
      const buyerAddress = settlement.payer.toLowerCase();
      await recordUnlockOnce(recipe, buyerAddress, settlement.transaction);
    } catch (error) {
      console.error("Failed to record x402 unlock", {
        recipeId: recipe.id,
        error,
      });
    }
  }

  return response;
}
