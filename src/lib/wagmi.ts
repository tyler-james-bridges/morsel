import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  base as baseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { base } from "wagmi/chains";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;

// A missing WalletConnect project id must NOT crash the production build.
// This module is evaluated during static prerendering (e.g. /_not-found),
// where throwing aborts the entire build. WalletConnect is one optional
// connector; degrade gracefully and only warn in browser development.
if (
  typeof window !== "undefined" &&
  !walletConnectProjectId &&
  process.env.NODE_ENV === "development"
) {
  console.warn(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will be " +
      "unavailable. Set it for full wallet support: https://cloud.reown.com.",
  );
}

export const config = getDefaultConfig({
  appName: "Morsel",
  projectId: walletConnectProjectId ?? "YOUR_PROJECT_ID",
  chains: [base],
  ssr: true,
  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        rainbowWallet,
        metaMaskWallet,
        baseWallet,
        injectedWallet,
      ],
    },
    {
      groupName: "Other",
      wallets: [walletConnectWallet],
    },
  ],
  transports: {
    [base.id]: http(baseRpcUrl),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
