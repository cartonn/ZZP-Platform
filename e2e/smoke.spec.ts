import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Echte "browser doorklik": deze smoke-test draait de gebouwde UI in een headless
// Chromium, doorloopt de loginflow per rol en legt screenshots vast. De screenshots
// (e2e/screenshots/) worden tijdens review visueel geïnspecteerd op layout, leesbaarheid
// en overflow (zie CLAUDE.md designregels). Uitbreiden per sessie naarmate schermen erbij komen.

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test("loginpagina rendert", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Inloggen" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await shot(page, "01-login");
});

test("guard: ongeauthenticeerd /dashboard -> /login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("FREELANCER logt in en ziet role-aware dashboard", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
  // Werkruimte-kop (#19): de h1 toont de naam; de hoofdkolom toont de opdrachtenlijst.
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sanne");
  await expect(page.getByText("Opdrachten voor jou")).toBeVisible();
  // role-aware nav: freelancer ziet "Mijn profiel" (de hub), niet "Verificaties".
  // (Certificaten/Beschikbaarheid/Documenten zitten nu in de profiel-hub-tabs, niet in de zijbalk.)
  await expect(nav.getByText("Mijn profiel")).toBeVisible();
  await expect(nav.getByText("Verificaties")).toHaveCount(0);
  // Zijbalk is standaard uitgeklapt: labels én sectiekoppen zijn meteen zichtbaar (geen naamloze rail).
  await expect(nav.getByText("Werk", { exact: true })).toBeVisible();
  await shot(page, "02-dashboard-freelancer");
});

test("ADMIN logt in en ziet beheer-navigatie", async ({ page }) => {
  await login(page, "admin@zzp-platform.local");
  const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
  await expect(page.getByText("Platformstatus")).toBeVisible();
  await expect(nav.getByText("Verificaties")).toBeVisible();
  await expect(nav.getByText("Gebruikers")).toBeVisible();
  await shot(page, "03-dashboard-admin");
});

test("CLIENT logt in en ziet opdrachtgever-navigatie", async ({ page }) => {
  await login(page, "opdrachtgever@zzp-platform.local");
  const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
  await expect(nav.getByText("Bedrijfsprofiel")).toBeVisible();
  await expect(nav.getByText("Reacties")).toBeVisible();
  await shot(page, "04-dashboard-client");
});

test("fout wachtwoord toont foutmelding", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "zzp@zzp-platform.local");
  await page.fill("#password", "fout-wachtwoord");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page.getByText("Onjuiste e-mail of wachtwoord")).toBeVisible();
  await shot(page, "05-login-error");
});

test("uitloggen brengt terug naar /login", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.getByRole("button", { name: "Uitloggen" }).click();
  // De logout-redirect draagt de Clear-Site-Data-marker (?uitgelogd=1), dus matchen we /login
  // met of zonder querystring (zie src/lib/security/clear-site-data.ts).
  await page.waitForURL(/\/login(\?|$)/);
  await expect(page.getByRole("heading", { name: "Inloggen" })).toBeVisible();
});
