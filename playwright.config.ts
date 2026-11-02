import { defineConfig, devices } from "@playwright/test";

/**
 * Browser smoke tests. By default they start the app locally in deterministic mode (no API key, no token spend).
 * Against a deployment:  BASE_URL=https://<your-app>.vercel.app npm run test:e2e
 */
const external = process.env.BASE_URL?.replace(/\/$/, "");
const port = Number(process.env.E2E_PORT || 3250);

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: 1,
  reporter: [["list"]],
  use: { baseURL: external || `http://127.0.0.1:${port}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: external ? undefined : {
    command: `npx next dev -p ${port}`,
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { RATE_LIMIT_PER_MINUTE: "1000", OPENROUTER_API_KEY: "", NEXT_TELEMETRY_DISABLED: "1" },
  },
  projects: [
    { name: "mobile-320", use: { ...devices["Pixel 5"], viewport: { width: 320, height: 640 } } },
    { name: "mobile-375", use: { ...devices["iPhone 12"], viewport: { width: 375, height: 740 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "laptop-1366", use: { viewport: { width: 1366, height: 768 } } },
    { name: "desktop-1920", use: { viewport: { width: 1920, height: 1080 } } },
  ],
});
