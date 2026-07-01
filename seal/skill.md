# Recipe Drop

Tell Seal what you have or what you are craving, then return one pure JSON recipe card with title, hook, ingredients, steps, time, servings, tags, and creator credit.

Author: Tyler (tmoney_145) / morsel
Price: $0.50 target per unlock. Live Morsel recipes currently expose their own unlock price in the recipe preview.

## Confirmed Production Host

Use `https://morsel.0x402.sh`.

`https://morsel.vercel.app/api/tool` returns `405` to POST and is not the Seal host.

## Call Contract

1. Route the natural-language ask with `routeRecipeDropAsk`.
2. Call `POST https://morsel.0x402.sh/api/tool` with the returned body for `search` or `feed`.
3. Pick the first recipe preview.
4. Unlock the full recipe through the existing x402 endpoint: `GET https://morsel.0x402.sh/api/recipes/{recipeId}/full`.
5. Format preview + full payload with `formatRecipeDropCard`.

The PRD expected `POST /api/tool { "action": "recipe_full" }` to be the paid path. The live deployed contract currently points paid unlocks to `/api/recipes/{id}/full`, so the listing uses that real endpoint instead of inventing a new payment flow.

## Examples

- "what can I make with chicken and lime, gluten-free?"
- "recipe of the day"
- "surprise me"
- "unlock this recipe ID" when Seal already has a real recipe ID from search or feed

## Card Contract

Returns pure JSON with `ok`, `type`, `title`, `hook`, `ingredients`, `steps`, `time`, `servings`, `tags`, `creator`, `source`, and `summary`. `source` includes the unlocked recipe ID, unlock path, and observed price when present.

Empty search results must fall back to featured feed before returning the card. If no recipe is available after fallback, return the same card shape with empty `ingredients` and `steps` and a friendly summary.
