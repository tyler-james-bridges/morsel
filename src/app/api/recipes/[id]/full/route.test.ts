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
}));

const mocks = vi.hoisted(() => ({
  withX402: vi.fn(),
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

vi.mock("x402-next", () => ({
  withX402: mocks.withX402,
}));

vi.mock("x402/shared", () => ({
  decodeXPaymentResponse: mocks.decodeXPaymentResponse,
  getDefaultAsset: vi.fn(() => ({
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    eip712: { name: "USD Coin", version: "2" },
  })),
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

function makeRequest(headers?: HeadersInit) {
  return new NextRequest("http://localhost/api/recipes/recipe-1/full", {
    headers,
  });
}

async function callRoute(headers?: HeadersInit) {
  return GET(makeRequest(headers), {
    params: Promise.resolve({ id: "recipe-1" }),
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
  mocks.decodeXPaymentResponse.mockReset();
  mocks.verifyMessage.mockReset();

  mocks.verifyMessage.mockImplementation(async () => state.verifyMessage);
  mocks.decodeXPaymentResponse.mockImplementation(() => state.settlement);
  mocks.withX402.mockImplementation((handler) => async (req: NextRequest) => {
    const payment = req.headers.get("x-payment");
    if (!payment) {
      return Response.json({ x402Version: 1, accepts: [] }, { status: 402 });
    }
    if (payment !== "valid") {
      return Response.json({ error: "invalid payment" }, { status: 402 });
    }

    const response = await handler(req);
    response.headers.set("x-payment-response", "settled");
    return response;
  });
});

describe("GET /api/recipes/[id]/full", () => {
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
    const response = await callRoute({ "x-payment": "valid" });
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
