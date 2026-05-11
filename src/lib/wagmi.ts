import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Morsel",
  projectId: "morsel-recipe-platform",
  chains: [base],
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
