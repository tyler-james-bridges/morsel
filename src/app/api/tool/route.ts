import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  searchRecipes,
  getFeedRecipes,
  getRecipeById,
  getTopCreators,
  getCreatorByAddress,
} from "@/lib/tool-queries";
import { recipes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getPriceUsdcAtomic } from "@/lib/money";

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

async function handleAction(input: ToolInput) {
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
        return {
          recipe: {
            ingredients: JSON.parse(recipeData.ingredients),
            steps: JSON.parse(recipeData.steps),
            notes: recipeData.notes,
          },
        };
      }

      const priceUsdc = getPriceUsdcAtomic(recipeData) / 1_000_000;
      return {
        error: `Payment required. Price: ${priceUsdc} USDC on Base. Use GET /api/recipes/${input.recipeId}/full for x402 payment flow.`,
      };
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

    const result = await handleAction(validation.input);

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
