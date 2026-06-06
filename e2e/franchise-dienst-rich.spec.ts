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

// Een dienst draagt tarief, gevraagde skills en vereiste certificaten — voor matching en compliance.
// Dit zet er één uit via de (rijke) cockpit-inline-vorm en bewijst dat de eisen op de opdracht landen.
test("franchiser zet een dienst uit met tarief, skill en vereiste VOG", async ({ page }) => {
  test.slow();
  await login(page, "franchise@zzp-platform.local");

  // Naar de cockpit van de seed-opdrachtgever met afdeling Geriatrie.
  await page.goto("/franchise/opdrachtgevers");
  await page.getByRole("link", { name: /Verpleeghuis De Noorderbrug/ }).click();
  await page.waitForURL(/\/franchise\/opdrachtgevers\/[a-z0-9]+$/);

  // Inline dienst uitzetten met de rijke velden.
  await page.getByText("Dienst uitzetten", { exact: true }).click();
  const dienst = `Rijke dienst ${uniq()}`;
  await page.getByLabel("Titel").fill(dienst);
  await page
    .getByLabel("Omschrijving")
    .fill("Nachtdienst geriatrie met duidelijke eisen en tarief.");
  await page.getByLabel("Tarief vanaf (€/uur)").fill("40");
  await page.getByLabel("Tarief tot (€/uur)").fill("55");
  await page.locator('label:has(input[name="skillIds"])').first().click();
  await page.locator('label:has(input[name="credentialTypes"][value="VOG"])').click();
  await page.getByRole("button", { name: "Uitzetten", exact: true }).click();
  await expect(page.getByText(`"${dienst}" uitgezet.`)).toBeVisible();
  await shot(page, "franchise-dienst-rich-form");

  // Open de dienst en controleer dat de eisen erop staan.
  await page.getByRole("link", { name: dienst }).click();
  await page.waitForURL(/\/opdrachten\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: dienst })).toBeVisible();
  await expect(page.getByText("Vereiste skills")).toBeVisible();
  await expect(page.getByText("Vereiste certificaten")).toBeVisible();
  await expect(page.getByText("VOG", { exact: true })).toBeVisible();
  await shot(page, "franchise-dienst-rich-detail");
});
