// Payment routing config.
//
// PAYOUT_ADDRESS is the wallet that receives x402 USDC settlements.
// It is intentionally decoupled from a creator's identity address so we can
// route revenue to a reputable, lived-in wallet (ack-onchain.base.eth) that
// wallet-security scanners (Blockaid/MetaMask) recognize — avoiding the
// "deceptive request" false-positive that fresh, low-history EOAs trigger.
//
// ack-onchain.base.eth
export const PAYOUT_ADDRESS =
  "0x668aDd9213985E7Fd613Aec87767C892f4b9dF1c" as const;
