import { describe, expect, it } from "vitest";
import {
  formatUsdcAtomicAsUsd,
  parseUsdInputToUsdcAtomic,
  usdToUsdcAtomic,
} from "./money";

describe("money helpers", () => {
  it("parses cent-priced USD inputs to USDC atomic units", () => {
    expect(parseUsdInputToUsdcAtomic("$0.50")).toBe(500_000);
    expect(parseUsdInputToUsdcAtomic("1")).toBe(1_000_000);
    expect(parseUsdInputToUsdcAtomic("1.50")).toBe(1_500_000);
  });

  it("rejects invalid price inputs", () => {
    expect(parseUsdInputToUsdcAtomic("0")).toBeNull();
    expect(parseUsdInputToUsdcAtomic("0.501")).toBeNull();
    expect(parseUsdInputToUsdcAtomic("abc")).toBeNull();
  });

  it("formats USDC atomic units as USD strings", () => {
    expect(formatUsdcAtomicAsUsd(250_000)).toBe("$0.25");
    expect(formatUsdcAtomicAsUsd(1_500_000)).toBe("$1.50");
    expect(formatUsdcAtomicAsUsd(usdToUsdcAtomic(2))).toBe("$2.00");
  });
});
