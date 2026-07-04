import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  creators: new Map<string, Record<string, unknown>>(),
  recipes: new Map<string, Record<string, unknown>>(),
  deleteCalls: 0,
  insertCalls: 0,
}));

vi.mock("./db", () => ({
  default: {
    insert: vi.fn(() => ({
      values: vi.fn((value: Record<string, unknown>) => ({
        onConflictDoUpdate: vi.fn(
          (config: { set: Record<string, unknown> }) => {
            dbState.insertCalls += 1;

            if (typeof value.address === "string") {
              dbState.creators.set(value.address, {
                ...dbState.creators.get(value.address),
                ...value,
                ...config.set,
              });
              return;
            }

            if (typeof value.id === "string") {
              dbState.recipes.set(value.id, {
                ...dbState.recipes.get(value.id),
                ...value,
                ...config.set,
              });
            }
          },
        ),
      })),
    })),
    delete: vi.fn(() => {
      dbState.deleteCalls += 1;
      throw new Error("seedDatabase must not delete existing rows");
    }),
  },
}));

import { seedDatabase } from "./seed";

describe("seedDatabase", () => {
  beforeEach(() => {
    dbState.creators.clear();
    dbState.recipes.clear();
    dbState.deleteCalls = 0;
    dbState.insertCalls = 0;
  });

  it("preserves non-sample creators and recipes", async () => {
    dbState.creators.set("0xnonSampleCreator", {
      address: "0xnonSampleCreator",
      name: "Existing Creator",
      slug: "existing-creator",
    });
    dbState.recipes.set("non-sample-recipe", {
      id: "non-sample-recipe",
      creatorAddress: "0xnonSampleCreator",
      title: "Existing Recipe",
    });

    const result = await seedDatabase();

    expect(result).toEqual({
      message: "Sample database seeded",
      creators: 1,
      recipes: 4,
    });
    expect(dbState.deleteCalls).toBe(0);
    expect(dbState.creators.get("0xnonSampleCreator")).toMatchObject({
      name: "Existing Creator",
      slug: "existing-creator",
    });
    expect(dbState.recipes.get("non-sample-recipe")).toMatchObject({
      creatorAddress: "0xnonSampleCreator",
      title: "Existing Recipe",
    });
    expect([...dbState.creators.values()]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: "tmoney145" }),
      ]),
    );
    expect([...dbState.recipes.values()]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: "lemon-blueberry-cake", isFree: 0 }),
      ]),
    );
  });
});
