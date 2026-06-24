import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_PREFIX = "morsel_access_";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getSecret() {
  return process.env.MORSEL_ACCESS_TOKEN_SECRET ?? process.env.DATABASE_URL ?? null;
}

function getCookieName(recipeId: string) {
  return `${COOKIE_PREFIX}${Buffer.from(recipeId).toString("base64url")}`;
}

function sign(recipeId: string, buyerAddress: string, expiresAt: number, secret: string) {
  return createHmac("sha256", secret)
    .update(`${recipeId}:${buyerAddress}:${expiresAt}`)
    .digest("base64url");
}

export function createRecipeAccessCookie(recipeId: string, buyerAddress: string) {
  const secret = getSecret();
  if (!secret) return null;

  const normalizedBuyer = buyerAddress.toLowerCase();
  const expiresAt = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const signature = sign(recipeId, normalizedBuyer, expiresAt, secret);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${getCookieName(recipeId)}=${normalizedBuyer}.${expiresAt}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`;
}

export function readRecipeAccessCookie(recipeId: string, cookieValue?: string) {
  const secret = getSecret();
  if (!secret || !cookieValue) return null;

  const [buyerAddress, expiresAtRaw, signature] = cookieValue.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!buyerAddress || !signature || !Number.isFinite(expiresAt)) return null;
  if (expiresAt < Math.floor(Date.now() / 1000)) return null;

  const expected = sign(recipeId, buyerAddress, expiresAt, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;

  return timingSafeEqual(actualBuffer, expectedBuffer) ? buyerAddress : null;
}

export function getRecipeAccessCookieName(recipeId: string) {
  return getCookieName(recipeId);
}
