import { expect, test } from "@playwright/test";

// Het ontwerp-lab is een PUBLIEK, inlogvrij design-lab (alleen fictieve mock-data). Deze smoke
// borgt dat een niet-ingelogde bezoeker /ontwerp én de concept-pagina's kan openen zonder naar
// /login te worden geredirect (regressie-vangnet voor de isPublicPath-regel in middleware.ts).

test("publiek: /ontwerp opent zonder login en toont de galerij", async ({ page }) => {
  await page.goto("/ontwerp");
  await expect(page).toHaveURL(/\/ontwerp$/);
  await expect(page.getByRole("heading", { name: /Tien richtingen/i })).toBeVisible();
});

test("publiek: concept 01 opent zonder login", async ({ page }) => {
  await page.goto("/ontwerp/01");
  await expect(page).toHaveURL(/\/ontwerp\/01$/);
  // De route-chrome rendert voor elk concept een terug-link "alle concepten".
  await expect(page.getByRole("link", { name: /alle concepten/i })).toBeVisible();
});

test("publiek: concept 02 opent zonder login", async ({ page }) => {
  await page.goto("/ontwerp/02");
  await expect(page).toHaveURL(/\/ontwerp\/02$/);
  await expect(page.getByRole("link", { name: /alle concepten/i })).toBeVisible();
});
