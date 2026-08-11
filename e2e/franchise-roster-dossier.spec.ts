import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { clickForUrl } from "./_robust";

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

test("franchise-roster-dossier: ZZP'er-detail toont tabs en wisselt van onderdeel", async ({
  page,
}) => {
  await login(page, "franchise@zzp-platform.local");

  // Open de roster en de eerste ZZP'er.
  await page.goto("/franchise/zzpers");
  await expect(page.getByRole("heading", { name: "ZZP'ers" })).toBeVisible();
  // Filter op naam en klik de dossier-link van de (enige) rij — de naam-tekst zelf is geen
  // klikdoel en de anchor bevat de naam niet.
  await page.goto("/franchise/zzpers?q=Lars");
  await page.locator('a[href^="/franchise/zzpers/"]').first().click();
  await page.waitForURL("**/franchise/zzpers/**");

  // Het dossier toont de tab-navigatie; Profiel is standaard actief.
  await expect(page.getByRole("link", { name: "Profiel" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
  await shot(page, "franchise-dossier-profiel");

  // Wissel naar Bestanden (certificaten) en Overeenkomsten. Robuuste tab-kliks: een klik vlak
  // na een client-navigatie kan verloren gaan; herhaal tot de URL het bewijst.
  await clickForUrl(page.getByRole("link", { name: /Bestanden/ }), page, /tab=bestanden/);
  await clickForUrl(page.getByRole("link", { name: /Overeenkomsten/ }), page, /tab=overeenkomsten/);

  // Logboek-tab is bereikbaar.
  await clickForUrl(page.getByRole("link", { name: "Logboek" }), page, /tab=logboek/);
  await shot(page, "franchise-dossier-logboek");
});
