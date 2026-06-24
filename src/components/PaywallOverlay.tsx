"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { createRecipeAccessHeaders } from "@/lib/wallet-auth";

interface PaywallOverlayProps {
  price: string;
  creatorName: string;
  recipeTitle: string;
  recipeId: string;
  onUnlocked: (data: {
    ingredients: string[];
    steps: string[];
    notes?: string;
  }) => void;
}

const UNLOCK_STEPS = [
  "Requesting payment terms...",
  "Awaiting signature in wallet...",
  "Settling USDC on Base...",
  "Unlocked!",
];

export default function PaywallOverlay({
  price,
  creatorName,
  recipeTitle,
  recipeId,
  onUnlocked,
}: PaywallOverlayProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const [unlocking, setUnlocking] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);

  const wrongNetwork = isConnected && chainId !== base.id;
  const busy = stage >= 0;

  async function createWalletAuthHeaders() {
    if (!address || !walletClient) return null;

    return createRecipeAccessHeaders(recipeId, address, (params) =>
      walletClient.signMessage(params),
    );
  }

  async function handleUnlock() {
    if (!isConnected || !walletClient || !address) {
      openConnectModal?.();
      return;
    }

    if (wrongNetwork) {
      setSwitchingNetwork(true);
      setError(null);

      try {
        await switchChainAsync({ chainId: base.id });
      } catch {
        setError("Switch to Base to unlock this recipe.");
      } finally {
        setSwitchingNetwork(false);
      }

      return;
    }

    setUnlocking(true);
    setError(null);

    try {
      setStage(0);
      const authHeaders = await createWalletAuthHeaders();
      if (!authHeaders) {
        throw new Error("Wallet signature is required to check access");
      }

      // Step 1: Hit the x402 endpoint to get payment requirements
      const initialRes = await fetch(`/api/recipes/${recipeId}/full`, {
        headers: { Accept: "application/json", ...authHeaders },
      });

      if (initialRes.ok) {
        setStage(3);
        const data = await initialRes.json();
        onUnlocked(data);
        return;
      }

      if (initialRes.status !== 402) {
        throw new Error(`Unexpected response: ${initialRes.status}`);
      }

      // Step 2: Parse 402 response body for payment requirements
      setStage(1);
      const body = await initialRes.json();
      if (!body.accepts || (Array.isArray(body.accepts) && body.accepts.length === 0)) {
        throw new Error("No payment requirements in 402 response");
      }

      const paymentRequirements = Array.isArray(body.accepts)
        ? body.accepts
        : [body.accepts];

      // Step 3: Create payment header using x402 client
      const { createPaymentHeader, selectPaymentRequirements } = await import(
        "x402/client"
      );

      const requirement = selectPaymentRequirements(
        paymentRequirements,
        "base",
        "exact",
      );

      const x402Version = body.x402Version || 1;

      const paymentHeader = await createPaymentHeader(
        walletClient as unknown as Parameters<typeof createPaymentHeader>[0],
        x402Version,
        requirement,
      );

      // Step 4: Re-fetch with payment header.
      // Include wallet-auth headers so the server records the unlock under the
      // connected wallet address (what we check on refresh), not only the
      // on-chain payer address (which can differ for smart/delegated wallets).
      setStage(2);
      const paidAuthHeaders = await createWalletAuthHeaders();
      const paidRes = await fetch(`/api/recipes/${recipeId}/full`, {
        headers: {
          "x-payment": paymentHeader,
          ...(paidAuthHeaders ?? {}),
        },
      });

      if (!paidRes.ok) {
        const paidBody = await paidRes.json().catch(() => null);
        throw new Error(paidBody?.error || `Payment failed: ${paidRes.status}`);
      }

      setStage(3);
      const data = await paidRes.json();

      onUnlocked(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setError(msg);
      setStage(-1);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="relative">
      {/* Blurred teaser of locked content */}
      <div
        aria-hidden="true"
        className="select-none pointer-events-none"
        style={{
          filter: "blur(7px)",
          opacity: 0.4,
          maskImage: "linear-gradient(to bottom, #000 0%, transparent 62%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 62%)",
          paddingBottom: 40,
        }}
      >
        {/* Meta bar placeholder */}
        <div className="grid grid-cols-4 gap-px bg-ink/15 border border-ink/15 rounded-[4px] overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card p-3.5 text-center">
              <div className="w-[17px] h-[17px] mx-auto mb-1.5 rounded-[3px] bg-paper-2" />
              <div className="h-2.5 bg-paper-2 rounded-[3px] w-2/3 mx-auto mb-1" />
              <div className="h-3.5 bg-paper-2 rounded-[3px] w-1/2 mx-auto" />
            </div>
          ))}
        </div>
        <div className="h-6" />
        <div className="display text-[30px] mb-4">Ingredients</div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3.5 bg-card-2 rounded-[3px] my-3" style={{ width: `${90 - i * 7}%` }} />
        ))}
        <div className="display text-[30px] mt-7 mb-4">Method</div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-3 bg-card-2 rounded-[3px] my-2.5" style={{ width: i === 1 ? "80%" : "100%" }} />
        ))}
      </div>

      {/* Unlock card — receipt style */}
      <div
        className="absolute left-1/2 top-[30px] z-10"
        style={{ transform: "translateX(-50%)", width: 400, maxWidth: "94%" }}
      >
        <div className="press-card relative p-7 text-center border-ink shadow-[7px_7px_0_var(--color-ink)]">
          {/* Perforated top edge */}
          <div className="perf absolute top-[-1px] left-0 right-0" />

          {/* Lock/unlock icon tile */}
          <div
            className="w-[50px] h-[50px] mx-auto mb-4 rounded-[4px] grid place-items-center bg-ink text-accent transition-transform duration-400"
            style={{ transform: stage === 3 ? "scale(1.1) rotate(-4deg)" : "none" }}
          >
            <svg className="w-[23px] h-[23px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              {stage === 3 ? (
                <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 017-2.5" /></>
              ) : (
                <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>
              )}
            </svg>
          </div>

          {!busy ? (
            <>
              <h3 className="display text-[23px] mb-1.5">Unlock the full recipe</h3>
              <p className="text-[14px] text-ink-3 mb-1">{recipeTitle}</p>
              <p className="text-[13.5px] text-ink-3 mb-5">
                Supports <span className="text-ink-2">{creatorName}</span> directly
              </p>

              {error && (
                <p className="text-sm text-red-700 mb-4 bg-red-100 rounded-[4px] px-3 py-2 border border-red-200">
                  {error}
                </p>
              )}

              <button
                onClick={handleUnlock}
                disabled={unlocking || switchingNetwork}
                className="btn-ink w-full py-3.5 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {switchingNetwork
                  ? "Switching..."
                  : unlocking
                  ? "Processing..."
                  : !isConnected
                    ? "Connect wallet to unlock"
                    : wrongNetwork
                      ? "Switch to Base"
                      : <>Pay {price} <span className="font-mono font-medium">USDC</span></>}
              </button>

              <div className="flex items-center justify-center gap-4 mt-4 text-ink-4 text-[11.5px]">
                <span className="flex items-center gap-1.5">
                  <svg className="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 3L5 13h6l-1 8 8-10h-6z" />
                  </svg>
                  Instant on Base
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4 10-11" />
                  </svg>
                  No subscription
                </span>
              </div>
            </>
          ) : (
            <div className="py-1.5">
              <h3 className="display text-[22px] mb-[18px]">
                {stage === 3 ? "Enjoy the recipe" : "Unlocking..."}
              </h3>
              <div className="flex flex-col gap-[11px] text-left max-w-[280px] mx-auto">
                {UNLOCK_STEPS.map((s, i) => {
                  const priceVal = price.replace("$", "");
                  const stepText = s.replace("USDC", `${priceVal} USDC`);
                  return (
                    <div key={i} className="flex items-center gap-3" style={{ opacity: i <= stage ? 1 : 0.32, transition: "opacity .3s" }}>
                      <span
                        className="w-[18px] h-[18px] rounded-full flex-none grid place-items-center border-[1.5px] transition-all"
                        style={{
                          background: (i < stage || (i === stage && i === 3)) ? "var(--color-accent)" : "transparent",
                          borderColor: i <= stage ? "var(--color-accent)" : "var(--color-ink-4)",
                          color: "var(--color-accent-ink)",
                        }}
                      >
                        {(i < stage || (i === stage && i === 3)) ? (
                          <svg className="w-[11px] h-[11px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12l4 4 10-11" />
                          </svg>
                        ) : i === stage ? (
                          <span className="w-[9px] h-[9px] border-[1.5px] border-accent border-t-transparent rounded-full animate-spin" />
                        ) : null}
                      </span>
                      <span className="font-mono text-[12.5px]" style={{ color: i <= stage ? "var(--color-ink-2)" : "var(--color-ink-4)" }}>
                        {stepText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!busy && (
          <p className="font-mono text-[10.5px] text-ink-4 text-center mt-3.5">
            x402 &middot; USDC on Base &middot; creator receives {price}
          </p>
        )}
      </div>
    </div>
  );
}
