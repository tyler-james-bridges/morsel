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
import { getDb } from "@/lib/db";
import { PAYOUT_ADDRESS, X402_FACILITATOR_URL } from "@/lib/payment";
import {
  getAuthenticatedCreatorAddress,
  hasCreatorWalletAuthHeaders,
  parseRecipePublishInput,
  publishRecipe,
  PUBLISH_FEE_USDC_ATOMIC,
  type RecipePublishInput,
} from "@/lib/recipe-publish";
import { getAddress, isAddress } from "viem";

const BASE_NETWORK: Network = "eip155:8453";
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_EXTRA = { name: "USD Coin", version: "2", decimals: 6 };
const PUBLISH_INPUT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    imageUrl: { type: "string" },
    price: { type: "string", enum: ["$0.25", "$0.50", "$0.75"] },
    cuisine: { type: "string" },
    mealType: { type: "string" },
    prepTime: { type: "integer" },
    cookTime: { type: "integer" },
    servings: { type: "integer" },
    ingredients: { type: "array", items: { type: "string" } },
    steps: { type: "array", items: { type: "string" } },
  },
  required: [
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
  ],
};
const PUBLISH_BAZAAR_INPUT_SCHEMA = {
  type: "object",
  properties: PUBLISH_INPUT_SCHEMA.properties,
};
const PUBLISH_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    id: { type: "string" },
    slug: { type: "string" },
    creatorAddress: { type: "string" },
    authMode: { type: "string", enum: ["wallet", "x402"] },
  },
};
type DiscoveryExtension = ReturnType<typeof declareDiscoveryExtension>;

let resourceServer: x402ResourceServer | null = null;

function withDiscoveryMethod(extension: DiscoveryExtension, method: "POST") {
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

const PUBLISH_DISCOVERY_EXTENSION = withDiscoveryMethod(
  declareDiscoveryExtension({
    bodyType: "json",
    inputSchema: PUBLISH_BAZAAR_INPUT_SCHEMA,
    output: { example: {}, schema: PUBLISH_OUTPUT_SCHEMA },
  }),
  "POST",
);

function getX402Server() {
  if (!resourceServer) {
    resourceServer = new x402ResourceServer(
      new HTTPFacilitatorClient({ url: X402_FACILITATOR_URL }),
    ).register(BASE_NETWORK, new ExactEvmScheme());
  }
  return resourceServer;
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

function withPublishPayment(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withX402(
    handler,
    {
      accepts: [
        {
          scheme: "exact",
          payTo: PAYOUT_ADDRESS,
          price: {
            amount: PUBLISH_FEE_USDC_ATOMIC.toString(),
            asset: BASE_USDC,
            extra: USDC_EXTRA,
          },
          network: BASE_NETWORK,
        },
      ],
      description: "Publish a Morsel recipe",
      mimeType: "application/json",
      extensions: PUBLISH_DISCOVERY_EXTENSION,
    },
    getX402Server(),
  );
}

function bodyCreatorMatches(input: RecipePublishInput, creatorAddress: string) {
  return !input.creatorAddress || (
    isAddress(input.creatorAddress) &&
    getAddress(input.creatorAddress) === creatorAddress
  );
}

async function publishForCreator(
  input: RecipePublishInput,
  creatorAddress: string,
  authMode: "wallet" | "x402",
  headers?: Headers,
) {
  const published = await publishRecipe(input, creatorAddress);
  return NextResponse.json(
    { success: true, ...published, authMode },
    { status: 201, headers },
  );
}

async function publishWithX402(req: NextRequest, input: RecipePublishInput) {
  const wrapped = withPublishPayment(async () => NextResponse.json({ ok: true }));
  const response = await wrapped(normalizePaymentHeader(req));
  const paymentResponse =
    response.headers.get("payment-response") ??
    response.headers.get("x-payment-response");

  if (!response.ok || !paymentResponse) return withPaymentRequiredBody(response);

  const settlement = decodePaymentResponseHeader(paymentResponse);
  const payerAddress = settlement.payer;
  if (!payerAddress || !settlement.transaction || !isAddress(payerAddress)) {
    return NextResponse.json(
      { error: "Missing x402 settlement details" },
      { status: 500, headers: new Headers(response.headers) },
    );
  }

  return publishForCreator(
    input,
    getAddress(payerAddress),
    "x402",
    new Headers(response.headers),
  );
}

export async function POST(req: NextRequest) {
  await getDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseRecipePublishInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const input = parsed.input;
  if (hasCreatorWalletAuthHeaders(req)) {
    const creatorAddress = await getAuthenticatedCreatorAddress(req);
    if (!creatorAddress) {
      return NextResponse.json(
        { error: "Valid wallet signature is required to publish" },
        { status: 401 },
      );
    }
    if (!bodyCreatorMatches(input, creatorAddress)) {
      return NextResponse.json(
        { error: "creatorAddress must match the publishing wallet" },
        { status: 400 },
      );
    }

    return publishForCreator(input, creatorAddress, "wallet");
  }

  if (input.creatorAddress) {
    return NextResponse.json(
      { error: "creatorAddress requires wallet signature; omit it for x402 publishing" },
      { status: 400 },
    );
  }

  return publishWithX402(req, input);
}
