import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /.well-known/ai-tool/morsel.json", () => {
  it("serves the ERC-8257 tool manifest", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");

    const manifest = await res.json();
    expect(manifest.type).toBe("https://ercs.ethereum.org/ERCS/erc-8257#tool-manifest-v1");
    expect(manifest.name).toBe("morsel");
    expect(manifest.endpoint).toMatch(/\/api\/tool$/);
    expect(manifest.inputs.required).toEqual(["action"]);
  });
});
