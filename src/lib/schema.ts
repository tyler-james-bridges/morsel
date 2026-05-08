import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const creators = sqliteTable("creators", {
  address: text("address").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
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
  price: real("price").notNull(), // USD amount (e.g. 0.50)
  cuisine: text("cuisine").notNull(),
  mealType: text("meal_type").notNull(),
  dietaryTags: text("dietary_tags").notNull().default("[]"), // JSON array
  prepTime: integer("prep_time").notNull(), // minutes
  cookTime: integer("cook_time").notNull(), // minutes
  servings: integer("servings").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
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
  paidAmount: real("paid_amount").notNull(),
  txHash: text("tx_hash"),
  unlockedAt: integer("unlocked_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
