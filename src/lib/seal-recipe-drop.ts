type ToolAction = "search" | "feed" | "recipe_full";

export type RecipeDropRoute = {
  action: ToolAction;
  body: Record<string, unknown>;
  reason: string;
  unlockPath?: string;
};

export type RecipeDropCard = {
  ok: true;
  type: "recipe_drop";
  title: string;
  hook: string;
  ingredients: string[];
  steps: string[];
  time: { prep_minutes?: number; cook_minutes?: number; total_minutes?: number };
  servings?: number;
  tags: string[];
  creator: { name: string; address?: string };
  source: { recipeId?: string; unlockPath?: string; price?: string };
  summary: string;
};

const CUISINES = ["italian", "mexican", "japanese", "indian", "thai", "french", "american", "mediterranean", "chinese", "korean"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "dessert", "snack", "drink"];
const DIETARY = ["vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "paleo", "nut-free"];

function clean(value: string): string {
  return value.replace(/[?.!]+$/g, "").replace(/\s+/g, " ").trim();
}

function pickToken(ask: string, tokens: string[]) {
  return tokens.find((token) => new RegExp(`\\b${token}\\b`, "i").test(ask));
}

function extractQuery(ask: string) {
  const withMatch = ask.match(/\b(?:with|using|from)\s+(.+?)(?:,|\b(?:in|for|under|within|gluten-free|vegan|vegetarian|keto|dairy-free|nut-free)\b|$)/i);
  if (withMatch) return clean(withMatch[1].replace(/\s*\+\s*/g, " "));
  return clean(ask.replace(/\b(what can i make|give me|find|recipe|cook|make|for|with)\b/gi, " "));
}

function compact(body: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined && value !== ""));
}

export function routeRecipeDropAsk(ask: string): RecipeDropRoute {
  const text = clean(ask);
  const recipeId = text.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i)?.[0];
  if (recipeId) {
    return {
      action: "recipe_full",
      body: { action: "recipe_full", recipeId },
      unlockPath: `/api/recipes/${recipeId}/full`,
      reason: "specific recipe id",
    };
  }

  if (!text || /\b(recipe of the day|surprise me|daily recipe|featured)\b/i.test(text)) {
    return { action: "feed", body: { action: "feed", tab: "featured", limit: 1 }, reason: "featured fallback" };
  }

  const query = extractQuery(text);
  return {
    action: "search",
    body: compact({
      action: "search",
      query,
      cuisine: pickToken(text, CUISINES),
      mealType: pickToken(text, MEAL_TYPES),
      dietary: pickToken(text, DIETARY),
      limit: 1,
    }),
    reason: "constraint search",
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function firstRecipe(response: Record<string, unknown>) {
  const recipe = asRecord(response.recipe);
  if (Object.keys(recipe).length) return recipe;
  const recipes = Array.isArray(response.recipes) ? response.recipes.map(asRecord) : [];
  return recipes[0] ?? {};
}

export function formatRecipeDropCard(
  ask: string,
  previewResponse: Record<string, unknown>,
  fullResponse: Record<string, unknown> = {},
): RecipeDropCard {
  const preview = firstRecipe(previewResponse);
  const fullRecipe = asRecord(fullResponse.recipe);
  const full = Object.keys(fullRecipe).length ? fullRecipe : fullResponse;
  const recipeId = typeof preview.id === "string" ? preview.id : undefined;
  const tags = [...asList(preview.dietaryTags), preview.cuisine, preview.mealType].filter(Boolean).map(String);
  const prep = typeof preview.prepTime === "number" ? preview.prepTime : undefined;
  const cook = typeof preview.cookTime === "number" ? preview.cookTime : undefined;
  const ingredients = asList(full.ingredients);
  const steps = asList(full.steps);

  if (!Object.keys(preview).length) {
    return {
      ok: true,
      type: "recipe_drop",
      title: "Recipe Drop",
      hook: "No matching recipe came back. Try the featured feed fallback.",
      ingredients: [],
      steps: [],
      time: {},
      tags: [],
      creator: { name: "Unknown Creator" },
      source: {},
      summary: `No recipe found for "${ask}".`,
    };
  }

  return {
    ok: true,
    type: "recipe_drop",
    title: String(preview.title || "Recipe Drop"),
    hook: String(preview.description || "A creator-made recipe unlocked through Morsel."),
    ingredients,
    steps,
    time: { prep_minutes: prep, cook_minutes: cook, total_minutes: prep && cook ? prep + cook : undefined },
    servings: typeof preview.servings === "number" ? preview.servings : undefined,
    tags,
    creator: {
      name: String(preview.creatorName || "Unknown Creator"),
      address: typeof preview.creatorAddress === "string" ? preview.creatorAddress : undefined,
    },
    source: { recipeId, unlockPath: recipeId ? `/api/recipes/${recipeId}/full` : undefined, price: typeof preview.price === "string" ? preview.price : undefined },
    summary: steps.length ? `${steps.length} steps, ${ingredients.length} ingredients.` : "Unlock the full recipe to fill ingredients and steps.",
  };
}
