import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /openapi.json", () => {
  it("publishes payable x402 resources for registry discovery", async () => {
    const response = await GET();
    const spec = await response.json();

    expect(Object.keys(spec.paths)).toEqual([
      "/api/recipes/{id}/full",
      "/api/recipes/create",
    ]);
    expect(spec.info.contact.email).toBe("tylerscv22@gmail.com");

    const operation = spec.paths["/api/recipes/{id}/full"].get;
    expect(operation.security).toBeUndefined();
    expect(operation["x-payment-info"]).toEqual({
      price: { mode: "dynamic", currency: "USD", min: "0.25", max: "0.75" },
      protocols: [{ x402: {} }],
    });
    expect(operation.responses["200"].content["application/json"].schema).toEqual({
      $ref: "#/components/schemas/FullRecipeContent",
    });
    expect(operation.responses["402"]).toBeDefined();

    const publish = spec.paths["/api/recipes/create"].post;
    expect(publish["x-payment-info"].price).toEqual({
      mode: "fixed",
      currency: "USD",
      amount: "0.10",
    });
    expect(publish.parameters.map((param: { name: string }) => param.name)).toEqual([
      "x-wallet-address",
      "x-wallet-signature",
      "x-wallet-timestamp",
    ]);
    expect(publish.responses["201"].content["application/json"].schema).toEqual({
      $ref: "#/components/schemas/RecipePublishResponse",
    });

    expect(spec.paths["/api/tool"]).toBeUndefined();
    expect(spec.paths["/api/recipes"]).toBeUndefined();
    expect(spec.paths["/api/feed"]).toBeUndefined();
  });
});
