import { test, expect, devices } from "@playwright/test";
import { privateKeyToAccount } from "viem/accounts";

// Throwaway demo key (holds nothing); fixed so the demo creator keeps the
// same address and slug across runs.
const DEMO_WALLET_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const demoAccount = privateKeyToAccount(DEMO_WALLET_KEY);

const CREATOR_NAME = "Demo Chef";
const CREATOR_SLUG = "demo-chef";
const RECIPE_TITLE = "Filipino Banana Buñuelos";
const RECIPE_SLUG = "filipino-banana-bunuelos";
const RECIPE_PATH = `/${CREATOR_SLUG}/${RECIPE_SLUG}`;
const RECIPE_PRICE = "$0.25";

// In demo mode, hold on each screen so viewers (and recordings) can follow.
const DEMO_PAUSE_MS = process.env.DEMO === "1" ? 1500 : 0;

test.use({ ...devices["Pixel 7"] });

test.describe("Publishing on mobile", () => {
  test("a user publishes the buñuelos recipe through the app", async ({
    page,
    context,
    request,
  }) => {
    const seedSecret = process.env.MORSEL_SEED_ADMIN_SECRET;
    test.skip(
      !seedSecret,
      "Set MORSEL_SEED_ADMIN_SECRET so the test can reset between runs",
    );

    await test.step("reset: delete the demo recipe if it already exists", async () => {
      const existing = await request.get(`/api/recipes/by-slug${RECIPE_PATH}`);
      if (!existing.ok()) return;
      const { id } = await existing.json();
      const res = await request.delete(`/api/recipes/${id}`, {
        headers: { "x-morsel-seed-secret": seedSecret! },
      });
      expect(res.status(), "reset delete should succeed").toBe(200);
    });

    await test.step("install a mock browser wallet", async () => {
      await context.exposeFunction(
        "__demoWalletSign",
        async (hexMessage: `0x${string}`) =>
          demoAccount.signMessage({ message: { raw: hexMessage } }),
      );
      await context.addInitScript((address: string) => {
        const provider = {
          isMetaMask: false,
          async request({
            method,
            params,
          }: {
            method: string;
            params?: unknown[];
          }) {
            switch (method) {
              case "eth_requestAccounts":
              case "eth_accounts":
                return [address];
              case "eth_chainId":
                return "0x2105"; // Base
              case "personal_sign": {
                const sign = (
                  window as unknown as {
                    __demoWalletSign: (msg: unknown) => Promise<string>;
                  }
                ).__demoWalletSign;
                return sign(params?.[0]);
              }
              case "wallet_switchEthereumChain":
              case "wallet_requestPermissions":
                return null;
              default:
                throw Object.assign(new Error(`Unsupported: ${method}`), {
                  code: 4200,
                });
            }
          },
          on() {
            return provider;
          },
          removeListener() {
            return provider;
          },
        };
        (window as unknown as { ethereum: unknown }).ethereum = provider;
      }, demoAccount.address);
    });

    await test.step("open the app and tap through to Publish", async () => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      // The feed renders client-side; once cards appear, hydration is done
      // and the menu button is interactive.
      await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
      await page.getByRole("button", { name: "Toggle menu" }).click();
      await page.waitForTimeout(DEMO_PAUSE_MS);
      const publishLink = page.getByRole("link", { name: "Publish", exact: true });
      await expect(publishLink).toBeVisible();
      await publishLink.click();
      await page.waitForURL("**/publish");
      await expect(page.getByText("Sign in to publish")).toBeVisible();
    });

    await test.step("connect the wallet", async () => {
      await page.getByRole("button", { name: "Connect Wallet" }).click();
      await page.getByText(/Browser Wallet|Injected/i).first().click();
      await expect(page.getByText("Share a recipe")).toBeVisible();
      await page.waitForTimeout(DEMO_PAUSE_MS);
    });

    await test.step("fill in the recipe", async () => {
      await page.getByPlaceholder("Chef Tyler").fill(CREATOR_NAME);
      await page
        .getByPlaceholder("Burnt Honey & Harissa Chicken")
        .fill(RECIPE_TITLE);
      await page
        .getByPlaceholder("Sticky, smoky, dangerously good.")
        .fill(
          "Golden Filipino-style banana fritters with a soft, sweet banana center and crisp edges.",
        );
      // The title autofills the slug, but the ñ needs correcting by hand
      await page
        .getByPlaceholder("burnt-honey-harissa-chicken")
        .fill(RECIPE_SLUG);

      const selects = page.getByRole("combobox");
      await selects.nth(0).selectOption("filipino");
      await selects.nth(1).selectOption("dessert");
      await selects.nth(2).selectOption("easy");

      // The image input is type="url", so it needs an absolute URL
      const imageUrl = new URL(
        "/images/recipes/filipino-banana-bunuelos.png",
        page.url(),
      ).href;
      await page.getByPlaceholder("https://...").fill(imageUrl);
      await page
        .getByPlaceholder(/There's a moment when honey/)
        .fill(
          "Ripe bananas get mashed into a simple batter, fried into little golden fritters, then finished with cinnamon sugar.",
        );
      await page
        .getByPlaceholder(/2 cups all-purpose flour/)
        .fill(
          [
            "2 ripe saba bananas or regular bananas",
            "1 cup all-purpose flour",
            "1 1/2 tsp baking powder",
            "1 tbsp sugar",
            "1/4 tsp salt",
            "1 large egg",
            "1/4 cup milk or coconut milk",
            "Oil for frying",
          ].join("\n"),
        );
      await page
        .getByPlaceholder(/Preheat oven to 375F/)
        .fill(
          [
            "Mash the bananas until mostly smooth.",
            "Mix in the egg and milk.",
            "Whisk the dry ingredients together, then fold into the banana mixture.",
            "Fry small scoops in medium-hot oil until golden on both sides.",
            "Drain, toss in cinnamon sugar, and serve warm.",
          ].join("\n"),
        );
      await page.waitForTimeout(DEMO_PAUSE_MS);
    });

    await test.step("pick the price and publish", async () => {
      await page.getByRole("button", { name: RECIPE_PRICE, exact: true }).click();
      await page.getByRole("button", { name: "Publish recipe" }).click();
      await expect(page.getByText("Recipe Published")).toBeVisible();
      await page.waitForTimeout(DEMO_PAUSE_MS);
    });

    await test.step("the recipe is live on its detail page", async () => {
      await page.goto(RECIPE_PATH, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { level: 1, name: RECIPE_TITLE }),
      ).toBeVisible();
      await expect(page.getByText(CREATOR_NAME).first()).toBeVisible();
      await page.waitForTimeout(DEMO_PAUSE_MS);
    });

    await test.step("full recipe stays behind the paywall", async () => {
      const paywall = page.getByText("Unlock the full recipe");
      await paywall.scrollIntoViewIfNeeded();
      await expect(paywall).toBeVisible();

      const recipeRes = await request.get(`/api/recipes/by-slug${RECIPE_PATH}`);
      expect(recipeRes.ok()).toBeTruthy();
      const recipe = await recipeRes.json();
      const fullRes = await request.get(`/api/recipes/${recipe.id}/full`);
      expect(fullRes.status(), "gated route should demand payment").toBe(402);
      await page.waitForTimeout(DEMO_PAUSE_MS);
    });
  });
});
