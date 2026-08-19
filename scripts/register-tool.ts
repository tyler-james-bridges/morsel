#!/usr/bin/env npx tsx
/**
 * Register Morsel as an ERC-8257 tool on Base.
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx scripts/register-tool.ts
 *
 * Or with RPC override:
 *   PRIVATE_KEY=0x... RPC_URL=https://mainnet.base.org npx tsx scripts/register-tool.ts
 *
 * Flags:
 *   --dry-run    Print summary without transacting
 *   --network    base (default) or mainnet
 */

import { computeManifestHash, validateManifest, ToolRegistryClient } from "@opensea/tool-sdk"
import { createWalletClient, http, type Chain } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { base, mainnet } from "viem/chains"
import { BASE_DATA_SUFFIX } from "../src/lib/builder-code"

// -- Manifest (must match src/lib/tool-manifest.ts exactly) --
const manifest = {
  type: "https://eips.ethereum.org/EIPS/eip-8257#tool-manifest-v1" as const,
  name: "morsel",
  description:
    "Recipe marketplace with micropayments. Search recipes, browse creators, and unlock full recipe content (ingredients, steps, notes) via x402 USDC payments on Base.",
  endpoint: "https://morsel.0x402.sh",
  inputs: {
    type: "object" as const,
    properties: {
      action: {
        type: "string" as const,
        enum: ["search", "feed", "recipe", "recipe_full", "creators", "creator"],
        description: "Which operation to perform",
      },
      recipeId: { type: "string" as const, description: "Recipe ID (required for recipe, recipe_full)" },
      query: { type: "string" as const, description: "Search query text" },
      cuisine: { type: "string" as const },
      mealType: { type: "string" as const },
      dietary: { type: "string" as const },
      tab: {
        type: "string" as const,
        enum: ["featured", "latest", "trending"],
        description: "Feed tab (default: featured)",
      },
      limit: { type: "integer" as const, minimum: 1, maximum: 50 },
      cursor: { type: "string" as const },
      creatorAddress: {
        type: "string" as const,
        description: "Creator wallet address (required for creator action)",
      },
    },
    required: ["action"] as const,
  },
  outputs: {
    type: "object" as const,
    properties: {
      recipes: { type: "array" as const, description: "List of recipe previews" },
      recipe: { type: "object" as const, description: "Single recipe data" },
      creators: { type: "array" as const, description: "List of creators" },
      creator: { type: "object" as const, description: "Single creator profile" },
      nextCursor: { type: "string" as const, description: "Pagination cursor" },
      error: { type: "string" as const, description: "Error message if action failed" },
    },
  },
  creatorAddress: "0xa102a2cb8aac6c7d2c477412ebb7d41d0ce53495" as const,
  tags: ["recipes", "food", "micropayments", "x402", "base"],
}

const METADATA_URI = "https://morsel.0x402.sh/.well-known/ai-tool/morsel.json"

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const networkArg = args.find((a) => a.startsWith("--network="))
  const networkName = networkArg?.split("=")[1] || "base"

  // Validate manifest
  const validation = validateManifest(manifest)
  if (!validation.success) {
    console.error("Manifest validation failed:")
    console.error(JSON.stringify(validation.error, null, 2))
    process.exit(1)
  }
  console.log("[ok] Manifest validates against ERC-8257 schema")

  // Compute hash
  const manifestHash = computeManifestHash(manifest)
  console.log(`[ok] Manifest hash: ${manifestHash}`)

  // Summary
  console.log("")
  console.log("Registration summary:")
  console.log(`  Name:         ${manifest.name}`)
  console.log(`  Endpoint:     ${manifest.endpoint}`)
  console.log(`  Metadata URI: ${METADATA_URI}`)
  console.log(`  Creator:      ${manifest.creatorAddress}`)
  console.log(`  Hash:         ${manifestHash}`)
  console.log(`  Network:      ${networkName}`)
  console.log(`  Predicate:    none (open access)`)
  console.log("")

  if (dryRun) {
    console.log("[dry-run] Would register tool with above parameters. Exiting.")
    process.exit(0)
  }

  // Check for private key
  const pk = process.env.PRIVATE_KEY
  if (!pk) {
    console.error("PRIVATE_KEY env var required for registration.")
    console.error("Usage: PRIVATE_KEY=0x... npx tsx scripts/register-tool.ts")
    process.exit(1)
  }

  const chain: Chain = networkName === "mainnet" ? mainnet : base
  const rpcUrl = process.env.RPC_URL || (chain.id === 8453 ? "https://mainnet.base.org" : undefined)

  const account = privateKeyToAccount(pk as `0x${string}`)
  console.log(`[ok] Wallet: ${account.address}`)

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
    dataSuffix: chain.id === base.id ? BASE_DATA_SUFFIX : undefined,
  })

  const registry = new ToolRegistryClient({
    chain,
    walletClient,
  })

  console.log("Registering tool onchain...")
  const result = await registry.registerTool({
    metadataURI: METADATA_URI,
    manifest,
  })

  console.log("")
  console.log("Registration complete!")
  console.log(`  Tool ID: ${result.toolId}`)
  console.log(`  Tx hash: ${result.txHash}`)
  console.log(`  Explorer: https://basescan.org/tx/${result.txHash}`)
  console.log("")
  console.log("Verify with:")
  console.log(`  npx @opensea/tool-sdk inspect --tool-id ${result.toolId} --network ${networkName}`)
}

main().catch((err) => {
  console.error("Registration failed:", err.message || err)
  process.exit(1)
})
