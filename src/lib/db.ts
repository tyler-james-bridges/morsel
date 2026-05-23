import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const isVercel = process.env.VERCEL === "1";

const client = createClient({
  url: isVercel ? "file:/tmp/morsel.db" : "file:morsel.db",
});

export const db = drizzle(client, { schema });

// Auto-create tables
async function ensureTables() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS creators (
      address TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      slug TEXT NOT NULL UNIQUE,
      banner_url TEXT NOT NULL DEFAULT '',
      social_links TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      creator_address TEXT NOT NULL REFERENCES creators(address),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      price REAL NOT NULL,
      cuisine TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      dietary_tags TEXT NOT NULL DEFAULT '[]',
      prep_time INTEGER NOT NULL,
      cook_time INTEGER NOT NULL,
      servings INTEGER NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'medium',
      slug TEXT NOT NULL,
      intro_content TEXT NOT NULL DEFAULT '',
      is_free INTEGER NOT NULL DEFAULT 0,
      published_at INTEGER NOT NULL DEFAULT (unixepoch()),
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      notes TEXT DEFAULT '',
      unlock_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS unlocks (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES recipes(id),
      buyer_address TEXT NOT NULL,
      paid_amount REAL NOT NULL,
      tx_hash TEXT,
      unlocked_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      creator_address TEXT NOT NULL REFERENCES creators(address),
      email TEXT,
      wallet_address TEXT,
      subscribed_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_creator ON recipes(creator_address);
    CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
    CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
    CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
    CREATE INDEX IF NOT EXISTS idx_creators_slug ON creators(slug);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_creator ON subscriptions(creator_address);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
    CREATE INDEX IF NOT EXISTS idx_unlocks_buyer ON unlocks(buyer_address);
    CREATE INDEX IF NOT EXISTS idx_unlocks_recipe ON unlocks(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_unlocks_recipe_buyer ON unlocks(recipe_id, buyer_address);
  `);
}

let initialized = false;

export async function getDb() {
  if (!initialized) {
    await ensureTables();
    if (!isVercel || process.env.SEED_DEMO_DATA === "1") {
      // Keep placeholder demo payout addresses out of production by default.
      const { seedDatabase } = await import("./seed");
      await seedDatabase();
    }
    initialized = true;
  }
  return db;
}

export { client };
export default db;
