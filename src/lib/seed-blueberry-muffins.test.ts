import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
  onConflictDoNothing: vi.fn(),
  returning: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  onConflictDoUpdate: vi.fn(),
}));

vi.mock("./db", () => ({
  default: {
    select: dbMock.select,
    insert: dbMock.insert,
    update: dbMock.update,
    delete: dbMock.delete,
  },
}));

import { creators, recipes } from "./schema";
import { seedBlueberryMuffins, updateBlueberryMuffinsContent } from "./seed-blueberry-muffins";

const creatorAddress = "0xa102a2cb8AAc6C7d2c477412Ebb7d41d0Ce53495";
const recipeId = "7165e174-3864-4699-986a-411bb730ba1b";
const originalIngredients = [
  "1 1/2 cups all-purpose flour",
  "3/4 cup white sugar",
  "2 tsp baking powder",
  "1/2 tsp salt",
  "1/3 cup vegetable oil",
  "1 large egg",
  "1/3 cup milk, or more as needed",
  "1 cup fresh blueberries",
  "Crumb topping: 1/2 cup white sugar",
  "Crumb topping: 1/3 cup all-purpose flour",
  "Crumb topping: 1/4 cup butter, cubed",
  "Crumb topping: 1 1/2 tsp ground cinnamon",
];

function expectOriginalRecipeContent(row: Record<string, string>) {
  expect(JSON.parse(row.ingredients)).toEqual(originalIngredients);
  const steps = JSON.parse(row.steps);
  expect(steps).toHaveLength(8);
  expect(steps).toEqual(expect.arrayContaining([
    expect.stringContaining("400F (200C)"),
    expect.stringContaining("Measure 1/3 cup oil"),
    expect.stringContaining("combined volume to 1 cup"),
    expect.stringContaining("Do not overmix"),
    expect.stringContaining("Gently fold in the blueberries"),
    expect.stringContaining("filling to the top"),
    expect.stringContaining("20-25 minutes"),
  ]));
  expect(row.introContent).toContain("Source: [Colleen on Allrecipes](https://www.allrecipes.com/recipe/6865/to-die-for-blueberry-muffins/)");
  expect(row.introContent).toContain("AI-generated cover.");
  expect(row.introContent.split("\n\n")).toHaveLength(2);
  expect(row.notes).toContain("1 tbsp water to each of the 4 empty cups");
}

describe("seedBlueberryMuffins", () => {
  beforeEach(() => {
    Object.values(dbMock).forEach((mock) => mock.mockReset());
    dbMock.select.mockReturnValue({ from: dbMock.from });
    dbMock.from.mockReturnValue({ where: dbMock.where });
    dbMock.where.mockReturnValue({ limit: dbMock.limit });
    dbMock.insert.mockReturnValue({ values: dbMock.values });
    dbMock.values.mockReturnValue({
      onConflictDoNothing: dbMock.onConflictDoNothing,
      onConflictDoUpdate: dbMock.onConflictDoUpdate,
    });
    dbMock.onConflictDoNothing.mockReturnValue({ returning: dbMock.returning });
    dbMock.returning.mockResolvedValue([{ id: recipeId }]);
  });

  afterEach(() => {
    expect(dbMock.update).not.toHaveBeenCalled();
    expect(dbMock.delete).not.toHaveBeenCalled();
    expect(dbMock.onConflictDoUpdate).not.toHaveBeenCalled();
  });

  it("requires the existing creator before attempting a recipe lookup or insert", async () => {
    dbMock.limit.mockResolvedValueOnce([]);

    await expect(seedBlueberryMuffins()).rejects.toThrow("tmoney145 creator must exist");

    expect(dbMock.select).toHaveBeenCalledTimes(1);
    expect(dbMock.from).toHaveBeenCalledWith(creators);
    const query = new PgDialect().sqlToQuery(dbMock.where.mock.calls[0][0]);
    expect(query.params).toEqual(["tmoney145", creatorAddress]);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("returns an existing recipe without inserting or overwriting it", async () => {
    dbMock.limit
      .mockResolvedValueOnce([{ address: creatorAddress }])
      .mockResolvedValueOnce([{ id: "existing-muffin-id" }]);

    await expect(seedBlueberryMuffins()).resolves.toEqual({
      id: "existing-muffin-id",
      slug: "blueberry-muffins",
      created: false,
    });

    expect(dbMock.from).toHaveBeenNthCalledWith(2, recipes);
    const query = new PgDialect().sqlToQuery(dbMock.where.mock.calls[1][0]);
    expect(query.params).toEqual([creatorAddress, "blueberry-muffins"]);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("inserts only the original muffin recipe with its source credit and 25-cent price", async () => {
    dbMock.limit
      .mockResolvedValueOnce([{ address: creatorAddress }])
      .mockResolvedValueOnce([]);

    await expect(seedBlueberryMuffins()).resolves.toEqual({
      id: recipeId,
      slug: "blueberry-muffins",
      created: true,
    });

    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    expect(dbMock.insert).toHaveBeenCalledWith(recipes);
    const row = dbMock.values.mock.calls[0][0];
    expect(row).toMatchObject({
      id: recipeId,
      creatorAddress,
      title: "Blueberry Muffins",
      slug: "blueberry-muffins",
      imageUrl: "/images/recipes/blueberry-muffins.png",
      price: 0.25,
      priceUsdcAtomic: 250_000,
      isFree: 0,
      prepTime: 15,
      cookTime: 20,
      servings: 8,
    });
    expectOriginalRecipeContent(row);
    expect(dbMock.onConflictDoNothing).toHaveBeenCalledWith({ target: recipes.id });
  });

  it("reports an insert conflict as already present without overwriting content", async () => {
    dbMock.limit
      .mockResolvedValueOnce([{ address: creatorAddress }])
      .mockResolvedValueOnce([]);
    dbMock.returning.mockResolvedValueOnce([]);

    await expect(seedBlueberryMuffins()).resolves.toEqual({
      id: recipeId,
      slug: "blueberry-muffins",
      created: false,
    });

    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    expect(dbMock.onConflictDoNothing).toHaveBeenCalledTimes(1);
  });
});

describe("updateBlueberryMuffinsContent", () => {
  beforeEach(() => {
    Object.values(dbMock).forEach((mock) => mock.mockReset());
    dbMock.update.mockReturnValue({ set: dbMock.set });
    dbMock.set.mockReturnValue({ where: dbMock.where });
    dbMock.where.mockReturnValue({ returning: dbMock.returning });
    dbMock.returning.mockResolvedValue([{ id: recipeId, slug: "blueberry-muffins" }]);
  });

  afterEach(() => {
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.insert).not.toHaveBeenCalled();
    expect(dbMock.delete).not.toHaveBeenCalled();
    expect(dbMock.onConflictDoUpdate).not.toHaveBeenCalled();
  });

  it("updates only editorial content on the exact existing creator recipe", async () => {
    await expect(updateBlueberryMuffinsContent()).resolves.toEqual({
      id: recipeId,
      slug: "blueberry-muffins",
      updated: true,
    });

    expect(dbMock.update).toHaveBeenCalledExactlyOnceWith(recipes);
    expect(dbMock.set).toHaveBeenCalledTimes(1);
    const row = dbMock.set.mock.calls[0][0];
    expect(Object.keys(row).sort()).toEqual([
      "description", "ingredients", "introContent", "notes", "steps",
    ]);
    expect(row.description).toContain("Big, tender muffins packed with blueberries");
    expectOriginalRecipeContent(row);
    const query = new PgDialect().sqlToQuery(dbMock.where.mock.calls[0][0]);
    expect(query.params).toEqual([recipeId, creatorAddress, "blueberry-muffins"]);
    expect(query.sql).toBe('(\"recipes\".\"id\" = $1 and \"recipes\".\"creator_address\" = $2 and \"recipes\".\"slug\" = $3)');
  });

  it("returns null when the exact recipe does not exist without inserting a replacement", async () => {
    dbMock.returning.mockResolvedValueOnce([]);

    await expect(updateBlueberryMuffinsContent()).resolves.toBeNull();

    expect(dbMock.update).toHaveBeenCalledExactlyOnceWith(recipes);
  });
});
