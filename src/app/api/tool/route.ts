import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  searchRecipes,
  getFeedRecipes,
  getRecipeById,
  getTopCreators,
  getCreatorByAddress,
} from "@/lib/tool-queries";
import { shouldGateRecipeFull } from "@/lib/tool-gates";
import { recipes, unlocks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getPriceUsdcAtomic } from "@/lib/money";
import { getAddress, isAddress, verifyMessage, type Hex } from "viem";
import {
  buildRecipeAccessMessage,
  WALLET_AUTH_WINDOW_MS,
} from "@/lib/wallet-auth";

type Action = "search" | "feed" | "recipe" | "recipe_full" | "creators" | "creator";

interface ToolInput {
  action: Action;
  recipeId?: string;
  query?: string;
  cuisine?: string;
  mealType?: string;
  dietary?: string;
  tab?: "featured" | "latest" | "trending";
  limit?: number;
  cursor?: string;
  creatorAddress?: string;
}

const VALID_ACTIONS: Action[] = [
  "search", "feed", "recipe", "recipe_full", "creators", "creator",
];

function getFullRecipeContent(recipe: {
  ingredients: string;
  steps: string;
  notes: string | null;
}) {
  return {
    ingredients: JSON.parse(recipe.ingredients),
    steps: JSON.parse(recipe.steps),
    notes: recipe.notes,
  };
}

async function getAuthenticatedBuyerAddress(req: NextRequest, recipeId: string) {
  const address = req.headers.get("x-wallet-address");
  const signature = req.headers.get("x-wallet-signature");
  const timestamp = req.headers.get("x-wallet-timestamp");

  if (!address || !signature || !timestamp || !isAddress(address)) return null;

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) return null;
  if (Math.abs(Date.now() - issuedAt) > WALLET_AUTH_WINDOW_MS) return null;

  const checksumAddress = getAddress(address);
  const message = buildRecipeAccessMessage(recipeId, checksumAddress, timestamp);
  const valid = await verifyMessage({
    address: checksumAddress,
    message,
    signature: signature as Hex,
  }).catch(() => false);

  return valid ? checksumAddress.toLowerCase() : null;
}

function validateInput(body: unknown): { ok: true; input: ToolInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const raw = body as Record<string, unknown>;

  if (!raw.action || typeof raw.action !== "string") {
    return { ok: false, error: "action is required and must be a string" };
  }

  if (!VALID_ACTIONS.includes(raw.action as Action)) {
    return { ok: false, error: `Invalid action: ${raw.action}. Valid actions: ${VALID_ACTIONS.join(", ")}` };
  }

  const limit = raw.limit != null ? Number(raw.limit) : undefined;
  if (limit != null && (!Number.isFinite(limit) || limit < 1 || limit > 50)) {
    return { ok: false, error: "limit must be between 1 and 50" };
  }

  return {
    ok: true,
    input: {
      action: raw.action as Action,
      recipeId: typeof raw.recipeId === "string" ? raw.recipeId : undefined,
      query: typeof raw.query === "string" ? raw.query : undefined,
      cuisine: typeof raw.cuisine === "string" ? raw.cuisine : undefined,
      mealType: typeof raw.mealType === "string" ? raw.mealType : undefined,
      dietary: typeof raw.dietary === "string" ? raw.dietary : undefined,
      tab: ["featured", "latest", "trending"].includes(raw.tab as string)
        ? (raw.tab as "featured" | "latest" | "trending")
        : undefined,
      limit,
      cursor: typeof raw.cursor === "string" ? raw.cursor : undefined,
      creatorAddress: typeof raw.creatorAddress === "string" ? raw.creatorAddress : undefined,
    },
  };
}

async function handleAction(input: ToolInput, req: NextRequest) {
  const db = await getDb();

  switch (input.action) {
    case "search": {
      const results = await searchRecipes(db, {
        cuisine: input.cuisine,
        mealType: input.mealType,
        dietary: input.dietary,
        search: input.query,
      });
      return { recipes: results };
    }

    case "feed": {
      const tab = input.tab || "featured";
      const limit = input.limit || 10;
      const result = await getFeedRecipes(db, {
        tab,
        cursor: input.cursor,
        limit,
      });
      return { recipes: result.recipes, nextCursor: result.nextCursor };
    }

    case "recipe": {
      if (!input.recipeId) {
        return { error: "recipeId is required for recipe action" };
      }
      const recipe = await getRecipeById(db, input.recipeId);
      if (!recipe) {
        return { error: "Recipe not found" };
      }
      return { recipe };
    }

    case "recipe_full": {
      if (!input.recipeId) {
        return { error: "recipeId is required for recipe_full action" };
      }

      const recipeRows = await db
        .select()
        .from(recipes)
        .where(eq(recipes.id, input.recipeId))
        .limit(1);

      if (!recipeRows[0]) {
        return { error: "Recipe not found" };
      }

      const recipeData = recipeRows[0];

      if (recipeData.isFree === 1) {
        return { recipe: getFullRecipeContent(recipeData) };
      }

      // Check for existing unlock via wallet auth headers
      const authenticatedBuyerAddress = await getAuthenticatedBuyerAddress(
        req,
        input.recipeId,
      );
      if (authenticatedBuyerAddress) {
        const existingUnlock = await db
          .select({ id: unlocks.id })
          .from(unlocks)
          .where(
            and(
              eq(unlocks.recipeId, input.recipeId),
              eq(unlocks.buyerAddress, authenticatedBuyerAddress),
            ),
          )
          .limit(1);

        if (existingUnlock[0]) {
          return { recipe: getFullRecipeContent(recipeData) };
        }
      }

      // Paid recipe without valid unlock - indicate payment required
      const gateCheck = shouldGateRecipeFull(recipeData);
      if (gateCheck.isGated) {
        const priceUsdc = getPriceUsdcAtomic(recipeData) / 1_000_000;
        return {
          error: `Payment required. Price: ${priceUsdc} USDC on Base. Use the x402-gated endpoint GET /api/recipes/${input.recipeId}/full for direct payment flow.`,
        };
      }

      return { recipe: getFullRecipeContent(recipeData) };
    }

    case "creators": {
      const topCreators = await getTopCreators(db);
      return { creators: topCreators };
    }

    case "creator": {
      if (!input.creatorAddress) {
        return { error: "creatorAddress is required for creator action" };
      }
      const result = await getCreatorByAddress(db, input.creatorAddress);
      if (!result) {
        return { error: "Creator not found" };
      }
      return { creator: result.creator, recipes: result.recipes };
    }

    default:
      return { error: `Unknown action: ${input.action}` };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const validation = validateInput(body);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await handleAction(validation.input, req);

    if ("error" in result && result.error) {
      const status = result.error.startsWith("Payment required") ? 402 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tool handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
