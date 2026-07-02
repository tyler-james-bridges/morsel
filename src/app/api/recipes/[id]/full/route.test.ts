import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  recipe: null as Record<string, unknown> | null,
  existingUnlock: null as { id: string } | null,
  insertedUnlocks: [] as Record<string, unknown>[],
  insertError: null as Error | null,
  updateCount: 0,
  verifyMessage: false,
  settlement: {
    payer: "0x0000000000000000000000000000000000000001",
    transaction: "0xtxhash",
  },
  paymentRequired: {
    x402Version: 2,
    error: "Payment required",
    resource: { url: "http://localhost/api/recipes/recipe-1/full" },
    accepts: [
      {
        scheme: "exact",
        network: "eip155:8453",
        amount: "500000",
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        payTo: "0x668aDd9213985E7Fd613Aec87767C892f4b9dF1c",
        maxTimeoutSeconds: 300,
        extra: { name: "USD Coin", version: "2", decimals: 6 },
      },
    ],
  },
}));

const mocks = vi.hoisted(() => ({
  withX402: vi.fn(),
  decodePaymentRequired: vi.fn(),
  decodeXPaymentResponse: vi.fn(),
  verifyMessage: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  let selectCount = 0;
  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => {
            selectCount += 1;
            if (selectCount === 1) return state.recipe ? [state.recipe] : [];
            return state.existingUnlock ? [state.existingUnlock] : [];
          }),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async (value: Record<string, unknown>) => {
        if (state.insertError) throw state.insertError;
        state.insertedUnlocks.push(value);
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => {
          state.updateCount += 1;
        }),
      })),
    })),
    resetSelectCount: () => {
      selectCount = 0;
    },
  };

  return {
    default: db,
    db,
    getDb: vi.fn(async () => {
      db.resetSelectCount();
      return db;
    }),
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
  decodePaymentResponseHeader: mocks.decodeXPaymentResponse,
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

const { GET } = await import("./route");
const { createRecipeAccessCookie } = await import("@/lib/recipe-access-cookie");

function makeRecipe(overrides: Record<string, unknown> = {}) {
  return {
    id: "recipe-1",
    title: "Paid recipe",
    creatorAddress: "0x1111111111111111111111111111111111111111",
    price: 0.5,
    priceUsdcAtomic: 500_000,
    isFree: 0,
    ingredients: JSON.stringify(["salt"]),
    steps: JSON.stringify(["mix"]),
    notes: "serve warm",
    ...overrides,
  };
}

function makeRequest(headers?: HeadersInit, id = "recipe-1") {
  return new NextRequest(`http://localhost/api/recipes/${id}/full`, {
    headers,
  });
}

async function callRoute(headers?: HeadersInit, id = "recipe-1") {
  return GET(makeRequest(headers, id), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  process.env.MORSEL_ACCESS_TOKEN_SECRET = "test-secret";
  state.recipe = makeRecipe();
  state.existingUnlock = null;
  state.insertedUnlocks = [];
  state.insertError = null;
  state.updateCount = 0;
  state.verifyMessage = false;
  mocks.withX402.mockReset();
  mocks.decodePaymentRequired.mockReset();
  mocks.decodeXPaymentResponse.mockReset();
  mocks.verifyMessage.mockReset();

  mocks.verifyMessage.mockImplementation(async () => state.verifyMessage);
  mocks.decodePaymentRequired.mockImplementation(() => state.paymentRequired);
  mocks.decodeXPaymentResponse.mockImplementation(() => state.settlement);
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

describe("GET /api/recipes/[id]/full", () => {
  it("returns an x402 challenge for the OpenAPI template path", async () => {
    const response = await callRoute(undefined, "{id}");
    const routeConfig = mocks.withX402.mock.calls[0][1];
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body.accepts[0].amount).toBe("500000");
    expect(response.headers.get("payment-required")).toBe("encoded-requirements");
    expect(mocks.withX402).toHaveBeenCalledTimes(1);
    expect(routeConfig.extensions.bazaar.schema.properties.input).toBeDefined();
    expect(routeConfig.extensions.bazaar.schema.properties.output).toBeDefined();
  });

  it("does not accept payments sent to the OpenAPI template path", async () => {
    const response = await callRoute({ "payment-signature": "valid" }, "{id}");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Use a concrete recipe ID");
    expect(mocks.withX402).not.toHaveBeenCalled();
  });

  it("returns free recipes without x402", async () => {
    state.recipe = makeRecipe({ isFree: 1 });

    const response = await callRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ingredients).toEqual(["salt"]);
    expect(mocks.withX402).not.toHaveBeenCalled();
    expect(state.insertedUnlocks).toHaveLength(0);
  });

  it("returns existing unlocks after wallet proof without charging", async () => {
    state.existingUnlock = { id: "unlock-1" };
    state.verifyMessage = true;

    const response = await callRoute({
      "x-wallet-address": "0x0000000000000000000000000000000000000001",
      "x-wallet-signature": "0xsig",
      "x-wallet-timestamp": Date.now().toString(),
    });

    expect(response.status).toBe(200);
    expect(mocks.withX402).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain("morsel_access_");
    expect(state.insertedUnlocks).toHaveLength(0);
  });

  it("returns existing unlocks from access cookie without wallet proof", async () => {
    state.existingUnlock = { id: "unlock-1" };
    const cookie = createRecipeAccessCookie(
      "recipe-1",
      "0x0000000000000000000000000000000000000001",
    );

    const response = await callRoute({ Cookie: cookie?.split(";")[0] ?? "" });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ingredients).toEqual(["salt"]);
    expect(mocks.verifyMessage).not.toHaveBeenCalled();
    expect(mocks.withX402).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("does not bypass payment for invalid wallet proof", async () => {
    state.verifyMessage = false;

    const response = await callRoute({
      "x-wallet-address": "0x0000000000000000000000000000000000000001",
      "x-wallet-signature": "0xsig",
      "x-wallet-timestamp": Date.now().toString(),
    });

    expect(response.status).toBe(402);
    expect(mocks.withX402).toHaveBeenCalledTimes(1);
    expect(state.insertedUnlocks).toHaveLength(0);
  });

  it("records a successful x402 settlement exactly once", async () => {
    const response = await callRoute({ "payment-signature": "valid" });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.steps).toEqual(["mix"]);
    expect(state.insertedUnlocks).toEqual([
      expect.objectContaining({
        recipeId: "recipe-1",
        buyerAddress: "0x0000000000000000000000000000000000000001",
        paidAmount: 0.5,
        paidAmountUsdcAtomic: 500_000,
        txHash: "0xtxhash",
      }),
    ]);
    expect(state.updateCount).toBe(1);
    expect(response.headers.get("set-cookie")).toContain("morsel_access_");
  });

  it("accepts legacy x-payment retries", async () => {
    const response = await callRoute({ "x-payment": "valid" });

    expect(response.status).toBe(200);
    expect(state.insertedUnlocks).toHaveLength(1);
  });

  it("still returns paid content if unlock recording fails", async () => {
    state.insertError = new Error("database unavailable");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await callRoute({ "x-payment": "valid" });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.steps).toEqual(["mix"]);
      expect(state.insertedUnlocks).toHaveLength(0);
      expect(state.updateCount).toBe(0);
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to record x402 unlock",
        expect.objectContaining({ recipeId: "recipe-1" }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
