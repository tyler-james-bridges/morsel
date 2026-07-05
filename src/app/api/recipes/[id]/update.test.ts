import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recipes } from "@/lib/schema";

const dbState = vi.hoisted(() => ({
  recipeRows: [] as Array<{
    id: string;
    slug: string;
    creatorAddress: string;
  }>,
  updates: [] as Array<{ table: unknown; values: Record<string, unknown> }>,
  recipesTable: undefined as unknown,
}));

const dbMock = vi.hoisted(() => ({
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(async () => dbState.recipeRows),
      })),
    })),
  })),
  update: vi.fn((table: unknown) => ({
    set: vi.fn((values: Record<string, unknown>) => ({
      where: vi.fn(async () => {
        dbState.updates.push({ table, values });
      }),
    })),
  })),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => dbMock),
}));

const authState = vi.hoisted(() => ({
  authenticatedCreator: null as string | null,
}));

vi.mock("@/lib/recipe-publish", () => ({
  hasCreatorWalletAuthHeaders: vi.fn(() => true),
  getAuthenticatedCreatorAddress: vi.fn(
    async () => authState.authenticatedCreator,
  ),
}));

import * as route from "./route";

const CREATOR_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const OTHER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/recipes/recipe-1", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(id = "recipe-1") {
  return { params: Promise.resolve({ id }) };
}

describe("PUT /api/recipes/[id]", () => {
  beforeEach(() => {
    dbState.recipeRows = [
      { id: "recipe-1", slug: "recipe-one", creatorAddress: CREATOR_ADDRESS },
    ];
    dbState.updates = [];
    authState.authenticatedCreator = CREATOR_ADDRESS;
  });

  it("requires a valid wallet signature", async () => {
    authState.authenticatedCreator = null;

    const response = await route.PUT(
      makeRequest({ title: "New Title" }),
      makeParams(),
    );

    expect(response.status).toBe(401);
    expect(dbState.updates).toEqual([]);
  });

  it("rejects unsupported prices", async () => {
    const response = await route.PUT(
      makeRequest({ price: "$9.99" }),
      makeParams(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "price must be one of $0.25, $0.50, $0.75",
    });
    expect(dbState.updates).toEqual([]);
  });

  it("rejects bodies with no updatable fields", async () => {
    const response = await route.PUT(
      makeRequest({ slug: "not-allowed" }),
      makeParams(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No updatable fields provided",
    });
  });

  it("returns 404 for an unknown recipe", async () => {
    dbState.recipeRows = [];

    const response = await route.PUT(
      makeRequest({ title: "New Title" }),
      makeParams("missing"),
    );

    expect(response.status).toBe(404);
    expect(dbState.updates).toEqual([]);
  });

  it("refuses updates from a wallet that is not the creator", async () => {
    authState.authenticatedCreator = OTHER_ADDRESS;

    const response = await route.PUT(
      makeRequest({ title: "New Title" }),
      makeParams(),
    );

    expect(response.status).toBe(403);
    expect(dbState.updates).toEqual([]);
  });

  it("updates allowed fields and derives price columns", async () => {
    const response = await route.PUT(
      makeRequest({
        title: "Filipino Banana Buñuelos, Revised",
        price: "$0.50",
        ingredients: ["2 bananas", "1 cup flour"],
        isFree: false,
      }),
      makeParams(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      id: "recipe-1",
      slug: "recipe-one",
    });
    expect(dbState.updates).toEqual([
      {
        table: recipes,
        values: {
          title: "Filipino Banana Buñuelos, Revised",
          price: 0.5,
          priceUsdcAtomic: 500_000,
          ingredients: JSON.stringify(["2 bananas", "1 cup flour"]),
          isFree: 0,
        },
      },
    ]);
  });
});
