"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

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

export default function PaywallOverlay({
  price,
  creatorName,
  recipeTitle,
  recipeId,
  onUnlocked,
}: PaywallOverlayProps) {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock() {
    if (!isConnected || !walletClient || !address) {
      openConnectModal?.();
      return;
    }

    setUnlocking(true);
    setError(null);

    try {
      // Step 1: Hit the x402 endpoint to get payment requirements
      const initialRes = await fetch(`/api/recipes/${recipeId}/full`);

      if (initialRes.ok) {
        // Already unlocked or no payment needed
        const data = await initialRes.json();
        onUnlocked(data);
        return;
      }

      if (initialRes.status !== 402) {
        throw new Error(`Unexpected response: ${initialRes.status}`);
      }

      // Step 2: Parse 402 response for payment requirements
      const requirementsHeader = initialRes.headers.get("x-payment-requirements");
      if (!requirementsHeader) {
        throw new Error("No payment requirements in 402 response");
      }

      const paymentRequirements = JSON.parse(
        Buffer.from(requirementsHeader, "base64").toString("utf-8"),
      );

      // Step 3: Create payment header using x402 client
      const { createPaymentHeader } = await import("x402/client");

      const requirement = Array.isArray(paymentRequirements)
        ? paymentRequirements[0]
        : paymentRequirements;

      const x402Version = parseInt(
        initialRes.headers.get("x-payment-version") || "1",
      );

      const paymentHeader = await createPaymentHeader(
        // wagmi walletClient is compatible at runtime; cast for x402 types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        walletClient as any,
        x402Version,
        requirement,
      );

      // Step 4: Re-fetch with payment header
      const paidRes = await fetch(`/api/recipes/${recipeId}/full`, {
        headers: {
          "x-payment": paymentHeader,
        },
      });

      if (!paidRes.ok) {
        throw new Error(`Payment failed: ${paidRes.status}`);
      }

      const data = await paidRes.json();

      // Step 5: Record the unlock
      await fetch(`/api/recipes/${recipeId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerAddress: address }),
      });

      onUnlocked(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setError(msg);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="relative">
      {/* Blurred placeholder content */}
      <div className="blur-md opacity-30 select-none pointer-events-none">
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-16" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded w-1/3" />
            <div className="h-3 bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-800 rounded w-5/6" />
            <div className="h-3 bg-gray-800 rounded w-4/5" />
            <div className="h-3 bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-800 rounded w-3/4" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded w-1/4" />
            <div className="h-3 bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-800 rounded w-5/6" />
            <div className="h-3 bg-gray-800 rounded w-full" />
          </div>
        </div>
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl shadow-black/50">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-100 mb-1">
            Unlock this recipe
          </h3>
          <p className="text-sm text-gray-500 mb-1">{recipeTitle}</p>
          <p className="text-sm text-gray-500 mb-6">by {creatorName}</p>

          {error && (
            <p className="text-sm text-red-400 mb-4 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleUnlock}
            disabled={unlocking}
            className="w-full py-3 rounded-lg bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {unlocking
              ? "Processing..."
              : !isConnected
                ? "Connect Wallet to Unlock"
                : `Pay ${price} with USDC`}
          </button>

          <p className="text-xs text-gray-600 mt-4 leading-relaxed">
            Instant payment on Base. No subscription.
            <br />
            Creator gets paid directly.
          </p>
        </div>
      </div>
    </div>
  );
}
