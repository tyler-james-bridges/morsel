import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const client = neon(
  databaseUrl ?? "postgresql://missing:missing@localhost/morsel",
);

export const db = drizzle(client, { schema });

function requireDatabaseUrl() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for persistent Postgres storage");
  }
}

async function execute(statement: string) {
  requireDatabaseUrl();
  await client.query(statement);
}

// Auto-create tables
async function ensureTables() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS creators (
      address TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      slug TEXT NOT NULL UNIQUE,
      banner_url TEXT NOT NULL DEFAULT '',
      social_links TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      creator_address TEXT NOT NULL REFERENCES creators(address),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      price_usdc_atomic BIGINT NOT NULL DEFAULT 0,
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
      published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      notes TEXT DEFAULT '',
      unlock_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS unlocks (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES recipes(id),
      buyer_address TEXT NOT NULL,
      paid_amount DOUBLE PRECISION NOT NULL,
      paid_amount_usdc_atomic BIGINT NOT NULL DEFAULT 0,
      tx_hash TEXT,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      creator_address TEXT NOT NULL REFERENCES creators(address),
      email TEXT,
      wallet_address TEXT,
      subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    "CREATE INDEX IF NOT EXISTS idx_recipes_creator ON recipes(creator_address)",
    "CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine)",
    "CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type)",
    "CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug)",
    "CREATE INDEX IF NOT EXISTS idx_creators_slug ON creators(slug)",
    "CREATE INDEX IF NOT EXISTS idx_subscriptions_creator ON subscriptions(creator_address)",
    "CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email)",
    "CREATE INDEX IF NOT EXISTS idx_unlocks_buyer ON unlocks(buyer_address)",
    "CREATE INDEX IF NOT EXISTS idx_unlocks_recipe ON unlocks(recipe_id)",
    "CREATE INDEX IF NOT EXISTS idx_unlocks_recipe_buyer ON unlocks(recipe_id, buyer_address)",
  ];

  for (const statement of statements) {
    await execute(statement);
  }

  await runMigrations();
}

async function executeIgnoringExistingColumn(statement: string) {
  try {
    await execute(statement);
  } catch (error) {
    const message = String(error).toLowerCase();
    const code = (error as { code?: string }).code;
    if (
      code !== "42701" &&
      !message.includes("duplicate column") &&
      !message.includes("already exists")
    ) {
      throw error;
    }
  }
}

async function createUniqueUnlockIndexIfPossible() {
  try {
    await execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unlocks_recipe_buyer_unique
      ON unlocks(recipe_id, buyer_address)
    `);
  } catch (error) {
    const message = String(error).toLowerCase();
    const code = (error as { code?: string }).code;
    if (
      code !== "23505" &&
      !message.includes("unique constraint") &&
      !message.includes("duplicate key")
    ) {
      throw error;
    }
  }
}

async function runMigrations() {
  await executeIgnoringExistingColumn(
    "ALTER TABLE recipes ADD COLUMN IF NOT EXISTS price_usdc_atomic BIGINT NOT NULL DEFAULT 0",
  );
  await executeIgnoringExistingColumn(
    "ALTER TABLE unlocks ADD COLUMN IF NOT EXISTS paid_amount_usdc_atomic BIGINT NOT NULL DEFAULT 0",
  );
  await execute("ALTER TABLE recipes ALTER COLUMN price_usdc_atomic TYPE BIGINT");
  await execute(
    "ALTER TABLE unlocks ALTER COLUMN paid_amount_usdc_atomic TYPE BIGINT",
  );

  await execute(`
    UPDATE recipes
    SET price_usdc_atomic = ROUND(price * 1000000)::BIGINT
    WHERE price_usdc_atomic = 0 AND price > 0
  `);
  await execute(`
    UPDATE unlocks
    SET paid_amount_usdc_atomic = ROUND(paid_amount * 1000000)::BIGINT
    WHERE paid_amount_usdc_atomic = 0 AND paid_amount > 0
  `);

  await createUniqueUnlockIndexIfPossible();
}

let initialized = false;

export async function getDb() {
  if (!initialized) {
    await ensureTables();
    const { seedDatabase } = await import("./seed");
    await seedDatabase();
    initialized = true;
  }
  return db;
}

export { client };
export default db;
