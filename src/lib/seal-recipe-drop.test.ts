import { describe, expect, it } from "vitest";
import { formatRecipeDropCard, routeRecipeDropAsk } from "./seal-recipe-drop";

describe("routeRecipeDropAsk", () => {
  it("routes constraint asks to search", () => {
    const route = routeRecipeDropAsk("what can I make with chicken + lime, 30 min, gluten-free dinner?");
    expect(route.action).toBe("search");
    expect(route.body).toMatchObject({ action: "search", query: "chicken lime", dietary: "gluten-free", mealType: "dinner", limit: 1 });
  });

  it("routes recipe of the day to featured feed", () => {
    expect(routeRecipeDropAsk("recipe of the day").body).toEqual({ action: "feed", tab: "featured", limit: 1 });
  });

  it("routes specific recipe ids to the live unlock endpoint", () => {
    const id = "ae25c579-de7e-4ec5-6c8c-659b6f65cba7";
    const route = routeRecipeDropAsk(`unlock ${id}`);
    expect(route.body).toEqual({ action: "recipe_full", recipeId: id });
    expect(route.unlockPath).toBe(`/api/recipes/${id}/full`);
  });
});

describe("formatRecipeDropCard", () => {
  it("formats a full unlocked recipe card", () => {
    const card = formatRecipeDropCard("cake", {
      recipes: [{
        id: "recipe-1",
        title: "Lemon Cake",
        description: "Bright and tangy.",
        creatorName: "Chef Test",
        creatorAddress: "0x123",
        price: "$0.50",
        cuisine: "american",
        mealType: "dessert",
        dietaryTags: ["vegetarian"],
        prepTime: 10,
        cookTime: 20,
        servings: 8,
      }],
    }, {
      ingredients: ["lemons", "flour"],
      steps: ["Mix", "Bake"],
      notes: "Cool before slicing.",
    });

    expect(card.ok).toBe(true);
    expect(card.title).toBe("Lemon Cake");
    expect(card.ingredients).toEqual(["lemons", "flour"]);
    expect(card.time.total_minutes).toBe(30);
    expect(card.creator.name).toBe("Chef Test");
    expect(card.summary).toBe("2 steps, 2 ingredients.");
  });

  it("returns a graceful empty card", () => {
    const card = formatRecipeDropCard("make something", { recipes: [] });
    expect(card.ok).toBe(true);
    expect(card.ingredients).toEqual([]);
    expect(card.summary).toContain("No recipe found");
  });
});
