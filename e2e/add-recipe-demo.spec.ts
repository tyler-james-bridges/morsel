import { test, expect } from "@playwright/test";

const RECIPE_TITLE = "Filipino Banana Buñuelos";
const RECIPE_PATH = "/tmoney145/filipino-banana-bunuelos";
const RECIPE_PRICE = "$0.25";

// A distinctive line from the gated steps. It must never render while locked.
const GATED_STEP = "Mash the bananas in a mixing bowl";

// In demo mode, hold on each screen so viewers (and recordings) can follow.
const DEMO_PAUSE_MS = process.env.DEMO === "1" ? 1500 : 0;

test.describe("Filipino Banana Buñuelos", () => {
  test("is added via seed and verified through the app", async ({
    page,
    request,
  }) => {
    const seedSecret = process.env.MORSEL_SEED_ADMIN_SECRET;
    test.skip(
      !seedSecret,
      "Set MORSEL_SEED_ADMIN_SECRET to run the seed step (see README)",
    );

    await test.step("reset: delete the recipe if it already exists", async () => {
      const existing = await request.get(`/api/recipes/by-slug${RECIPE_PATH}`);
      if (!existing.ok()) return;
      const { id } = await existing.json();
      const res = await request.delete(`/api/recipes/${id}`, {
        headers: { "x-morsel-seed-secret": seedSecret! },
      });
      expect(res.status(), "reset delete should succeed").toBe(200);
    });

    await test.step("add the recipe through the seed endpoint", async () => {
      // Generous timeout: on a cold dev server this request can take a while.
      const res = await request.post("/api/seed", {
        headers: { "x-morsel-seed-secret": seedSecret! },
        timeout: 120_000,
      });
      expect(res.status(), "seed endpoint should accept the secret").toBe(200);
      const body = await res.json();
      expect(body.recipes).toBeGreaterThanOrEqual(4);
    });

    await test.step("recipe card shows up in the feed", async () => {
      // domcontentloaded: don't hang on slow third-party wallet resources
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const title = page.getByRole("heading", { name: RECIPE_TITLE });
      await expect(title).toBeVisible();
      const card = page.locator("article").filter({ has: title });
      await expect(card.getByText(RECIPE_PRICE).first()).toBeVisible();
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(DEMO_PAUSE_MS);
    });

    await test.step("card links to the detail page", async () => {
      await page.getByRole("heading", { name: RECIPE_TITLE }).click();
      await page.waitForURL(`**${RECIPE_PATH}`);
    });

    await test.step("detail page renders the free preview", async () => {
      await expect(
        page.getByRole("heading", { level: 1, name: RECIPE_TITLE }),
      ).toBeVisible();
      await expect(
        page.getByText("Golden Filipino-style banana fritters"),
      ).toBeVisible();
      await expect(page.getByText("filipino", { exact: true })).toBeVisible();
      await expect(page.getByText("dessert", { exact: true })).toBeVisible();
      await expect(
        page.getByText("paper plate in the kitchen while everyone"),
      ).toBeVisible();
      await page.waitForTimeout(DEMO_PAUSE_MS);
    });

    await test.step("full recipe stays behind the paywall", async () => {
      const paywall = page.getByText("Unlock the full recipe");
      await paywall.scrollIntoViewIfNeeded();
      await expect(paywall).toBeVisible();
      await page.waitForTimeout(DEMO_PAUSE_MS);
      await expect(page.getByText(GATED_STEP)).toHaveCount(0);

      const recipeRes = await request.get(`/api/recipes/by-slug${RECIPE_PATH}`);
      expect(recipeRes.ok()).toBeTruthy();
      const recipe = await recipeRes.json();

      const fullRes = await request.get(`/api/recipes/${recipe.id}/full`);
      expect(fullRes.status(), "gated route should demand payment").toBe(402);
    });
  });
});
