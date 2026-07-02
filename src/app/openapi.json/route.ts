export const dynamic = "force-static";

const BASE = "https://morsel.0x402.sh";

function jsonResponse(description: string, schema: Record<string, unknown>) {
  return {
    description,
    content: { "application/json": { schema } },
  };
}

function pathParam(name: string, description: string) {
  return { name, in: "path", required: true, schema: { type: "string" }, description };
}

function queryParam(
  name: string,
  schema: Record<string, unknown>,
  description: string,
) {
  return { name, in: "query", required: false, schema, description };
}

const recipePreviewRef = { $ref: "#/components/schemas/RecipePreview" };
const recipeDetailRef = { $ref: "#/components/schemas/RecipeDetail" };
const creatorProfileRef = { $ref: "#/components/schemas/CreatorProfile" };

function buildSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Morsel",
      version: "1.0.0",
      description:
        "Creator recipe discovery and x402 recipe unlocks. Agents can search/feed recipes first, then pay to unlock full ingredients and steps.",
      "x-guidance":
        "Use GET /api/recipes, GET /api/feed, and creator endpoints for free discovery. POST /api/tool is a free agent wrapper for search, feed, recipe, creators, and creator actions. Use a returned recipe ID with GET /api/recipes/{id}/full to unlock paid full recipe content via x402 on Base USDC.",
      contact: { email: "tylerscv22@gmail.com", url: BASE },
    },
    servers: [{ url: BASE }],
    paths: {
      "/api/tool": {
        post: {
          operationId: "morsel_tool",
          summary: "Search, feed, and preview Morsel recipes",
          tags: ["Recipes"],
          security: [],
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
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ToolResponse" },
                },
              },
            },
            "400": { description: "Invalid request" },
          },
        },
      },
      "/api/recipes": {
        get: {
          operationId: "search_recipe_previews",
          summary: "Search public recipe previews",
          tags: ["Recipes"],
          security: [],
          parameters: [
            queryParam("search", { type: "string" }, "Text search across recipe titles and descriptions."),
            queryParam("cuisine", { type: "string" }, "Filter by cuisine, for example italian."),
            queryParam("mealType", { type: "string" }, "Filter by meal type, for example dinner."),
            queryParam("dietary", { type: "string" }, "Filter by dietary tag, for example vegetarian."),
          ],
          responses: {
            "200": jsonResponse("Recipe previews", { type: "array", items: recipePreviewRef }),
          },
        },
      },
      "/api/feed": {
        get: {
          operationId: "list_recipe_feed",
          summary: "List paginated recipe feed",
          tags: ["Recipes"],
          security: [],
          parameters: [
            queryParam("tab", { type: "string", enum: ["featured", "latest", "trending"] }, "Feed ranking mode."),
            queryParam("limit", { type: "integer", minimum: 1, maximum: 50 }, "Maximum recipes to return."),
            queryParam("cursor", { type: "string" }, "Pagination cursor from a previous response."),
            queryParam("afterId", { type: "string" }, "Tie-break pagination recipe ID."),
          ],
          responses: {
            "200": jsonResponse("Paginated feed", { $ref: "#/components/schemas/RecipeFeed" }),
          },
        },
      },
      "/api/recipes/{id}": {
        get: {
          operationId: "get_recipe_preview",
          summary: "Get a public recipe preview by ID",
          tags: ["Recipes"],
          security: [],
          parameters: [pathParam("id", "Recipe ID returned by search or feed endpoints.")],
          responses: {
            "200": jsonResponse("Recipe preview", recipeDetailRef),
            "404": { description: "Recipe not found" },
          },
        },
      },
      "/api/recipes/by-slug/{creatorSlug}/{recipeSlug}": {
        get: {
          operationId: "get_recipe_preview_by_slug",
          summary: "Get a public recipe preview by creator and recipe slug",
          tags: ["Recipes"],
          security: [],
          parameters: [
            pathParam("creatorSlug", "Creator slug from a creator profile or recipe URL."),
            pathParam("recipeSlug", "Recipe slug from search, feed, or a recipe URL."),
          ],
          responses: {
            "200": jsonResponse("Recipe preview", recipeDetailRef),
            "404": { description: "Recipe not found" },
          },
        },
      },
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
              description: "Recipe ID returned by /api/tool or recipe preview endpoints.",
            },
          ],
          responses: {
            "200": {
              ...jsonResponse("Full recipe content", {
                $ref: "#/components/schemas/FullRecipeContent",
              }),
            },
            "402": { description: "Payment Required" },
            "404": { description: "Recipe not found" },
          },
        },
      },
      "/api/creators/top": {
        get: {
          operationId: "list_top_creators",
          summary: "List top recipe creators",
          tags: ["Creators"],
          security: [],
          responses: {
            "200": jsonResponse("Top creators", {
              type: "array",
              items: { $ref: "#/components/schemas/TopCreator" },
            }),
          },
        },
      },
      "/api/creators/{address}": {
        get: {
          operationId: "get_creator_by_address",
          summary: "Get creator profile and recipes by wallet address",
          tags: ["Creators"],
          security: [],
          parameters: [pathParam("address", "Creator wallet address.")],
          responses: {
            "200": jsonResponse("Creator profile and recipes", creatorProfileRef),
            "404": { description: "Creator not found" },
          },
        },
      },
      "/api/creators/by-slug/{slug}": {
        get: {
          operationId: "get_creator_by_slug",
          summary: "Get creator profile and recipes by slug",
          tags: ["Creators"],
          security: [],
          parameters: [pathParam("slug", "Creator slug from a recipe URL or profile link.")],
          responses: {
            "200": jsonResponse("Creator profile and recipes", creatorProfileRef),
            "404": { description: "Creator not found" },
          },
        },
      },
    },
    components: {
      schemas: {
        RecipePreview: {
          type: "object",
          required: ["id", "creatorAddress", "title", "description", "price"],
          properties: {
            id: { type: "string" },
            creatorAddress: { type: "string" },
            creatorName: { type: "string" },
            creatorAvatarUrl: { type: ["string", "null"] },
            title: { type: "string" },
            description: { type: "string" },
            imageUrl: { type: "string" },
            price: { type: "string", example: "$0.50" },
            cuisine: { type: "string" },
            mealType: { type: "string" },
            dietaryTags: { type: "array", items: { type: "string" } },
            prepTime: { type: "integer" },
            cookTime: { type: "integer" },
            servings: { type: "integer" },
            difficulty: { type: "string" },
            unlockCount: { type: "integer" },
            createdAt: { type: ["string", "null"], format: "date-time" },
          },
        },
        RecipeDetail: {
          allOf: [
            recipePreviewRef,
            {
              type: "object",
              properties: {
                creatorBio: { type: "string" },
                creatorSlug: { type: "string" },
                slug: { type: "string" },
                introContent: { type: "string" },
                isFree: { type: "boolean" },
                publishedAt: { type: ["string", "null"], format: "date-time" },
                creator: { $ref: "#/components/schemas/Creator" },
              },
            },
          ],
        },
        RecipeFeed: {
          type: "object",
          required: ["recipes", "nextCursor"],
          properties: {
            recipes: { type: "array", items: recipePreviewRef },
            nextCursor: { type: ["string", "null"] },
            nextAfterId: { type: ["string", "null"] },
          },
        },
        FullRecipeContent: {
          type: "object",
          required: ["ingredients", "steps"],
          properties: {
            ingredients: { type: "array", items: { type: "string" } },
            steps: { type: "array", items: { type: "string" } },
            notes: { type: ["string", "null"] },
          },
        },
        Creator: {
          type: "object",
          required: ["address", "name", "slug"],
          properties: {
            address: { type: "string" },
            name: { type: "string" },
            bio: { type: "string" },
            avatarUrl: { type: "string" },
            slug: { type: "string" },
            bannerUrl: { type: ["string", "null"] },
            socialLinks: { type: "object", additionalProperties: { type: "string" } },
            recipeCount: { type: "integer" },
            subscriberCount: { type: "integer" },
            totalEarned: { type: "string", example: "$5.00" },
          },
        },
        TopCreator: {
          type: "object",
          required: ["address", "name", "recipeCount"],
          properties: {
            address: { type: "string" },
            name: { type: "string" },
            avatarUrl: { type: "string" },
            recipeCount: { type: "integer" },
          },
        },
        CreatorProfile: {
          type: "object",
          required: ["creator", "recipes"],
          properties: {
            creator: { $ref: "#/components/schemas/Creator" },
            recipes: { type: "array", items: recipePreviewRef },
          },
        },
        ToolResponse: {
          type: "object",
          properties: {
            recipes: { type: "array", items: recipePreviewRef },
            recipe: recipeDetailRef,
            creators: { type: "array", items: { $ref: "#/components/schemas/TopCreator" } },
            creator: { $ref: "#/components/schemas/Creator" },
            nextCursor: { type: ["string", "null"] },
            error: { type: "string" },
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
