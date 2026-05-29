import { formatRecipePrice, formatUsdcAtomicAsUsd } from "./money";
import { recipes, creators, unlocks } from "./schema";
import { eq, like, and, sql, desc } from "drizzle-orm";
import db from "./db";
type Database = typeof db;

export interface RecipePreview {
  id: string;
  creatorAddress: string;
  creatorName: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  cuisine: string;
  mealType: string;
  dietaryTags: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  unlockCount: number;
  createdAt: Date | null;
}

export interface RecipeDetail extends RecipePreview {
  creatorBio: string;
  creatorAvatarUrl: string;
  creatorSlug: string;
  slug: string;
  introContent: string;
  isFree: boolean;
  publishedAt: Date | null;
  creator: {
    address: string;
    name: string;
    bio: string;
    avatarUrl: string;
    slug: string;
  };
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

export interface TopCreator {
  address: string;
  name: string;
  avatarUrl: string;
  recipeCount: number;
}

export async function searchRecipes(db: Database, filters: {
  cuisine?: string;
  mealType?: string;
  dietary?: string;
  search?: string;
}): Promise<RecipePreview[]> {
  const conditions = [];

  if (filters.cuisine) {
    conditions.push(eq(recipes.cuisine, filters.cuisine));
  }
  if (filters.mealType) {
    conditions.push(eq(recipes.mealType, filters.mealType));
  }
  if (filters.dietary) {
    conditions.push(like(recipes.dietaryTags, `%${filters.dietary}%`));
  }
  if (filters.search) {
    conditions.push(
      sql`(${recipes.title} LIKE ${"%" + filters.search + "%"} OR ${recipes.description} LIKE ${"%" + filters.search + "%"})`,
    );
  }

  const rows = conditions.length > 0
    ? await db
        .select({
          id: recipes.id,
          creatorAddress: recipes.creatorAddress,
          creatorName: creators.name,
          title: recipes.title,
          description: recipes.description,
          imageUrl: recipes.imageUrl,
          price: recipes.price,
          priceUsdcAtomic: recipes.priceUsdcAtomic,
          cuisine: recipes.cuisine,
          mealType: recipes.mealType,
          dietaryTags: recipes.dietaryTags,
          prepTime: recipes.prepTime,
          cookTime: recipes.cookTime,
          servings: recipes.servings,
          difficulty: recipes.difficulty,
          unlockCount: recipes.unlockCount,
          createdAt: recipes.createdAt,
        })
        .from(recipes)
        .leftJoin(creators, eq(recipes.creatorAddress, creators.address))
        .where(and(...conditions))
    : await db
        .select({
          id: recipes.id,
          creatorAddress: recipes.creatorAddress,
          creatorName: creators.name,
          title: recipes.title,
          description: recipes.description,
          imageUrl: recipes.imageUrl,
          price: recipes.price,
          priceUsdcAtomic: recipes.priceUsdcAtomic,
          cuisine: recipes.cuisine,
          mealType: recipes.mealType,
          dietaryTags: recipes.dietaryTags,
          prepTime: recipes.prepTime,
          cookTime: recipes.cookTime,
          servings: recipes.servings,
          difficulty: recipes.difficulty,
          unlockCount: recipes.unlockCount,
          createdAt: recipes.createdAt,
        })
        .from(recipes)
        .leftJoin(creators, eq(recipes.creatorAddress, creators.address));

  return rows.map((row) => ({
    ...row,
    price: formatRecipePrice(row),
    dietaryTags: JSON.parse(row.dietaryTags),
    creatorName: row.creatorName || "Unknown Creator",
  }));
}

export async function getFeedRecipes(db: Database, params: {
  tab: "featured" | "latest" | "trending";
  cursor?: string;
  limit: number;
}): Promise<{ recipes: RecipePreview[]; nextCursor: string | null }> {
  const { tab, cursor, limit } = params;

  const baseSelect = {
    id: recipes.id,
    creatorAddress: recipes.creatorAddress,
    creatorName: creators.name,
    creatorAvatarUrl: creators.avatarUrl,
    title: recipes.title,
    description: recipes.description,
    imageUrl: recipes.imageUrl,
    price: recipes.price,
    priceUsdcAtomic: recipes.priceUsdcAtomic,
    cuisine: recipes.cuisine,
    mealType: recipes.mealType,
    dietaryTags: recipes.dietaryTags,
    prepTime: recipes.prepTime,
    cookTime: recipes.cookTime,
    servings: recipes.servings,
    difficulty: recipes.difficulty,
    unlockCount: recipes.unlockCount,
    createdAt: recipes.createdAt,
  };

  const baseQuery = () =>
    db
      .select(baseSelect)
      .from(recipes)
      .leftJoin(creators, eq(recipes.creatorAddress, creators.address));

  let rows;

  if (tab === "featured" || tab === "trending") {
    const conditions = [];
    if (cursor) {
      conditions.push(
        sql`(${recipes.unlockCount} < ${parseInt(cursor, 10)})`,
      );
    }

    rows = await baseQuery()
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(recipes.unlockCount), recipes.id)
      .limit(limit + 1);
  } else if (tab === "latest") {
    const conditions = [];
    if (cursor) {
      conditions.push(
        sql`${recipes.createdAt} < ${new Date(parseInt(cursor, 10))}`,
      );
    }

    rows = await baseQuery()
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(recipes.createdAt))
      .limit(limit + 1);
  } else {
    throw new Error(`Invalid tab: ${tab}`);
  }

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1];
    if (tab === "latest") {
      nextCursor = last.createdAt
        ? new Date(last.createdAt).getTime().toString()
        : null;
    } else {
      nextCursor = `${last.unlockCount}`;
    }
  }

  const previews = items.map((row) => ({
    ...row,
    price: formatRecipePrice(row),
    dietaryTags: JSON.parse(row.dietaryTags),
    creatorName: row.creatorName || "Unknown Creator",
  }));

  return { recipes: previews, nextCursor };
}

export async function getRecipeById(db: Database, id: string): Promise<RecipeDetail | null> {
  const rows = await db
    .select({
      id: recipes.id,
      creatorAddress: recipes.creatorAddress,
      creatorName: creators.name,
      creatorBio: creators.bio,
      creatorAvatarUrl: creators.avatarUrl,
      creatorSlug: creators.slug,
      title: recipes.title,
      description: recipes.description,
      imageUrl: recipes.imageUrl,
      price: recipes.price,
      priceUsdcAtomic: recipes.priceUsdcAtomic,
      cuisine: recipes.cuisine,
      mealType: recipes.mealType,
      dietaryTags: recipes.dietaryTags,
      prepTime: recipes.prepTime,
      cookTime: recipes.cookTime,
      servings: recipes.servings,
      difficulty: recipes.difficulty,
      slug: recipes.slug,
      introContent: recipes.introContent,
      isFree: recipes.isFree,
      publishedAt: recipes.publishedAt,
      unlockCount: recipes.unlockCount,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .leftJoin(creators, eq(recipes.creatorAddress, creators.address))
    .where(eq(recipes.id, id));

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    ...row,
    price: formatRecipePrice(row),
    dietaryTags: JSON.parse(row.dietaryTags),
    isFree: row.isFree === 1,
    creatorName: row.creatorName || "Unknown Creator",
    creatorBio: row.creatorBio || "",
    creatorAvatarUrl: row.creatorAvatarUrl || "",
    creatorSlug: row.creatorSlug || "",
    creator: {
      address: row.creatorAddress,
      name: row.creatorName || "Unknown Creator",
      bio: row.creatorBio || "",
      avatarUrl: row.creatorAvatarUrl || "",
      slug: row.creatorSlug || "",
    },
  };
}

export async function getTopCreators(db: Database): Promise<TopCreator[]> {
  const rows = await db
    .select({
      address: creators.address,
      name: creators.name,
      avatarUrl: creators.avatarUrl,
      recipeCount: sql<number>`count(${recipes.id})`.as("recipe_count"),
    })
    .from(creators)
    .leftJoin(recipes, eq(creators.address, recipes.creatorAddress))
    .groupBy(creators.address)
    .orderBy(desc(sql`recipe_count`))
    .limit(8);

  return rows;
}

export async function getCreatorByAddress(db: Database, address: string): Promise<{
  creator: Creator;
  recipes: RecipePreview[];
} | null> {
  const creator = (
    await db
      .select()
      .from(creators)
      .where(eq(creators.address, address))
      .limit(1)
  )[0];

  if (!creator) {
    return null;
  }

  const creatorRecipes = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      imageUrl: recipes.imageUrl,
      price: recipes.price,
      priceUsdcAtomic: recipes.priceUsdcAtomic,
      cuisine: recipes.cuisine,
      mealType: recipes.mealType,
      dietaryTags: recipes.dietaryTags,
      prepTime: recipes.prepTime,
      cookTime: recipes.cookTime,
      servings: recipes.servings,
      difficulty: recipes.difficulty,
      unlockCount: recipes.unlockCount,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(eq(recipes.creatorAddress, address));

  // Compute total earned from unlocks on this creator's recipes
  const recipeIds = creatorRecipes.map((r) => r.id);
  let totalEarnedUsdcAtomic = 0;

  if (recipeIds.length > 0) {
    const earningsResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${unlocks.paidAmountUsdcAtomic}), 0)`,
      })
      .from(unlocks)
      .where(
        sql`${unlocks.recipeId} IN (${sql.join(
          recipeIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    totalEarnedUsdcAtomic = earningsResult[0]?.total ?? 0;
  }

  const recipePreviews = creatorRecipes.map((r) => ({
    ...r,
    creatorAddress: address,
    creatorName: creator.name,
    price: formatRecipePrice(r),
    dietaryTags: JSON.parse(r.dietaryTags),
  }));

  return {
    creator: {
      address: creator.address,
      name: creator.name,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      slug: creator.slug,
      bannerUrl: creator.bannerUrl,
      socialLinks: JSON.parse(creator.socialLinks),
      recipeCount: recipePreviews.length,
      totalEarned: formatUsdcAtomicAsUsd(totalEarnedUsdcAtomic),
    },
    recipes: recipePreviews,
  };
}