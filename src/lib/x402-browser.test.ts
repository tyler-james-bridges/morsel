import { encodePaymentRequiredHeader } from "@x402/core/http";
import type { PaymentRequired } from "@x402/core/types";
import { describe, expect, it } from "vitest";
import { readPaymentRequired } from "./x402-browser";

const paymentRequired: PaymentRequired = {
  x402Version: 2,
  resource: {
    url: "https://morsel.0x402.sh/api/recipes/recipe-1/full",
    description: "Unlock recipe",
    mimeType: "application/json",
  },
  accepts: [
    {
      scheme: "exact",
      network: "eip155:8453",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      amount: "500000",
      payTo: "0x668aDd9213985E7Fd613Aec87767C892f4b9dF1c",
      maxTimeoutSeconds: 300,
      extra: { name: "USD Coin", version: "2", decimals: 6 },
    },
  ],
};

describe("readPaymentRequired", () => {
  it("reads x402 v2 payment requirements from the Payment-Required header", async () => {
    const response = new Response("{}", {
      status: 402,
      headers: {
        "payment-required": encodePaymentRequiredHeader(paymentRequired),
      },
    });

    await expect(readPaymentRequired(response)).resolves.toMatchObject({
      x402Version: 2,
      accepts: [expect.objectContaining({ amount: "500000", network: "eip155:8453" })],
    });
  });

  it("rejects 402 responses without payment requirements", async () => {
    const response = new Response("{}", { status: 402 });

    await expect(readPaymentRequired(response)).rejects.toThrow(
      "No payment requirements in 402 response",
    );
  });
});
