import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalWalletConnect = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

function restoreEnv() {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }

  if (originalWalletConnect === undefined) {
    delete process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  } else {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = originalWalletConnect;
  }
}

describe("GET /api/health", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("returns JSON liveness with status healthy", async () => {
    process.env.DATABASE_URL = "postgresql://example";
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = "project-id";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      status: "healthy",
      service: "morsel",
      timestamp: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
      checks: {
        databaseUrl: true,
        walletConnectProjectId: true,
      },
    });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it("reports missing config as booleans without leaking secrets", async () => {
    process.env.DATABASE_URL = "postgresql://user:super-secret@localhost/morsel";
    delete process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

    const response = await GET();
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks).toEqual({
      databaseUrl: true,
      walletConnectProjectId: false,
    });
    expect(serialized).not.toContain("super-secret");
    expect(serialized).not.toContain("postgresql://");
  });
});
