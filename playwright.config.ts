import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.MORSEL_BASE_URL || "http://localhost:3000";

// DEMO=1 slows every action down so the flow is easy to follow on a livestream.
const demoMode = process.env.DEMO === "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  retries: 0,
  // The specs share one app database (seed/delete/publish), so they must
  // not run concurrently.
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    video: demoMode
      ? { mode: "on", size: { width: 1280, height: 800 } }
      : "retain-on-failure",
    launchOptions: demoMode
      ? { slowMo: Number(process.env.DEMO_SLOWMO || 500) }
      : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
