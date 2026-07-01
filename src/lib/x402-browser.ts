import { decodePaymentRequiredHeader } from "@x402/core/http";
import type { PaymentRequired } from "@x402/core/types";

export async function readPaymentRequired(response: Response) {
  const header = response.headers.get("payment-required");
  const paymentRequired = header
    ? decodePaymentRequiredHeader(header)
    : await response.json().catch(() => null);

  if (
    !paymentRequired ||
    typeof paymentRequired !== "object" ||
    !("accepts" in paymentRequired) ||
    !Array.isArray(paymentRequired.accepts) ||
    paymentRequired.accepts.length === 0
  ) {
    throw new Error("No payment requirements in 402 response");
  }

  return paymentRequired as PaymentRequired;
}
