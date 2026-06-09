// Aparte Playwright-config voor de persona-sweep (zelf-test-lus). Draait tegen een PRODUCTIE-build
// (`npm run start`), zodat dev-only chrome zoals de Next.js dev-indicator de screenshots niet vervuilt
// — die was in iteratie 0 een vals-positief. De persona-reizen muteren demo-data (opdracht plaatsen,
// facturen genereren), dus ze staan bewust BUITEN de gating-suite (zie testIgnore in playwright.config.ts)
// om andere parallelle tests niet te beïnvloeden. Recept: zie LOOP.md.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/personas",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  projects: [{ name: "ci", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Productie-build + start; reuse als er al een prod-server draait. Bouw vooraf met `npm run build`.
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
