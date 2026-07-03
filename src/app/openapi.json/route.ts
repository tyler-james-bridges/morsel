export const dynamic = "force-static";

const BASE = "https://morsel.0x402.sh";

function buildSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Morsel",
      version: "1.0.0",
      description:
        "Creator recipe unlocks and publishing via x402. Agents can pay to unlock full recipes or publish new recipes programmatically.",
      "x-guidance":
        "Use GET /api/recipes/{id}/full to unlock paid full recipe content via x402 on Base USDC. Use POST /api/recipes/create to publish: wallet-authenticated creators publish free, unsigned agents can pay the x402 listing fee and the settled payer becomes the creator address.",
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
      "/api/recipes/create": {
        post: {
          operationId: "publish_recipe",
          summary: "Publish a recipe",
          tags: ["Recipes", "Publishing", "x402"],
          "x-payment-info": {
            price: { mode: "fixed", currency: "USD", amount: "0.10" },
            protocols: [{ x402: {} }],
            note: "Wallet-authenticated creators can publish without x402. Without wallet auth, a valid x402 payment is required and the settled payer becomes creatorAddress.",
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecipePublishRequest" },
              },
            },
          },
          parameters: [
            { name: "x-wallet-address", in: "header", required: false, schema: { type: "string" } },
            { name: "x-wallet-signature", in: "header", required: false, schema: { type: "string" } },
            { name: "x-wallet-timestamp", in: "header", required: false, schema: { type: "string" } },
          ],
          responses: {
            "201": {
              description: "Recipe published",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecipePublishResponse" },
                },
              },
            },
            "400": { description: "Invalid publish request" },
            "401": { description: "Invalid wallet signature" },
            "402": { description: "Payment Required" },
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
        RecipePublishRequest: {
          type: "object",
          required: [
            "title",
            "description",
            "imageUrl",
            "price",
            "cuisine",
            "mealType",
            "prepTime",
            "cookTime",
            "servings",
            "ingredients",
            "steps",
          ],
          properties: {
            creatorAddress: {
              type: "string",
              description: "Only accepted with matching wallet signature. Omit for x402 payer publishing.",
            },
            creatorName: { type: "string" },
            title: { type: "string" },
            slug: { type: "string" },
            introContent: { type: "string" },
            isFree: { type: "boolean" },
            description: { type: "string" },
            imageUrl: { type: "string" },
            price: { type: "string", enum: ["$0.25", "$0.50", "$0.75"] },
            cuisine: { type: "string" },
            mealType: { type: "string" },
            dietaryTags: { type: "array", items: { type: "string" } },
            prepTime: { type: "integer" },
            cookTime: { type: "integer" },
            servings: { type: "integer" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
            ingredients: { type: "array", items: { type: "string" } },
            steps: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
          },
        },
        RecipePublishResponse: {
          type: "object",
          required: ["success", "id", "slug", "creatorAddress", "authMode"],
          properties: {
            success: { type: "boolean" },
            id: { type: "string" },
            slug: { type: "string" },
            creatorAddress: { type: "string" },
            authMode: { type: "string", enum: ["wallet", "x402"] },
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
