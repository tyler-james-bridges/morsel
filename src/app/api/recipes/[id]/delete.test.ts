import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recipes } from "@/lib/schema";

const dbState = vi.hoisted(() => ({
  recipeRows: [] as Array<{ id: string; slug: string; creatorAddress: string }>,
  unlockRows: [] as Array<{ id: string }>,
  deletedTables: [] as unknown[],
  recipesTable: undefined as unknown,
}));

const dbMock = vi.hoisted(() => ({
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn(() => ({
        limit: vi.fn(async () => {
          if (table === dbState.recipesTable) return dbState.recipeRows;
          return dbState.unlockRows;
        }),
      })),
    })),
  })),
  delete: vi.fn((table: unknown) => ({
    where: vi.fn(async () => {
      dbState.deletedTables.push(table);
    }),
  })),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => dbMock),
}));

const authState = vi.hoisted(() => ({
  hasWalletHeaders: false,
  authenticatedCreator: null as string | null,
}));

vi.mock("@/lib/recipe-publish", () => ({
  hasCreatorWalletAuthHeaders: vi.fn(() => authState.hasWalletHeaders),
  getAuthenticatedCreatorAddress: vi.fn(
    async () => authState.authenticatedCreator,
  ),
}));

import * as route from "./route";

const CREATOR_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const OTHER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const originalSeedSecret = process.env.MORSEL_SEED_ADMIN_SECRET;

function makeRequest(secret?: string) {
  return new NextRequest("http://localhost/api/recipes/recipe-1", {
    method: "DELETE",
    headers: secret ? { "x-morsel-seed-secret": secret } : undefined,
  });
}

function makeParams(id = "recipe-1") {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/recipes/[id]", () => {
  beforeEach(() => {
    dbState.recipeRows = [
      {
        id: "recipe-1",
        slug: "recipe-one",
        creatorAddress: CREATOR_ADDRESS,
      },
    ];
    authState.hasWalletHeaders = false;
    authState.authenticatedCreator = null;
    dbState.unlockRows = [];
    dbState.deletedTables = [];
    dbState.recipesTable = recipes;
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";
  });

  afterEach(() => {
    if (originalSeedSecret === undefined) {
      delete process.env.MORSEL_SEED_ADMIN_SECRET;
    } else {
      process.env.MORSEL_SEED_ADMIN_SECRET = originalSeedSecret;
    }
  });

  it("keeps deletion disabled unless the admin secret env is configured", async () => {
    delete process.env.MORSEL_SEED_ADMIN_SECRET;

    const response = await route.DELETE(makeRequest("anything"), makeParams());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Recipe deletion is disabled",
    });
    expect(dbState.deletedTables).toEqual([]);
  });

  it("rejects requests without the admin secret", async () => {
    const response = await route.DELETE(makeRequest(), makeParams());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(dbState.deletedTables).toEqual([]);
  });

  it("returns 404 for an unknown recipe id", async () => {
    dbState.recipeRows = [];

    const response = await route.DELETE(
      makeRequest("dev-secret"),
      makeParams("missing"),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Recipe not found",
    });
    expect(dbState.deletedTables).toEqual([]);
  });

  it("refuses to delete a recipe that has been unlocked", async () => {
    dbState.unlockRows = [{ id: "unlock-1" }];

    const response = await route.DELETE(makeRequest("dev-secret"), makeParams());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Recipe has been unlocked by buyers and cannot be deleted",
    });
    expect(dbState.deletedTables).toEqual([]);
  });

  it("deletes the recipe when the admin secret matches", async () => {
    const response = await route.DELETE(makeRequest("dev-secret"), makeParams());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Recipe deleted",
      id: "recipe-1",
      slug: "recipe-one",
    });
    expect(dbState.deletedTables).toEqual([recipes]);
  });

  it("lets the creator delete their own recipe with a wallet signature", async () => {
    delete process.env.MORSEL_SEED_ADMIN_SECRET;
    authState.hasWalletHeaders = true;
    authState.authenticatedCreator = CREATOR_ADDRESS;

    const response = await route.DELETE(makeRequest(), makeParams());

    expect(response.status).toBe(200);
    expect(dbState.deletedTables).toEqual([recipes]);
  });

  it("rejects wallet requests with an invalid signature", async () => {
    authState.hasWalletHeaders = true;
    authState.authenticatedCreator = null;

    const response = await route.DELETE(makeRequest(), makeParams());

    expect(response.status).toBe(401);
    expect(dbState.deletedTables).toEqual([]);
  });

  it("refuses deletion by a wallet that is not the creator", async () => {
    authState.hasWalletHeaders = true;
    authState.authenticatedCreator = OTHER_ADDRESS;

    const response = await route.DELETE(makeRequest(), makeParams());

    expect(response.status).toBe(403);
    expect(dbState.deletedTables).toEqual([]);
  });
});
