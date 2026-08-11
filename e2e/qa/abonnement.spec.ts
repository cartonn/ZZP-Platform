import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Verifieert de waardegebaseerde abonnementstiers (Gratis / Zelf-doen / Volledig Ontzorgd).
const SHOTS = path.join("e2e", "qa", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("QA: Abonnementstiers", () => {
  test("ZZP'er ziet Gratis / Zelf-doen / Volledig Ontzorgd met aanbevolen-markering", async ({
    page,
  }) => {
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/abonnement");
    await expect(page.getByText("Zelf-doen", { exact: true })).toBeVisible();
    await expect(page.getByText("Volledig Ontzorgd", { exact: true })).toBeVisible();
    await expect(page.getByText("Aanbevolen", { exact: true })).toBeVisible();
    // Geen percentage-over-omzet (Besluit 1): expliciet benoemd.
    await expect(page.getByText(/geen percentage over je omzet/i)).toBeVisible();
    await shot(page, "abonnement-freelancer");
  });

  test("opdrachtgever ziet rolspecifieke tiers (Zakelijk / Inhuurdesk)", async ({ page }) => {
    await login(page, "opdrachtgever@zzp-platform.local");
    await page.goto("/abonnement");
    // Scope naar de hoofdinhoud: "Zakelijk" staat ook als sectiekop in de zijbalk-nav.
    await expect(page.locator("#hoofdinhoud").getByText("Zakelijk", { exact: true })).toBeVisible();
    await expect(
      page.locator("#hoofdinhoud").getByText("Inhuurdesk", { exact: true }),
    ).toBeVisible();
    await shot(page, "abonnement-client");
  });
});
