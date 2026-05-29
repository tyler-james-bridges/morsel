import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock the database module
vi.mock("@/lib/db", () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue([]),
  };
  return {
    default: mockDb,
    getDb: vi.fn().mockResolvedValue(mockDb),
  };
});

vi.mock("@/lib/money", () => ({
  getPriceUsdcAtomic: vi.fn().mockReturnValue(500000),
  formatRecipePrice: vi.fn().mockReturnValue("$0.50"),
  formatUsdcAtomicAsUsd: vi.fn().mockReturnValue("$0.00"),
}));

vi.mock("@/lib/tool-queries", () => ({
  searchRecipes: vi.fn().mockResolvedValue([
    {
      id: "recipe-1",
      title: "Test Recipe",
      description: "A test recipe",
      price: "$0.50",
      cuisine: "italian",
      mealType: "dinner",
      dietaryTags: ["vegetarian"],
      creatorName: "Chef Test",
    },
  ]),
  getFeedRecipes: vi.fn().mockResolvedValue({
    recipes: [
      {
        id: "recipe-1",
        title: "Featured Recipe",
        description: "A featured recipe",
        price: "$1.00",
      },
    ],
    nextCursor: null,
  }),
  getRecipeById: vi.fn().mockImplementation(async (_db: unknown, id: string) => {
    if (id === "not-found") return null;
    return {
      id,
      title: "Test Recipe",
      description: "A test recipe",
      price: "$0.50",
      cuisine: "italian",
      isFree: false,
      creator: { address: "0x123", name: "Chef", bio: "", avatarUrl: "", slug: "chef" },
    };
  }),
  getTopCreators: vi.fn().mockResolvedValue([
    { address: "0x123", name: "Chef Test", avatarUrl: "", recipeCount: 5 },
  ]),
  getCreatorByAddress: vi.fn().mockImplementation(async (_db: unknown, address: string) => {
    if (address === "0xnotfound") return null;
    return {
      creator: {
        address,
        name: "Chef Test",
        bio: "A chef",
        avatarUrl: "",
        slug: "chef-test",
        bannerUrl: "",
        socialLinks: {},
        recipeCount: 2,
        totalEarned: "$5.00",
      },
      recipes: [],
    };
  }),
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/tool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("input validation", () => {
    it("rejects missing body", async () => {
      const req = new NextRequest("http://localhost:3000/api/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{{{",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("rejects missing action", async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("action is required");
    });

    it("rejects invalid action", async () => {
      const res = await POST(makeRequest({ action: "invalid" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid action");
    });

    it("rejects limit out of range", async () => {
      const res = await POST(makeRequest({ action: "feed", limit: 100 }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("limit");
    });
  });

  describe("search action", () => {
    it("returns recipes matching filters", async () => {
      const res = await POST(makeRequest({ action: "search", cuisine: "italian" }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recipes).toBeDefined();
      expect(data.recipes.length).toBeGreaterThan(0);
    });

    it("returns recipes with no filters", async () => {
      const res = await POST(makeRequest({ action: "search" }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recipes).toBeDefined();
    });
  });

  describe("feed action", () => {
    it("returns paginated feed", async () => {
      const res = await POST(makeRequest({ action: "feed", tab: "featured", limit: 5 }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recipes).toBeDefined();
    });

    it("defaults to featured tab", async () => {
      const res = await POST(makeRequest({ action: "feed" }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recipes).toBeDefined();
    });
  });

  describe("recipe action", () => {
    it("returns recipe preview by ID", async () => {
      const res = await POST(makeRequest({ action: "recipe", recipeId: "recipe-1" }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recipe).toBeDefined();
      expect(data.recipe.id).toBe("recipe-1");
    });

    it("requires recipeId", async () => {
      const res = await POST(makeRequest({ action: "recipe" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("recipeId is required");
    });

    it("returns error for non-existent recipe", async () => {
      const res = await POST(makeRequest({ action: "recipe", recipeId: "not-found" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("not found");
    });
  });

  describe("recipe_full action", () => {
    it("requires recipeId", async () => {
      const res = await POST(makeRequest({ action: "recipe_full" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("recipeId is required");
    });
  });

  describe("creators action", () => {
    it("returns top creators", async () => {
      const res = await POST(makeRequest({ action: "creators" }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.creators).toBeDefined();
      expect(data.creators.length).toBeGreaterThan(0);
    });
  });

  describe("creator action", () => {
    it("returns creator profile by address", async () => {
      const res = await POST(makeRequest({ action: "creator", creatorAddress: "0x123" }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.creator).toBeDefined();
      expect(data.creator.address).toBe("0x123");
    });

    it("requires creatorAddress", async () => {
      const res = await POST(makeRequest({ action: "creator" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("creatorAddress is required");
    });

    it("returns error for non-existent creator", async () => {
      const res = await POST(makeRequest({ action: "creator", creatorAddress: "0xnotfound" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("not found");
    });
  });
});
