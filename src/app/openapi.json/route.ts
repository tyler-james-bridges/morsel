export const dynamic = "force-static";

const BASE = "https://morsel.0x402.sh";

function buildSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Morsel",
      version: "1.0.0",
      description:
        "Creator recipe unlocks via x402. Agents can pay to unlock full ingredients, steps, and notes for paid Morsel recipes.",
      "x-guidance":
        "Use a Morsel recipe ID with GET /api/recipes/{id}/full to unlock paid full recipe content via x402 on Base USDC. Public browsing endpoints exist for the web app, but this merchant discovery document intentionally lists only payable resources so registries do not report skipped free endpoints.",
      contact: { email: "tylerscv22@gmail.com", url: BASE },
    },
    servers: [{ url: BASE }],
    paths: {
      "/api/recipes/{id}/full": {
        get: {
          operationId: "unlock_full_recipe",
          summary: "Unlock full recipe content",
          tags: ["Recipes", "x402"],
          "x-payment-info": {
            price: { mode: "dynamic", currency: "USD", min: "0.25", max: "0.75" },
            protocols: [{ x402: {} }],
          },
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Recipe ID returned by Morsel recipe preview surfaces.",
            },
          ],
          responses: {
            "200": {
              description: "Full recipe content",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FullRecipeContent" },
                },
              },
            },
            "402": { description: "Payment Required" },
            "404": { description: "Recipe not found" },
          },
        },
      },
    },
    components: {
      schemas: {
        FullRecipeContent: {
          type: "object",
          required: ["ingredients", "steps"],
          properties: {
            ingredients: { type: "array", items: { type: "string" } },
            steps: { type: "array", items: { type: "string" } },
            notes: { type: ["string", "null"] },
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
