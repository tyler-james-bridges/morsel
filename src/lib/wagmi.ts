import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Morsel",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "morsel-recipe-app",
  chains: [base],
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
