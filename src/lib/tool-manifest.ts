import { defineManifest, x402UsdcPricing } from "@opensea/tool-sdk"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://morsel.0x402.sh"

export const morselManifest = defineManifest({
  type: "https://ercs.ethereum.org/ERCS/erc-8257#tool-manifest-v1",
  name: "morsel",
  description: "Recipe marketplace with micropayments. Search recipes, browse creators, unlock full recipe content via x402 USDC payments on Base, and publish recipes through POST /api/recipes/create. Creator wallets manage their own listings with wallet-signed PUT /api/recipes/{id} to update and DELETE /api/recipes/{id} to remove.",
  endpoint: `${BASE_URL}/api/tool`,
  inputs: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["search", "feed", "recipe", "recipe_full", "creators", "creator"],
        description: "Which operation to perform"
      },
      recipeId: { type: "string", description: "Recipe ID (required for recipe, recipe_full)" },
      query: { type: "string", description: "Search query text" },
      cuisine: { type: "string" },
      mealType: { type: "string" },
      dietary: { type: "string" },
      tab: { type: "string", enum: ["featured", "latest", "trending"], description: "Feed tab (default: featured)" },
      limit: { type: "integer", minimum: 1, maximum: 50 },
      cursor: { type: "string" },
      creatorAddress: { type: "string", description: "Creator wallet address (required for creator action)" }
    },
    required: ["action"]
  },
  outputs: {
    type: "object",
    properties: {
      recipes: { type: "array", description: "List of recipe previews" },
      recipe: { type: "object", description: "Single recipe data" },
      creators: { type: "array", description: "List of creators" },
      creator: { type: "object", description: "Single creator profile" },
      nextCursor: { type: "string", description: "Pagination cursor" },
      error: { type: "string", description: "Error message if action failed" }
    }
  },
  creatorAddress: "0xa102a2cb8aac6c7d2c477412ebb7d41d0ce53495",
  pricing: x402UsdcPricing({
    amountUsdc: "0.50",
    // ack-onchain.base.eth — reputable payout wallet (see src/lib/payment.ts)
    recipient: "0x668aDd9213985E7Fd613Aec87767C892f4b9dF1c",
    network: "base",
  }),
  tags: ["recipes", "food", "micropayments", "x402", "base"],
})
