const USDC_ATOMIC_PER_DOLLAR = 1_000_000;
const USDC_ATOMIC_PER_CENT = 10_000;
const MAX_USD_CENTS = 100_000_000;

export function parseUsdInputToUsdcAtomic(value: unknown) {
  const normalized =
    typeof value === "number"
      ? value.toString()
      : typeof value === "string"
        ? value.trim().replace(/^\$/, "")
        : null;

  if (!normalized || !/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const wholeCents = Number(wholePart) * 100;
  const cents = wholeCents + Number(fractionalPart.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents < 1 || cents > MAX_USD_CENTS) {
    return null;
  }

  return cents * USDC_ATOMIC_PER_CENT;
}

export function usdToUsdcAtomic(value: number) {
  return Math.round(value * USDC_ATOMIC_PER_DOLLAR);
}

export function usdcAtomicToUsdNumber(value: number) {
  return value / USDC_ATOMIC_PER_DOLLAR;
}

export function getPriceUsdcAtomic(record: {
  price?: number | null;
  priceUsdcAtomic?: number | null;
}) {
  if (
    typeof record.priceUsdcAtomic === "number" &&
    Number.isSafeInteger(record.priceUsdcAtomic) &&
    record.priceUsdcAtomic > 0
  ) {
    return record.priceUsdcAtomic;
  }

  return usdToUsdcAtomic(record.price ?? 0);
}

export function formatUsdcAtomicAsUsd(value: number) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  const cents = Math.round(absolute / USDC_ATOMIC_PER_CENT);
  const dollars = Math.floor(cents / 100);
  const remainder = String(cents % 100).padStart(2, "0");

  return `${sign}$${dollars}.${remainder}`;
}

export function formatRecipePrice(record: {
  price?: number | null;
  priceUsdcAtomic?: number | null;
}) {
  return formatUsdcAtomicAsUsd(getPriceUsdcAtomic(record));
}
