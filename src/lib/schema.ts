import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const creators = sqliteTable("creators", {
  address: text("address").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  slug: text("slug").notNull().unique(),
  bannerUrl: text("banner_url").notNull().default(""),
  socialLinks: text("social_links").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  creatorAddress: text("creator_address")
    .notNull()
    .references(() => creators.address),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  price: real("price").notNull(), // Legacy USD amount (e.g. 0.50)
  priceUsdcAtomic: integer("price_usdc_atomic").notNull().default(0),
  cuisine: text("cuisine").notNull(),
  mealType: text("meal_type").notNull(),
  dietaryTags: text("dietary_tags").notNull().default("[]"), // JSON array
  prepTime: integer("prep_time").notNull(), // minutes
  cookTime: integer("cook_time").notNull(), // minutes
  servings: integer("servings").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  slug: text("slug").notNull(),
  introContent: text("intro_content").notNull().default(""),
  isFree: integer("is_free").notNull().default(0),
  publishedAt: integer("published_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  // Gated content
  ingredients: text("ingredients").notNull(), // JSON array
  steps: text("steps").notNull(), // JSON array
  notes: text("notes").default(""),
  unlockCount: integer("unlock_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const unlocks = sqliteTable("unlocks", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id),
  buyerAddress: text("buyer_address").notNull(),
  paidAmount: real("paid_amount").notNull(), // Legacy USD amount
  paidAmountUsdcAtomic: integer("paid_amount_usdc_atomic")
    .notNull()
    .default(0),
  txHash: text("tx_hash"),
  unlockedAt: integer("unlocked_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  creatorAddress: text("creator_address")
    .notNull()
    .references(() => creators.address),
  email: text("email"),
  walletAddress: text("wallet_address"),
  subscribedAt: integer("subscribed_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
