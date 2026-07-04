import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const seedMock = vi.hoisted(() => ({
  seedDatabase: vi.fn(),
}));

vi.mock("@/lib/seed", () => ({
  seedDatabase: seedMock.seedDatabase,
}));

import * as route from "./route";

const originalSeedSecret = process.env.MORSEL_SEED_ADMIN_SECRET;

function makeRequest(secret?: string) {
  return new NextRequest("http://localhost/api/seed", {
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
  });

  it("rejects POST requests without the admin secret", async () => {
    process.env.MORSEL_SEED_ADMIN_SECRET = "dev-secret";

    const response = await route.POST(makeRequest());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(seedMock.seedDatabase).not.toHaveBeenCalled();
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
  });
});
