import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /openapi.json", () => {
  it("keeps the /api/tool action enum aligned with the tool handler", async () => {
    const response = await GET();
    const spec = await response.json();
    const actions = spec.paths["/api/tool"].post.requestBody.content["application/json"].schema.properties.action.enum;

    expect(actions).toEqual(["search", "feed", "recipe", "recipe_full", "creators", "creator"]);
  });
});
