import { getAddress, isAddress, type Hex } from "viem";

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

type WalletAuthSigner = (params: {
  account: `0x${string}`;
  message: string;
}) => Promise<Hex>;

function buildWalletAuthHeaders(
  address: `0x${string}`,
  signature: Hex,
  timestamp: string,
) {
  return {
    "x-wallet-address": address,
    "x-wallet-signature": signature,
    "x-wallet-timestamp": timestamp,
  };
}

export async function createRecipeAccessHeaders(
  recipeId: string,
  address: `0x${string}`,
  signMessage: WalletAuthSigner,
) {
  const checksumAddress = getAddress(address);
  const timestamp = Date.now().toString();
  const message = buildRecipeAccessMessage(recipeId, checksumAddress, timestamp);
  const signature = await signMessage({ account: checksumAddress, message });

  return buildWalletAuthHeaders(checksumAddress, signature, timestamp);
}

export async function createCreatorPublishHeaders(
  address: `0x${string}`,
  signMessage: WalletAuthSigner,
) {
  const checksumAddress = getAddress(address);
  const timestamp = Date.now().toString();
  const message = buildCreatorPublishMessage(checksumAddress, timestamp);
  const signature = await signMessage({ account: checksumAddress, message });

  return buildWalletAuthHeaders(checksumAddress, signature, timestamp);
}
