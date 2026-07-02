import { NextRequest, NextResponse } from "next/server";
import {
  decodePaymentRequiredHeader,
  decodePaymentResponseHeader,
} from "@x402/core/http";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { withX402, x402ResourceServer } from "@x402/next";
import db, { getDb } from "@/lib/db";
import {
  getPriceUsdcAtomic,
  SUPPORTED_RECIPE_PRICE_USDC_ATOMIC,
  usdcAtomicToUsdNumber,
} from "@/lib/money";
import { PAYOUT_ADDRESS, X402_FACILITATOR_URL } from "@/lib/payment";
import {
  createRecipeAccessCookie,
  getRecipeAccessCookieName,
  readRecipeAccessCookie,
} from "@/lib/recipe-access-cookie";
import { recipes, unlocks } from "@/lib/schema";
import {
  buildRecipeAccessMessage,
  WALLET_AUTH_WINDOW_MS,
} from "@/lib/wallet-auth";
import { and, eq, sql } from "drizzle-orm";
import { getAddress, isAddress, verifyMessage, type Hex } from "viem";
import { v4 as uuid } from "uuid";

const BASE_NETWORK: Network = "eip155:8453";
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_EXTRA = { name: "USD Coin", version: "2", decimals: 6 };
const OPENAPI_TEMPLATE_ID = "{id}";
const FULL_RECIPE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    ingredients: { type: "array", items: { type: "string" } },
    steps: { type: "array", items: { type: "string" } },
    notes: { type: ["string", "null"] },
  },
};
type DiscoveryExtension = ReturnType<typeof declareDiscoveryExtension>;

function withDiscoveryMethod(extension: DiscoveryExtension, method: "GET") {
  return {
    ...extension,
    bazaar: {
      ...extension.bazaar,
      info: {
        ...extension.bazaar.info,
        input: { ...extension.bazaar.info.input, method },
      },
    },
  };
}

const FULL_RECIPE_DISCOVERY_EXTENSION = withDiscoveryMethod(
  declareDiscoveryExtension({
    inputSchema: { properties: {} },
    output: { example: {}, schema: FULL_RECIPE_OUTPUT_SCHEMA },
  }),
  "GET",
);

let resourceServer: x402ResourceServer | null = null;

function getX402Server() {
  if (!resourceServer) {
    resourceServer = new x402ResourceServer(
      new HTTPFacilitatorClient({ url: X402_FACILITATOR_URL }),
    ).register(BASE_NETWORK, new ExactEvmScheme());
  }
  return resourceServer;
}

function getFullRecipeContent(recipe: typeof recipes.$inferSelect) {
  return {
    ingredients: JSON.parse(recipe.ingredients),
    steps: JSON.parse(recipe.steps),
    notes: recipe.notes,
  };
}

function appendAccessCookie(
  response: NextResponse,
  recipeId: string,
  buyerAddress: string,
) {
  const cookie = createRecipeAccessCookie(recipeId, buyerAddress);
  if (cookie) response.headers.append("Set-Cookie", cookie);
  return response;
}

function hasPaymentHeader(req: NextRequest) {
  return Boolean(req.headers.get("payment-signature") || req.headers.get("x-payment"));
}

function normalizePaymentHeader(req: NextRequest) {
  const legacyPayment = req.headers.get("x-payment");
  if (!legacyPayment || req.headers.get("payment-signature")) return req;

  const headers = new Headers(req.headers);
  headers.set("payment-signature", legacyPayment);
  return new NextRequest(req.url, { headers, method: req.method });
}

function withPaymentRequiredBody(response: NextResponse) {
  const header = response.headers.get("payment-required");
  if (!header || (response.status !== 402 && response.status !== 412)) return response;

  try {
    return NextResponse.json(decodePaymentRequiredHeader(header), {
      status: response.status,
      headers: new Headers(response.headers),
    });
  } catch {
    return response;
  }
}

function withRecipePayment(
  handler: (req: NextRequest) => Promise<NextResponse>,
  amount: number,
  description: string,
) {
  return withX402(
    handler,
    {
      accepts: [
        {
          scheme: "exact",
          payTo: PAYOUT_ADDRESS,
          price: { amount: amount.toString(), asset: BASE_USDC, extra: USDC_EXTRA },
          network: BASE_NETWORK,
        },
      ],
      description,
      mimeType: "application/json",
      extensions: FULL_RECIPE_DISCOVERY_EXTENSION,
    },
    getX402Server(),
  );
}

async function hasRecordedUnlock(recipeId: string, buyerAddress: string) {
  const existingUnlock = (
    await db
      .select({ id: unlocks.id })
      .from(unlocks)
      .where(and(eq(unlocks.recipeId, recipeId), eq(unlocks.buyerAddress, buyerAddress)))
      .limit(1)
  )[0];

  return Boolean(existingUnlock);
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
  // When false, the unlock row is still recorded (so this address can read the
  // recipe later) but recipe.unlockCount is NOT incremented. Used when the same
  // payment is recorded under multiple addresses (payer + connected wallet) to
  // avoid double-counting a single purchase.
  incrementCount = true,
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

  if (incrementCount) {
    await db
      .update(recipes)
      .set({ unlockCount: sql`${recipes.unlockCount} + 1` })
      .where(eq(recipes.id, recipe.id));
  }

  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // x402scan bulk registration probes templated OpenAPI paths literally.
  if (id === OPENAPI_TEMPLATE_ID) {
    if (hasPaymentHeader(req)) {
      return NextResponse.json({ error: "Use a concrete recipe ID" }, { status: 404 });
    }

    const wrapped = withRecipePayment(
      async () => NextResponse.json({ error: "Use a concrete recipe ID" }, { status: 404 }),
      SUPPORTED_RECIPE_PRICE_USDC_ATOMIC[0],
      "Unlock a paid Morsel recipe",
    );

    return withPaymentRequiredBody(await wrapped(req));
  }

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

  const cookieBuyerAddress = readRecipeAccessCookie(
    id,
    req.cookies.get(getRecipeAccessCookieName(id))?.value,
  );
  if (cookieBuyerAddress && await hasRecordedUnlock(id, cookieBuyerAddress)) {
    return appendAccessCookie(
      NextResponse.json(getFullRecipeContent(recipe)),
      id,
      cookieBuyerAddress,
    );
  }

  const authenticatedBuyerAddress = await getAuthenticatedBuyerAddress(req, id);
  if (authenticatedBuyerAddress) {
    if (await hasRecordedUnlock(id, authenticatedBuyerAddress)) {
      return appendAccessCookie(
        NextResponse.json(getFullRecipeContent(recipe)),
        id,
        authenticatedBuyerAddress,
      );
    }
  }

  const handler = async () => {
    return NextResponse.json(getFullRecipeContent(recipe));
  };

  const wrapped = withRecipePayment(
    handler,
    getPriceUsdcAtomic(recipe),
    `Unlock "${recipe.title}"`,
  );

  const response = await wrapped(normalizePaymentHeader(req));
  const paymentResponse =
    response.headers.get("payment-response") ??
    response.headers.get("x-payment-response");

  if (response.ok && paymentResponse) {
    try {
      const settlement = decodePaymentResponseHeader(paymentResponse);
      const payerAddress = settlement.payer?.toLowerCase();
      if (!payerAddress || !settlement.transaction) {
        throw new Error("Missing x402 settlement details");
      }

      // Record the unlock under every address the buyer might present on a
      // later request so restore checks can match:
      //  - the connected wallet (authenticatedBuyerAddress), which is what the
      //    client can prove with a wallet-auth signature
      //  - the onchain payer, which can differ for smart/delegated wallets
      const addressesToRecord = new Set<string>([payerAddress]);
      if (authenticatedBuyerAddress) {
        addressesToRecord.add(authenticatedBuyerAddress);
      }

      // Increment unlockCount only once per payment, on the first address.
      let first = true;
      for (const buyerAddress of addressesToRecord) {
        await recordUnlockOnce(
          recipe,
          buyerAddress,
          settlement.transaction,
          first,
        );
        first = false;
      }

      appendAccessCookie(
        response,
        recipe.id,
        authenticatedBuyerAddress ?? payerAddress,
      );
    } catch (error) {
      console.error("Failed to record x402 unlock", {
        recipeId: recipe.id,
        error,
      });
    }
  }

  return withPaymentRequiredBody(response);
}
