import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import db, { getDb } from "@/lib/db";
import { recipes, unlocks } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

interface X402PaymentHeader {
  payload?: {
    authorization?: {
      from?: string;
      nonce?: string;
    };
    signature?: string;
  };
  transaction?: string;
  txHash?: string;
}

function decodePaymentHeader(header: string): X402PaymentHeader | null {
  try {
    const normalized = header.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getPaymentDetails(req: NextRequest) {
  const paymentHeader = req.headers.get("x-payment");
  if (!paymentHeader) return null;

  const payment = decodePaymentHeader(paymentHeader);
  const buyerAddress = payment?.payload?.authorization?.from?.toLowerCase();
  if (!buyerAddress || !/^0x[a-f0-9]{40}$/.test(buyerAddress)) return null;

  return {
    buyerAddress,
    txHash:
      payment?.txHash ??
      payment?.transaction ??
      payment?.payload?.signature ??
      payment?.payload?.authorization?.nonce,
  };
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

  const handler = async () => {
    return NextResponse.json({
      ingredients: JSON.parse(recipe.ingredients),
      steps: JSON.parse(recipe.steps),
      notes: recipe.notes,
    });
  };

  const wrapped = withX402(
    handler,
    recipe.creatorAddress as `0x${string}`,
    {
      price: `$${recipe.price.toFixed(2)}`,
      network: "base",
      config: {
        description: `Unlock "${recipe.title}"`,
      },
    },
  );

  const response = await wrapped(req);
  const payment = getPaymentDetails(req);
  const paymentResponse = response.headers.get("x-payment-response");

  if (response.ok && payment && paymentResponse) {
    const existingUnlock = (
      await db
        .select({ id: unlocks.id })
        .from(unlocks)
        .where(
          and(
            eq(unlocks.recipeId, id),
            eq(unlocks.buyerAddress, payment.buyerAddress),
          ),
        )
        .limit(1)
    )[0];

    if (!existingUnlock) {
      await db.insert(unlocks).values({
        id: uuid(),
        recipeId: id,
        buyerAddress: payment.buyerAddress,
        paidAmount: recipe.price,
        txHash: payment.txHash ?? null,
      });

      await db
        .update(recipes)
        .set({ unlockCount: sql`${recipes.unlockCount} + 1` })
        .where(eq(recipes.id, id));
    }
  }

  return response;
}
