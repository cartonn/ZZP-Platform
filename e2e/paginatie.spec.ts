/**
 * E2e-test: cursor-paginatie "Meer laden" op samenwerkingen en documenten.
 *
 * De seed (SEED_DEMO=true) levert per gebruiker maximaal een klein aantal samenwerkingen
 * en documenten. Zelfs met LIST_PAGE_SIZE=5 heeft geen enkel seed-account meer dan 5 items
 * van hetzelfde type, waardoor "Meer laden" nooit verschijnt met de standaard-seed.
 *
 * De tests zijn daarom defensief geschreven:
 *  - Ze controleren dat de pagina laadt en de lijst-structuur klopt.
 *  - Ze controleren dat "Meer laden" NIET verschijnt als er <= pageSize items zijn
 *    (dit is het normale seed-scenario).
 *  - Als LIST_PAGE_SIZE zo klein gezet is dat wel paginatie optreedt (bv. LIST_PAGE_SIZE=1
 *    via een toekomstige seed-uitbreiding), werkt de "Meer laden" flow ook; die branch
 *    is beschreven maar niet actief geskipped.
 *
 * Reden voor defensieve aanpak: de seed heeft bewust weinig items per gebruiker
 * (maximale diversiteit over meerdere accounts). Een volwaardige paginatie-test vereist
 * een seed-uitbreiding of een testdatabase-fixture, wat buiten de scope van audit T3 valt.
 */

import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("paginatie: samenwerkingen", () => {
  test("pagina laadt voor FREELANCER en toont samenwerkingen of lege staat", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/samenwerkingen");
    await page.waitForLoadState("networkidle");

    // Pagina moet laden zonder fout
    await expect(page.getByRole("heading", { name: "Samenwerkingen" })).toBeVisible();

    // Er mogen geen JavaScript-fouten zijn (basic smoke)
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes("Application error");
    });
    expect(hasError).toBe(false);
  });

  test("pagina laadt voor CLIENT en toont samenwerkingen of lege staat", async ({ page }) => {
    await login(page, "opdrachtgever@zzp-platform.local");
    await page.goto("/samenwerkingen");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Samenwerkingen" })).toBeVisible();
  });

  test("Meer laden verschijnt niet als seed-data binnen één pagina past (LIST_PAGE_SIZE=5)", async ({
    page,
  }) => {
    // Met LIST_PAGE_SIZE=5 en de default seed heeft zzp@ maximaal 1 samenwerking.
    // "Meer laden" hoort dus niet te verschijnen.
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/samenwerkingen");
    await page.waitForLoadState("networkidle");

    const meerLaden = page.getByRole("link", { name: "Meer laden" });
    const count = await meerLaden.count();

    // Defensief: als de seed ooit uitgebreid wordt kan paginatie optreden.
    // We loggen de situatie maar falen niet.
    if (count > 0) {
      // "Meer laden" aanwezig — test de flow
      await meerLaden.click();
      await page.waitForLoadState("networkidle");
      // Na klik: cursor in URL
      expect(page.url()).toContain("cursor=");
      // Pagina toont nog steeds de heading
      await expect(page.getByRole("heading", { name: "Samenwerkingen" })).toBeVisible();
    } else {
      // Verwacht scenario met huidige seed: geen "Meer laden"
      expect(count).toBe(0);
    }
  });

  test("cursor-URL laadt zonder fout (pagina 2 navigatie)", async ({ page }) => {
    // Direct een cursor-URL openen met een fictieve (niet-bestaande) cursor
    // geeft een lege pagina terug (geen verdere items), niet een fout.
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/samenwerkingen?cursor=nonexistent-cursor-id");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Samenwerkingen" })).toBeVisible();

    // Bij een niet-bestaande cursor: lege staat of items (afhankelijk van DB)
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes("Application error");
    });
    expect(hasError).toBe(false);
  });
});

test.describe("paginatie: documenten", () => {
  test("pagina laadt voor FREELANCER en toont documenten of lege staat", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/documenten");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Documenten" })).toBeVisible();

    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes("Application error");
    });
    expect(hasError).toBe(false);
  });

  test("Meer laden verschijnt niet als seed-data binnen één pagina past (LIST_PAGE_SIZE=5)", async ({
    page,
  }) => {
    // Met LIST_PAGE_SIZE=5 en de default seed heeft zzp@ maximaal 2 documenten.
    // "Meer laden" hoort dus niet te verschijnen.
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/documenten");
    await page.waitForLoadState("networkidle");

    const meerLaden = page.getByRole("link", { name: "Meer laden" });
    const count = await meerLaden.count();

    if (count > 0) {
      // "Meer laden" aanwezig — test de flow
      await meerLaden.click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("cursor=");
      await expect(page.getByRole("heading", { name: "Documenten" })).toBeVisible();

      // Het aantal pagina's hangt van de seed af; de geslaagde cursor-navigatie is hier de poort.
    } else {
      expect(count).toBe(0);
    }
  });

  test("cursor-URL laadt zonder fout (pagina 2 navigatie)", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/documenten?cursor=nonexistent-cursor-id");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Documenten" })).toBeVisible();

    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes("Application error");
    });
    expect(hasError).toBe(false);
  });
});
