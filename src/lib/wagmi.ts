import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";

// Get a real project ID from https://cloud.reown.com
// MetaMask/injected wallets work without one, but WalletConnect needs it
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        injectedWallet,
        coinbaseWallet,
        rainbowWallet,
      ],
    },
    {
      groupName: "Other",
      wallets: [walletConnectWallet],
    },
  ],
  { appName: "Morsel", projectId }
);

export const config = createConfig({
  connectors,
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
