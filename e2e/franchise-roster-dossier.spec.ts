import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

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
  await page.getByText("Lars Bakker").first().click();
  await page.waitForURL("**/franchise/zzpers/**");

  // Het dossier toont de tab-navigatie; Profiel is standaard actief.
  await expect(page.getByRole("link", { name: "Profiel" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
  await shot(page, "franchise-dossier-profiel");

  // Wissel naar Bestanden (certificaten) en Overeenkomsten.
  await page.getByRole("link", { name: /Bestanden/ }).click();
  await expect(page).toHaveURL(/tab=bestanden/);

  await page.getByRole("link", { name: /Overeenkomsten/ }).click();
  await expect(page).toHaveURL(/tab=overeenkomsten/);

  // Logboek-tab is bereikbaar.
  await page.getByRole("link", { name: "Logboek" }).click();
  await expect(page).toHaveURL(/tab=logboek/);
  await shot(page, "franchise-dossier-logboek");
});
