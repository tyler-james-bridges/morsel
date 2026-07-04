import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.MORSEL_BASE_URL || "http://localhost:3000";

// DEMO=1 slows every action down so the flow is easy to follow on a livestream.
const demoMode = process.env.DEMO === "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    video: demoMode ? "on" : "retain-on-failure",
    launchOptions: demoMode ? { slowMo: 500 } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
