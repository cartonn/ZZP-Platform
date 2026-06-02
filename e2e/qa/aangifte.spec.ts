import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { clickUntil } from "../_robust";

// Verifieert de aangifte-delegatie: upsell zonder tier, en de volledige consent →
// concept → review-then-submit flow mét Volledig Ontzorgd.
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

test.describe("QA: Wij doen je aangifte", () => {
  test("zonder Volledig Ontzorgd: upsell, geen consent-formulier", async ({ page }) => {
    await login(page, "youssef@zzp-platform.local"); // FREE-tier ZZP'er
    await page.goto("/ontzorgd/aangifte");
    await expect(page.getByText("Onderdeel van Volledig Ontzorgd")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start mijn aangifte" })).toHaveCount(0);
    await shot(page, "aangifte-upsell");
  });

  test("volledige flow: upgrade → consent → concept → review-then-submit", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");

    // Upgrade naar Volledig Ontzorgd via de abonnementspagina (echte gebruikersflow).
    // Robuust klikken: server-action-knoppen reageren pas na hydratie (zie _robust).
    await page.goto("/abonnement");
    await clickUntil(
      page.getByRole("button", { name: "Kies Volledig Ontzorgd" }),
      page
        .locator("div.bg-card", { hasText: "Jij werkt, wij doen de administratie" })
        .getByText("Huidig", { exact: true }),
    );

    await page.goto("/ontzorgd/aangifte");
    await expect(page.getByRole("heading", { name: "Wij doen je aangifte" })).toBeVisible();

    // Granulaire consent: alle drie aanvinken + starten.
    await page.locator('input[name="consentDpa"]').check();
    await page.locator('input[name="consentShare"]').check();
    await page.locator('input[name="consentMandate"]').check();
    await clickUntil(
      page.getByRole("button", { name: "Start mijn aangifte" }),
      page.getByText("Concept klaar — wacht op jouw akkoord"),
    );
    await shot(page, "aangifte-concept");
    await clickUntil(
      page.getByRole("button", { name: "Akkoord — dien in" }),
      page.getByText("Ingediend bij de Belastingdienst"),
    );

    // Ingediend met ontvangstbevestiging.
    await expect(page.getByText("Ingediend bij de Belastingdienst")).toBeVisible();
    await expect(page.getByText(/Ontvangstbevestiging/)).toBeVisible();
    await shot(page, "aangifte-ingediend");
  });

  test("nergens het woord 'AI'", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/ontzorgd/aangifte");
    const body = await page.locator("body").innerText();
    expect(body.match(/\bAI\b/g)).toBeNull();
  });
});
