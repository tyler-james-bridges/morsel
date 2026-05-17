export interface Recipe {
  id: string;
  creatorAddress: string;
  creatorName: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string; // USD string like "$0.50"
  cuisine: string;
  mealType: string;
  dietaryTags: string[]; // e.g. ["vegan", "gluten-free"]
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  slug: string;
  introContent: string;
  isFree: boolean;
  publishedAt: string;
  createdAt: string;
  // Gated content (only returned after x402 payment)
  ingredients?: string[];
  steps?: string[];
  notes?: string;
}

export interface RecipePreview
  extends Omit<Recipe, "ingredients" | "steps" | "notes"> {
  unlockCount: number;
}

export interface Creator {
  address: string;
  name: string;
  bio: string;
  avatarUrl: string;
  slug: string;
  bannerUrl: string;
  socialLinks: Record<string, string>;
  recipeCount: number;
  totalEarned: string;
}

export interface Subscription {
  id: string;
  creatorAddress: string;
  email: string | null;
  walletAddress: string | null;
  subscribedAt: string;
}

export type CuisineType =
  | "italian"
  | "mexican"
  | "japanese"
  | "indian"
  | "thai"
  | "french"
  | "american"
  | "mediterranean"
  | "chinese"
  | "korean";

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "dessert"
  | "snack"
  | "drink";

export type DietaryTag =
  | "vegan"
  | "vegetarian"
  | "gluten-free"
  | "dairy-free"
  | "keto"
  | "paleo"
  | "nut-free";
