import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /openapi.json", () => {
  it("publishes only paid x402 resources for registry discovery", async () => {
    const response = await GET();
    const spec = await response.json();

    expect(Object.keys(spec.paths)).toEqual(["/api/recipes/{id}/full"]);
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

    expect(spec.paths["/api/tool"]).toBeUndefined();
    expect(spec.paths["/api/recipes"]).toBeUndefined();
    expect(spec.paths["/api/feed"]).toBeUndefined();
  });
});
