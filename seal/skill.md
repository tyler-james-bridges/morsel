# Recipe Drop

Tell Seal what you have or what you are craving. Seal finds one creator-made Morsel recipe, unlocks the full recipe through x402 when appropriate, and returns one clean recipe card with title, hook, ingredients, steps, timing, servings, tags, and creator credit.

Author: Tyler (tmoney_145) / Morsel
Price: usually $0.50 per unlock. Always use the live recipe preview price as the source of truth.

## Listing

Title: Recipe Drop
Tagline: Tell Seal what you are craving and get one creator-made recipe unlocked as a clean recipe card.
Category: Recipe Unlock (x402)

## Host

Use `https://morsel.0x402.sh`.

Do not use `https://morsel.vercel.app/api/tool`.

## Flow

If the chat UI supports progress, use one short status line before tool calls. The final response must be exactly one JSON object. Do not narrate API steps.

1. If the user asks for "recipe of the day", "surprise me", "daily recipe", or gives no constraints, call `POST https://morsel.0x402.sh/api/tool` with `{ "action": "feed", "tab": "featured", "limit": 1 }`.
2. If the user asks for a specific recipe ID and no preview is already in context, call `POST https://morsel.0x402.sh/api/tool` with `{ "action": "recipe", "recipeId": "{recipeId}" }`.
3. Otherwise search with the user's ingredients, craving, cuisine, meal type, or dietary constraint by calling `POST https://morsel.0x402.sh/api/tool` with `{ "action": "search", "query": "plain language query", "limit": 1 }`. Add `cuisine`, `mealType`, or `dietary` only when the user supplied a real value.
4. If search returns no recipes, fall back to the featured feed before giving up.
5. Pick the first recipe preview. Preserve its title, description, price, creator, timing, servings, tags, and ID exactly.
6. Unlock the full recipe with `GET https://morsel.0x402.sh/api/recipes/{recipeId}/full`.
7. Use Seal's x402-capable fetch for the unlock request. If the x402 quote is higher than the preview price, or if the preview price is missing, ask the user before paying.
8. If unlock succeeds, format the preview plus full payload into the card contract below.
9. If unlock cannot complete, return the same card shape with empty `ingredients` and `steps`, and explain in `summary` that the preview was found but full recipe unlock did not complete.

## Examples

- "what can I make with chicken and lime, gluten-free?"
- "recipe of the day"
- "surprise me"
- "unlock this recipe ID"

## Card Contract

Return exactly one JSON object. Do not wrap it in markdown.

```json
{
  "ok": true,
  "type": "recipe_drop",
  "title": "",
  "hook": "",
  "ingredients": [],
  "steps": [],
  "time": {
    "prep_minutes": null,
    "cook_minutes": null,
    "total_minutes": null
  },
  "servings": null,
  "tags": [],
  "creator": {
    "name": "",
    "address": ""
  },
  "source": {
    "recipeId": "",
    "unlockPath": "",
    "price": ""
  },
  "summary": ""
}
```

## Rules

Never invent recipes, ingredients, steps, prices, creator names, or unlock status.

If both search and featured feed return empty, return the card shape with empty arrays and a friendly summary.

If the full payload includes `notes`, include them in `summary` only if they are useful and concise.

Keep the final output useful for cooking, not for debugging.

Do not use `POST /api/tool` as the paid unlock path. `action=recipe_full` is accepted by the API for free full recipes or payment guidance, but paid unlocks use `GET /api/recipes/{recipeId}/full`.
