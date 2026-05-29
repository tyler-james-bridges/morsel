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

if (!walletConnectProjectId && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required for production wallet connections. Create one at https://cloud.reown.com.",
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
