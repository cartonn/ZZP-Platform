import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // De persona-sweep (e2e/personas/*) draait apart via playwright.personas.config.ts tegen een
  // productie-build; die reizen muteren demo-data en horen niet in de gating-suite.
  testIgnore: ["**/personas/**"],
  // Ruimt na de suite de @test.local-fixtureaccounts op die de abuse/IDOR-suite registreert,
  // zodat ze niet in de admin-gebruikerslijst/tellingen blijven hangen (vooral in een gedeelde dev-DB).
  globalTeardown: "./e2e/global-teardown.ts",
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
    // Bundled Chromium voor CI (GitHub Actions). Gebruik: npx playwright test --project=ci
    { name: "ci", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
