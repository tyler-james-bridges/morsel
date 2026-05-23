import { getAddress, isAddress } from "viem";

export const WALLET_AUTH_WINDOW_MS = 5 * 60 * 1000;

export function buildRecipeAccessMessage(
  recipeId: string,
  address: string,
  timestamp: string,
) {
  const normalizedAddress = isAddress(address) ? getAddress(address) : address;

  return [
    "Morsel recipe access",
    `Recipe: ${recipeId}`,
    `Address: ${normalizedAddress}`,
    `Timestamp: ${timestamp}`,
  ].join("\n");
}

export function buildCreatorPublishMessage(address: string, timestamp: string) {
  const normalizedAddress = isAddress(address) ? getAddress(address) : address;

  return [
    "Morsel creator publish",
    `Address: ${normalizedAddress}`,
    `Timestamp: ${timestamp}`,
  ].join("\n");
}
