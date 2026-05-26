import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Eén gedeelde dev-server + zware multi-context tests → incidentele timing-flakes.
  // Een echte bug faalt ook na retry; een flake niet. (CI strenger met 2.)
  retries: process.env.CI ? 2 : 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // Edge (chromium-gebaseerd) via systeem-install: de Playwright-browser-CDN staat
    // niet in de netwerk-allowlist van deze omgeving, msedge wel (packages.microsoft.com).
    { name: "edge", use: { ...devices["Desktop Edge"], channel: "msedge" } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
