// Tool gates and x402 payment utilities for ERC-8257 integration
// This file provides helper utilities for gating tool actions

export interface GateContext {
  isGated: boolean;
  reason?: string;
}

export function shouldGateRecipeFull(recipe: { isFree: number | boolean; priceUsdcAtomic: number }): GateContext {
  // Free recipes are not gated
  if (recipe.isFree === 1 || recipe.isFree === true) {
    return { isGated: false };
  }
  
  // Paid recipes with a price > 0 should be gated
  if (recipe.priceUsdcAtomic > 0) {
    return { isGated: true, reason: "Recipe requires payment to unlock full content" };
  }
  
  // Edge case: not marked as free but no price set
  return { isGated: false };
}