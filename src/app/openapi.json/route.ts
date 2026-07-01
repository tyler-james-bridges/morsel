export const dynamic = "force-static";

const BASE = "https://morsel.0x402.sh";

function buildSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Morsel",
      version: "1.0.0",
      description:
        "Creator recipe discovery and x402 recipe unlocks. Agents can search/feed recipes first, then pay to unlock full ingredients and steps.",
      "x-guidance":
        "Call POST /api/tool with action=search, action=feed, or action=recipe to find a recipe preview. Use the returned recipe ID with GET /api/recipes/{id}/full to unlock full recipe content via x402 on Base USDC. action=recipe_full is accepted for free full recipes or payment guidance, but paid unlocks use GET /api/recipes/{id}/full.",
      contact: { url: BASE },
    },
    servers: [{ url: BASE }],
    paths: {
      "/api/tool": {
        post: {
          operationId: "morsel_tool",
          summary: "Search, feed, and preview Morsel recipes",
          tags: ["Recipes"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    action: {
                      type: "string",
                      enum: ["search", "feed", "recipe", "recipe_full", "creators", "creator"],
                    },
                    query: { type: "string" },
                    cuisine: { type: "string" },
                    mealType: { type: "string" },
                    dietary: { type: "string" },
                    tab: { type: "string", enum: ["featured", "latest", "trending"] },
                    limit: { type: "integer", minimum: 1, maximum: 50 },
                    cursor: { type: "string" },
                    recipeId: { type: "string" },
                    creatorAddress: { type: "string" },
                  },
                  required: ["action"],
                  additionalProperties: false,
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Recipe, creator, or feed response",
              content: { "application/json": { schema: { type: "object" } } },
            },
            "400": { description: "Invalid request" },
          },
        },
      },
      "/api/recipes/{id}/full": {
        get: {
          operationId: "unlock_full_recipe",
          summary: "Unlock full recipe content",
          tags: ["Recipes", "x402"],
          "x-payment-info": {
            price: { mode: "dynamic", currency: "USD", min: "0.01", max: "1000000.00" },
            protocols: [{ x402: {} }],
          },
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Recipe ID returned by /api/tool or recipe preview endpoints.",
            },
          ],
          responses: {
            "200": {
              description: "Full recipe content",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ingredients: { type: "array", items: { type: "string" } },
                      steps: { type: "array", items: { type: "string" } },
                      notes: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
            "402": { description: "Payment Required" },
            "404": { description: "Recipe not found" },
          },
        },
      },
    },
  };
}

export async function GET() {
  return new Response(JSON.stringify(buildSpec(), null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
