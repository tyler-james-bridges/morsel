import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const seedMock = vi.hoisted(() => ({
  seedDatabase: vi.fn(),
  seedBlueberryMuffins: vi.fn(),
  updateBlueberryMuffinsContent: vi.fn(),
}));

vi.mock("@/lib/seed", () => ({
  seedDatabase: seedMock.seedDatabase,
}));

vi.mock("@/lib/seed-blueberry-muffins", () => ({
  seedBlueberryMuffins: seedMock.seedBlueberryMuffins,
  updateBlueberryMuffinsContent: seedMock.updateBlueberryMuffinsContent,
}));

import * as route from "./route";

const originalSeedSecret = process.env.MORSEL_SEED_ADMIN_SECRET;

function makeRequest(secret?: string, query = "") {
  return new NextRequest(`http://localhost/api/seed${query}`, {
    method: "POST",
    headers: secret ? { "x-morsel-seed-secret": secret } : undefined,
  });
}

describe("/api/seed", () => {
  beforeEach(() => {
    seedMock.seedDatabase.mockReset().mockResolvedValue({
      message: "Sample database seeded",
      creators: 1,
      recipes: 3,
    });
    seedMock.seedBlueberryMuffins.mockReset().mockResolvedValue({
      id: "muffin-id",
      slug: "blueberry-muffins",
      created: true,
    });
    seedMock.updateBlueberryMuffinsContent.mockReset().mockResolvedValue({
      id: "muffin-id",
      slug: "blueberry-muffins",
      updated: true,
    });
  });

  afterEach(() => {
    if (originalSeedSecret === undefined) {
      delete process.env.MORSEL_SEED_ADMIN_SECRET;
    } else {
      process.env.MORSEL_SEED_ADMIN_SECRET = originalSeedSecret;
    }
  });

  it("does not expose a GET handler", () => {
    expect("GET" in route).toBe(false);
  });

  it("keeps seeding disabled unless the admin secret env is configured", async () => {
    delete process.env.MORSEL_SEED_ADMIN_SECRET;

    const response = await route.POST(makeRequest("anything"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Sample seeding is disabled",
    });
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
  });

  it("rejects POST requests without the admin secret", async () => {
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";

    const response = await route.POST(makeRequest());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
  });

  it("runs sample seeding when the admin secret matches", async () => {
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";

    const response = await route.POST(makeRequest("dev-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Sample database seeded",
      creators: 1,
      recipes: 3,
    });
    expect(seedMock.seedDatabase).toHaveBeenCalledTimes(1);
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
    expect(seedMock.updateBlueberryMuffinsContent).not.toHaveBeenCalled();
  });

  it("keeps targeted importing disabled without a configured secret", async () => {
    delete process.env.MORSEL_SEED_ADMIN_SECRET;

    const response = await route.POST(makeRequest("anything", "?recipe=blueberry-muffins"));

    expect(response.status).toBe(404);
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
  });

  it.each([undefined, "wrong-secret"])(
    "rejects targeted importing with absent or invalid credentials (%s)",
    async (secret) => {
      process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";

      const response = await route.POST(makeRequest(secret, "?recipe=blueberry-muffins"));

      expect(response.status).toBe(403);
      expect(seedMock.seedDatabase).not.toHaveBeenCalled();
      expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
    },
  );

  it.each(["unknown", ""])("does not seed anything for unsupported target '%s'", async (target) => {
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";

    const response = await route.POST(makeRequest("dev-secret", `?recipe=${target}`));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unknown recipe import" });
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
  });

  it("imports only the requested muffin recipe after authentication", async () => {
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";

    const response = await route.POST(makeRequest("dev-secret", "?recipe=blueberry-muffins"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "muffin-id",
      slug: "blueberry-muffins",
      created: true,
    });
    expect(seedMock.seedBlueberryMuffins).toHaveBeenCalledTimes(1);
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
    expect(seedMock.updateBlueberryMuffinsContent).not.toHaveBeenCalled();
  });

  it("keeps content updates disabled without a configured admin secret", async () => {
    delete process.env.MORSEL_SEED_ADMIN_SECRET;

    const response = await route.POST(makeRequest("anything", "?recipe=blueberry-muffins&action=update-content"));

    expect(response.status).toBe(404);
    expect(seedMock.updateBlueberryMuffinsContent).not.toHaveBeenCalled();
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
  });

  it.each([undefined, "wrong-secret"])("rejects content updates with absent or invalid credentials (%s)", async (secret) => {
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";

    const response = await route.POST(makeRequest(secret, "?recipe=blueberry-muffins&action=update-content"));

    expect(response.status).toBe(403);
    expect(seedMock.updateBlueberryMuffinsContent).not.toHaveBeenCalled();
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
  });

  it.each([
    "?recipe=blueberry-muffins&action=unknown",
    "?recipe=blueberry-muffins&action=",
    "?action=unknown",
    "?action=update-content",
    "?recipe=another-recipe&action=update-content",
  ])("rejects unsupported actions or update targets without seeding (%s)", async (query) => {
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";

    const response = await route.POST(makeRequest("dev-secret", query));

    expect(response.status).toBe(400);
    expect(seedMock.updateBlueberryMuffinsContent).not.toHaveBeenCalled();
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
  });

  it("updates only the targeted recipe when requested after authentication", async () => {
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";

    const response = await route.POST(makeRequest("dev-secret", "?recipe=blueberry-muffins&action=update-content"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "muffin-id",
      slug: "blueberry-muffins",
      updated: true,
    });
    expect(seedMock.updateBlueberryMuffinsContent).toHaveBeenCalledTimes(1);
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
  });

  it("returns 404 when the targeted content update finds no recipe", async () => {
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";
    seedMock.updateBlueberryMuffinsContent.mockResolvedValueOnce(null);

    const response = await route.POST(makeRequest("dev-secret", "?recipe=blueberry-muffins&action=update-content"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Recipe not found" });
    expect(seedMock.updateBlueberryMuffinsContent).toHaveBeenCalledTimes(1);
    expect(seedMock.seedBlueberryMuffins).not.toHaveBeenCalled();
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
  });
});
