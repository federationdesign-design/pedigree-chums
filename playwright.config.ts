import { defineConfig } from "@playwright/test";

// Hidden Games journey suite (BRIEF 11.2), WCAG (section 9) and performance
// (section 9) evidence. Runs headless against a dev server. Each test gets a
// fresh browser context, so localStorage starts empty (a fresh visitor) unless
// the test seeds it. Mobile viewport by default (390px, per CLAUDE.md).
export default defineConfig({
  testDir: "./tests/hidden-games/journeys",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180000,
  },
});
