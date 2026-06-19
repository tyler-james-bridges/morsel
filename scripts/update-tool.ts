import { computeManifestHash, validateManifest, ToolRegistryClient } from "@opensea/tool-sdk"
import { createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { base } from "viem/chains"

const METADATA_URI = "https://morsel.0x402.sh/.well-known/ai-tool/morsel.json"
const TOOL_ID = 28n

async function main() {
  // Fetch the LIVE manifest to ensure hash matches exactly
  console.log("Fetching live manifest...")
  const res = await fetch(METADATA_URI)
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`)
  const manifest = await res.json()

  const validation = validateManifest(manifest)
  if (!validation.success) {
    console.error("Manifest validation failed:", JSON.stringify(validation.error, null, 2))
    process.exit(1)
  }

  const hash = computeManifestHash(manifest)
  console.log(`[ok] Manifest validates, hash: ${hash}`)

  const pk = process.env.PRIVATE_KEY
  if (!pk) { console.error("PRIVATE_KEY required"); process.exit(1) }

  const account = privateKeyToAccount(pk as `0x${string}`)
  console.log(`[ok] Wallet: ${account.address}`)

  const walletClient = createWalletClient({ account, chain: base, transport: http("https://mainnet.base.org") })
  const registry = new ToolRegistryClient({ chain: base, walletClient })

  console.log(`Updating tool #${TOOL_ID} metadata onchain...`)
  const txHash = await registry.updateToolMetadata(TOOL_ID, METADATA_URI, manifest)
  console.log(`\nDone! Tx: https://basescan.org/tx/${txHash}`)
}

main().catch(err => { console.error("Failed:", err.message); process.exit(1) })
