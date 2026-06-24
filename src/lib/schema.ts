import {
  bigint,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const creators = pgTable("creators", {
  address: text("address").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  slug: text("slug").notNull().unique(),
  bannerUrl: text("banner_url").notNull().default(""),
  socialLinks: text("social_links").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: text("id").primaryKey(),
  creatorAddress: text("creator_address")
    .notNull()
    .references(() => creators.address),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  price: doublePrecision("price").notNull(), // Legacy USD amount (e.g. 0.50)
  priceUsdcAtomic: bigint("price_usdc_atomic", { mode: "number" })
    .notNull()
    .default(0),
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
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Gated content
  ingredients: text("ingredients").notNull(), // JSON array
  steps: text("steps").notNull(), // JSON array
  notes: text("notes").default(""),
  unlockCount: integer("unlock_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const unlocks = pgTable("unlocks", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id),
  buyerAddress: text("buyer_address").notNull(),
  paidAmount: doublePrecision("paid_amount").notNull(), // Legacy USD amount
  paidAmountUsdcAtomic: bigint("paid_amount_usdc_atomic", { mode: "number" })
    .notNull()
    .default(0),
  txHash: text("tx_hash"),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  creatorAddress: text("creator_address")
    .notNull()
    .references(() => creators.address),
  email: text("email"),
  walletAddress: text("wallet_address"),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
