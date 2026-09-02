import { expect, test, type Page } from "@playwright/test";

// Het ontwerp-lab is een INTERN, ingelogd design-lab (alleen fictieve mock-data). Deze smoke borgt
// dat (1) een niet-ingelogde bezoeker naar /login wordt geredirect — het lab is niet meer publiek —
// en (2) een ingelogde admin de galerij én de on-demand concept-pagina's kan openen.

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "admin@zzp-platform.local");
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test("intern: /ontwerp redirect een niet-ingelogde bezoeker naar login", async ({ page }) => {
  await page.goto("/ontwerp");
  await expect(page).toHaveURL(/\/login/);
});

test("intern: een ingelogde ZZP'er komt niet in het lab", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "zzp@zzp-platform.local");
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/ontwerp");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("intern: admin opent de galerij", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/ontwerp");
  await expect(page).toHaveURL(/\/ontwerp$/);
  await expect(page.getByRole("heading", { name: /richtingen voor de herontwerp/i })).toBeVisible();
});

test("intern: admin opent concept 01 on-demand", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/ontwerp/01");
  await expect(page).toHaveURL(/\/ontwerp\/01$/);
  // De route-chrome rendert voor elk concept een terug-link "alle concepten".
  await expect(page.getByRole("link", { name: /alle concepten/i })).toBeVisible();
});

test("intern: admin opent concept 02 on-demand", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/ontwerp/02");
  await expect(page).toHaveURL(/\/ontwerp\/02$/);
  await expect(page.getByRole("link", { name: /alle concepten/i })).toBeVisible();
});
