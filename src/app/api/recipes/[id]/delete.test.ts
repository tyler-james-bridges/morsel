import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recipes, unlocks } from "@/lib/schema";

const dbState = vi.hoisted(() => ({
  recipeRows: [] as Array<{ id: string; slug: string }>,
  paymentEventRows: [] as Array<{ id: string }>,
  deletedTables: [] as unknown[],
  recipesTable: undefined as unknown,
}));

const dbMock = vi.hoisted(() => ({
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn(() => ({
        limit: vi.fn(async () => {
          if (table === dbState.recipesTable) return dbState.recipeRows;
          return dbState.paymentEventRows;
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

import * as route from "./route";

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
    dbState.recipeRows = [{ id: "recipe-1", slug: "recipe-one" }];
    dbState.paymentEventRows = [];
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

  it("refuses to delete a recipe with settled payments", async () => {
    dbState.paymentEventRows = [{ id: "payment-1" }];

    const response = await route.DELETE(makeRequest("dev-secret"), makeParams());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Recipe has settled payments and cannot be deleted",
    });
    expect(dbState.deletedTables).toEqual([]);
  });

  it("deletes unlocks then the recipe when the admin secret matches", async () => {
    const response = await route.DELETE(makeRequest("dev-secret"), makeParams());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Recipe deleted",
      id: "recipe-1",
      slug: "recipe-one",
    });
    expect(dbState.deletedTables).toEqual([unlocks, recipes]);
  });
});
