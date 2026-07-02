import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /openapi.json", () => {
  it("keeps the /api/tool action enum aligned with the tool handler", async () => {
    const response = await GET();
    const spec = await response.json();
    const actions = spec.paths["/api/tool"].post.requestBody.content["application/json"].schema.properties.action.enum;

    expect(actions).toEqual(["search", "feed", "recipe", "recipe_full", "creators", "creator"]);
  });

  it("includes x402scan registration metadata", async () => {
    const response = await GET();
    const spec = await response.json();
    const freeRoutes = [
      ["/api/tool", "post"],
      ["/api/recipes", "get"],
      ["/api/feed", "get"],
      ["/api/recipes/{id}", "get"],
      ["/api/recipes/by-slug/{creatorSlug}/{recipeSlug}", "get"],
      ["/api/creators/top", "get"],
      ["/api/creators/{address}", "get"],
      ["/api/creators/by-slug/{slug}", "get"],
    ] as const;

    expect(spec.info.contact.email).toBe("tylerscv22@gmail.com");
    for (const [path, method] of freeRoutes) {
      const operation = spec.paths[path][method];
      expect(operation.security).toEqual([]);
      expect(operation["x-payment-info"]).toBeUndefined();
      expect(operation.responses["200"].content["application/json"].schema).toBeDefined();
    }

    expect(spec.paths["/api/recipes/{id}/full"].get["x-payment-info"]).toBeDefined();
    expect(spec.paths["/api/recipes/{id}/full"].get.responses["402"]).toBeDefined();
    expect(spec.paths["/api/seed"]).toBeUndefined();
    expect(spec.paths["/api/subscribe"]).toBeUndefined();
  });
});
