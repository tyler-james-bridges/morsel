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

    expect(spec.info.contact.email).toBe("tylerscv22@gmail.com");
    expect(spec.paths["/api/tool"].post.security).toEqual([]);
    expect(spec.paths["/api/recipes/{id}/full"].get["x-payment-info"]).toBeDefined();
    expect(spec.paths["/api/recipes/{id}/full"].get.responses["402"]).toBeDefined();
  });
});
