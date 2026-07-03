import { NextRequest } from "next/server";
import { validateDiscoveryExtension } from "@x402/extensions/bazaar";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  existingCreator: null as Record<string, unknown> | null,
  insertedCreators: [] as Record<string, unknown>[],
  insertedRecipes: [] as Record<string, unknown>[],
  verifyMessage: false,
  paymentRequired: {
    x402Version: 2,
    error: "Payment required",
    resource: { url: "http://localhost/api/recipes/create" },
    accepts: [
      {
        scheme: "exact",
        network: "eip155:8453",
        amount: "100000",
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        payTo: "0x668aDd9213985E7Fd613Aec87767C892f4b9dF1c",
        maxTimeoutSeconds: 300,
        extra: { name: "USD Coin", version: "2", decimals: 6 },
      },
    ],
  },
  settlement: {
    payer: "0x0000000000000000000000000000000000000002",
    transaction: "0xtxhash",
  },
}));

const mocks = vi.hoisted(() => ({
  withX402: vi.fn(),
  decodePaymentRequired: vi.fn(),
  decodePaymentResponse: vi.fn(),
  verifyMessage: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => state.existingCreator ? [state.existingCreator] : []),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async (value: Record<string, unknown>) => {
        if ("title" in value) state.insertedRecipes.push(value);
        else state.insertedCreators.push(value);
      }),
    })),
  };

  return {
    default: db,
    getDb: vi.fn(async () => db),
  };
});

vi.mock("@x402/next", () => ({
  withX402: mocks.withX402,
  x402ResourceServer: class {
    register = vi.fn().mockReturnThis();
  },
}));

vi.mock("@x402/core/server", () => ({
  HTTPFacilitatorClient: class {},
}));

vi.mock("@x402/core/http", () => ({
  decodePaymentRequiredHeader: mocks.decodePaymentRequired,
  decodePaymentResponseHeader: mocks.decodePaymentResponse,
}));

vi.mock("@x402/evm/exact/server", () => ({
  ExactEvmScheme: class {},
}));

vi.mock("viem", async () => {
  const actual = await vi.importActual<typeof import("viem")>("viem");
  return {
    ...actual,
    verifyMessage: mocks.verifyMessage,
  };
});

const { POST } = await import("./route");

const walletAddress = "0x0000000000000000000000000000000000000001";

function publishBody(overrides: Record<string, unknown> = {}) {
  return {
    title: "Chocolate Chip Cookies",
    description: "Crisp edges and soft centers.",
    imageUrl: "https://morsel.0x402.sh/images/recipes/chocolate-chip-cookies.png",
    price: "$0.50",
    cuisine: "american",
    mealType: "dessert",
    prepTime: 15,
    cookTime: 12,
    servings: 24,
    ingredients: ["flour", "butter"],
    steps: ["mix", "bake"],
    ...overrides,
  };
}

function makeRequest(body: unknown, headers?: HeadersInit) {
  return new NextRequest("http://localhost/api/recipes/create", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  state.existingCreator = null;
  state.insertedCreators = [];
  state.insertedRecipes = [];
  state.verifyMessage = false;
  mocks.withX402.mockReset();
  mocks.decodePaymentRequired.mockReset();
  mocks.decodePaymentResponse.mockReset();
  mocks.verifyMessage.mockReset();

  mocks.verifyMessage.mockImplementation(async () => state.verifyMessage);
  mocks.decodePaymentRequired.mockImplementation(() => state.paymentRequired);
  mocks.decodePaymentResponse.mockImplementation(() => state.settlement);
  mocks.withX402.mockImplementation((handler) => async (req: NextRequest) => {
    const payment = req.headers.get("payment-signature");
    if (!payment) {
      return Response.json(
        {},
        { status: 402, headers: { "payment-required": "encoded-requirements" } },
      );
    }
    if (payment !== "valid") {
      return Response.json(
        {},
        { status: 402, headers: { "payment-required": "encoded-requirements" } },
      );
    }

    const response = await handler(req);
    response.headers.set("payment-response", "settled");
    return response;
  });
});

describe("POST /api/recipes/create", () => {
  it("publishes for a wallet-authenticated creator without x402", async () => {
    state.verifyMessage = true;

    const response = await POST(makeRequest(publishBody({ creatorAddress: walletAddress }), {
      "x-wallet-address": walletAddress,
      "x-wallet-signature": "0xsig",
      "x-wallet-timestamp": Date.now().toString(),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.authMode).toBe("wallet");
    expect(state.insertedRecipes[0]).toMatchObject({
      creatorAddress: walletAddress,
      title: "Chocolate Chip Cookies",
      priceUsdcAtomic: 500_000,
    });
    expect(mocks.withX402).not.toHaveBeenCalled();
  });

  it("rejects invalid wallet auth instead of falling through to x402", async () => {
    const response = await POST(makeRequest(publishBody({ creatorAddress: walletAddress }), {
      "x-wallet-address": walletAddress,
      "x-wallet-signature": "0xsig",
      "x-wallet-timestamp": Date.now().toString(),
    }));

    expect(response.status).toBe(401);
    expect(state.insertedRecipes).toHaveLength(0);
    expect(mocks.withX402).not.toHaveBeenCalled();
  });

  it("returns an x402 publish challenge for unsigned agents", async () => {
    const response = await POST(makeRequest(publishBody()));
    const body = await response.json();
    const routeConfig = mocks.withX402.mock.calls[0][1];

    expect(response.status).toBe(402);
    expect(body.accepts[0].amount).toBe("100000");
    expect(routeConfig.extensions.bazaar.info.input.method).toBe("POST");
    expect(routeConfig.extensions.bazaar.info.input.bodyType).toBe("json");
    expect(validateDiscoveryExtension(routeConfig.extensions.bazaar).valid).toBe(true);
    expect(state.insertedRecipes).toHaveLength(0);
  });

  it("publishes under the x402 payer after settlement", async () => {
    const response = await POST(makeRequest(publishBody(), { "payment-signature": "valid" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.authMode).toBe("x402");
    expect(body.creatorAddress).toBe("0x0000000000000000000000000000000000000002");
    expect(response.headers.get("payment-response")).toBe("settled");
    expect(state.insertedRecipes[0]).toMatchObject({
      creatorAddress: "0x0000000000000000000000000000000000000002",
      title: "Chocolate Chip Cookies",
    });
  });

  it("does not trust creatorAddress without wallet auth", async () => {
    const response = await POST(makeRequest(publishBody({ creatorAddress: walletAddress })));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("creatorAddress requires wallet signature");
    expect(state.insertedRecipes).toHaveLength(0);
    expect(mocks.withX402).not.toHaveBeenCalled();
  });
});
