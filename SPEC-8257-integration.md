# SPEC: ERC-8257 Agent Tool Registry Integration

**Status:** Draft
**Date:** 2026-05-28
**Author:** Poppy (via Tyler)

---

## Goal

Make Morsel's recipe platform discoverable and consumable by AI agents through the ERC-8257 Agent Tool Registry on Base. Agents should be able to find recipes, browse creators, and pay to unlock full recipe content, all programmatically via registered tool endpoints.

## Why

Morsel already has x402 micropayments and wallet auth on Base. ERC-8257 adds the missing layers:
- **Discovery**: Agents find Morsel tools through an onchain registry instead of hardcoded URLs
- **Access control**: Pluggable predicates enable NFT-gated recipes, subscription tiers, or open pay-per-call
- **Composability**: Other tools and agents can build on top of Morsel's registered endpoints
- **Credibility**: First recipe platform in the 8257 registry. Early mover in the agent tool economy.

## Current State

Morsel has these API endpoints today:
- `GET /api/feed` - Paginated recipe feed (featured/latest/trending)
- `GET /api/recipes` - Search/filter recipes
- `GET /api/recipes/[id]` - Recipe preview (public metadata)
- `GET /api/recipes/[id]/full` - Full recipe content (x402 gated)
- `GET /api/creators/top` - Top creators
- `GET /api/creators/[address]` - Creator profile
- `POST /api/recipes/create` - Publish a recipe

Payment: x402 on the `/full` endpoint, USDC on Base, paid to creator address.
Auth: SIWE-style wallet signature for unlock persistence.

## Architecture Decision

**Register as a single multi-action tool** (not one tool per endpoint).

Rationale: The 8257 manifest supports structured inputs/outputs. A single "morsel" tool with an `action` field keeps registry overhead low and lets agents discover the full platform in one lookup. Individual endpoints still handle their own gating.

Alternative considered: Separate tool registrations per endpoint. Rejected because it fragments discovery and creates registration/maintenance overhead for what's logically one platform.

## Tool Manifest

Served at: `/.well-known/ai-tool/morsel.json`

```json
{
  "type": "https://ercs.ethereum.org/ERCS/erc-8257#tool-manifest-v1",
  "name": "morsel",
  "description": "Recipe marketplace with micropayments. Search recipes, browse creators, and unlock full recipe content (ingredients, steps, notes) via x402 USDC payments on Base.",
  "endpoint": "https://morsel-eight.vercel.app",
  "inputs": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["search", "feed", "recipe", "recipe_full", "creators", "creator"],
        "description": "Which operation to perform"
      },
      "recipeId": {
        "type": "string",
        "description": "Recipe ID (required for recipe, recipe_full)"
      },
      "query": {
        "type": "string",
        "description": "Search query text"
      },
      "cuisine": { "type": "string" },
      "mealType": { "type": "string" },
      "dietary": { "type": "string" },
      "tab": {
        "type": "string",
        "enum": ["featured", "latest", "trending"],
        "description": "Feed tab (default: featured)"
      },
      "limit": { "type": "integer", "minimum": 1, "maximum": 50 },
      "cursor": { "type": "string" },
      "creatorAddress": { "type": "string" }
    },
    "required": ["action"]
  },
  "outputs": {
    "type": "object",
    "properties": {
      "recipes": { "type": "array" },
      "recipe": { "type": "object" },
      "creators": { "type": "array" },
      "creator": { "type": "object" },
      "nextCursor": { "type": "string" }
    }
  },
  "creatorAddress": "0x...",
  "verifiability": {
    "tier": "self-attested",
    "dataRetention": "ephemeral",
    "sourceVisibility": "public"
  }
}
```

## Access Strategy

**Phase 1 (this spec): Open + x402 pay-per-call**
- No predicate gate on the tool registration (any agent can discover and call)
- Free endpoints (search, feed, creators) return data directly
- Paid endpoint (recipe_full) returns x402 402 challenge, agent pays USDC to unlock
- This matches the existing model, just makes it agent-discoverable

**Phase 2 (future): Subscription NFT gating**
- Mint a "Morsel Pro" ERC-5643 subscription NFT collection
- Gate premium features (bulk exports, creator analytics, early access recipes) via SubscriptionPredicate
- Tiered access: Free tier (open) vs Pro tier (subscription NFT)
- Uses the ERC-5643 predicate that @codincowboy just shipped

**Phase 3 (future): Creator-level NFT gates**
- Individual creators can mint access-pass NFTs for their recipe collections
- Gate their recipes via ERC721OwnerPredicate
- Creates a secondary market for creator access (tradeable on OpenSea)

This spec implements Phase 1 only.

---

## Work Packages

### WP1: Tool Handler Endpoint
**File:** `src/app/api/tool/route.ts`

Create a unified tool endpoint that routes based on `action` input:
- `search` -> delegates to recipe search logic
- `feed` -> delegates to feed logic
- `recipe` -> returns recipe preview
- `recipe_full` -> returns full content with x402 gate (existing logic)
- `creators` -> returns top creators
- `creator` -> returns creator profile by address

The handler uses `createToolHandler` from `@opensea/tool-sdk` with the manifest and input/output schemas. x402 gating wraps only the `recipe_full` action.

**Acceptance:**
- All 6 actions return correct data
- `recipe_full` returns 402 for paid recipes, 200 for free
- Invalid actions return structured error
- Tests cover each action

### WP2: Well-Known Manifest Endpoint
**File:** `src/app/.well-known/ai-tool/morsel.json/route.ts`

Serve the tool manifest at the well-known path. Uses `createWellKnownHandler` from the SDK or a static JSON response.

**Acceptance:**
- `GET /.well-known/ai-tool/morsel.json` returns valid manifest
- `npx @opensea/tool-sdk validate` passes
- `npx @opensea/tool-sdk verify <url>` passes after deploy
- Origin binding matches production domain

### WP3: SDK Integration + Gating Middleware
**Files:** `src/lib/tool-manifest.ts`, `src/lib/tool-gates.ts`

- Install `@opensea/tool-sdk` as dependency
- Define manifest in TypeScript (type-safe via `defineManifest`)
- Wire up x402 gate for paid actions using SDK's gate middleware
- SIWE auth layer for future predicate support (prep work, not gated yet)

**Acceptance:**
- Manifest hash matches between TypeScript definition and served JSON
- x402 gate correctly challenges on `recipe_full`
- `npx @opensea/tool-sdk dry-run-gate` passes locally
- Build passes with new dependency

### WP4: Onchain Registration
**Script:** `scripts/register-tool.ts`

Registration script that:
1. Exports and validates the manifest
2. Deploys manifest to well-known endpoint (via Vercel deploy)
3. Registers tool onchain on Base via `ToolRegistryClient`
4. No predicate (open access for Phase 1)
5. Logs tool ID for future reference

**Acceptance:**
- Script runs successfully against Base
- Tool appears in ToolRegistry with correct metadata URI and manifest hash
- `npx @opensea/tool-sdk inspect --tool-id <id>` shows correct state
- Tool ID documented in README

### WP5: Tests + Smoke Test
**Files:** `src/app/api/tool/route.test.ts`, `scripts/smoke-test.ts`

- Unit tests for the tool handler (all 6 actions)
- Integration test for x402 flow on recipe_full
- Smoke test script using `@opensea/tool-sdk smoke` against production
- Verify round-trip: discover -> verify manifest -> call free action -> call paid action

**Acceptance:**
- `npm run test` passes with new tests
- Smoke test passes against deployed endpoint
- x402 payment flow works end-to-end for an agent caller

---

## Dependencies

- `@opensea/tool-sdk` (new dependency)
- Existing: `x402-next`, `viem`, `wagmi`
- Base RPC for onchain registration
- Private key for registration tx (Tyler's wallet or Morsel deployer)

## Risks

1. **Vercel ephemeral DB**: SQLite resets on cold starts. Existing issue, not new. Seed data handles it.
2. **x402 + 8257 interaction**: The SDK's x402 gate and our existing `withX402` wrapper need to play nice. May need to use one or the other, not both.
3. **Manifest hash drift**: If we change the manifest without updating onchain, agents will fail verification. Need a deploy script that handles both.

## Non-Goals

- Subscription NFT minting (Phase 2)
- Creator-level NFT gates (Phase 3)
- MCP server (could layer on later, 8257 handles discovery, MCP handles invocation protocol)
- New UI changes (this is purely API/infra)

---

## Execution Order

WP3 (SDK setup) -> WP1 (handler) -> WP2 (well-known) -> WP5 (tests) -> WP4 (registration)

WP3 first because WP1 depends on the manifest definition and gate middleware. WP4 last because it requires a live deployment.
