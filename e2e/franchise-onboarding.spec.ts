import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

// De opdrachtgever-cockpit: per afdeling een dienst inline uitzetten (de snelle route, naast de
// wizard). Setup via de wizard (opdrachtgever + afdeling), dienst-stap overgeslagen.
test("franchiser zet vanaf de cockpit inline een dienst uit op een afdeling", async ({ page }) => {
  test.slow();
  await login(page, "franchise@zzp-platform.local");

  // Opdrachtgever + afdeling aanmaken via de wizard, dienst-stap overslaan.
  await page.goto("/franchise/opdrachtgevers/nieuw");
  const company = `Zorgcentrum ${uniq()}`;
  await page.fill("#companyName", company);
  await page.fill("#location", "Assen");
  await page.fill("#contactName", "Karin de Vries");
  await page.fill("#email", `cockpit-${uniq()}@test.local`);
  await page.getByRole("button", { name: "Aanmaken en verder" }).click();
  await page.getByRole("link", { name: /Volgende: afdelingen/ }).click();
  await page.waitForURL(/stap=afdelingen/);
  await page.fill("#name", "Geriatrie");
  await page.getByRole("button", { name: /Afdeling toevoegen/ }).click();
  await expect(page.getByText("Geriatrie").first()).toBeVisible();
  await page.getByRole("link", { name: /Volgende: diensten/ }).click();
  await page.waitForURL(/stap=diensten/);
  await page.getByRole("link", { name: "Overslaan" }).click();
  await page.getByRole("link", { name: "Naar opdrachtgever" }).click();
  await page.waitForURL(/\/franchise\/opdrachtgevers\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: company })).toBeVisible();
  // Nog geen dienst → de hervat-balk staat er.
  await expect(page.getByText("Onboarding nog niet afgerond")).toBeVisible();

  // Inline dienst uitzetten op de afdeling (inklapbaar blok openen), met skill + VOG (rijke velden).
  await page.getByText("Dienst uitzetten", { exact: true }).click();
  const dienst = `Nachtdienst ${uniq()}`;
  await page.getByLabel("Titel").fill(dienst);
  await page.getByLabel("Omschrijving").fill("Nachtdienst op de afdeling geriatrie, VOG vereist.");
  await page.locator('label:has(input[name="skillIds"])').first().click();
  await page.locator('label:has(input[name="credentialTypes"][value="VOG"])').click();
  await page.getByRole("button", { name: "Uitzetten", exact: true }).click();

  // De dienst verschijnt met status "Gepubliceerd" en blijft na herladen.
  await expect(page.getByText(`"${dienst}" uitgezet.`)).toBeVisible();
  await expect(page.getByRole("link", { name: dienst })).toBeVisible();
  await expect(page.getByText("Gepubliceerd").first()).toBeVisible();
  await shot(page, "franchise-cockpit-dienst");
  await page.reload();
  await expect(page.getByRole("link", { name: dienst })).toBeVisible();
  // Nu een afdeling én een dienst → de hervat-balk is weg.
  await expect(page.getByText("Onboarding nog niet afgerond")).toHaveCount(0);
});
