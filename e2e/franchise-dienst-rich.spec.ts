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

// Een uitgezette dienst draagt nu tarief, gevraagde skills en vereiste certificaten — voor betere
// matching en compliance. Dit bewijst dat die op de opdracht terechtkomen.
test("franchiser zet een dienst uit met tarief, skill en vereiste VOG", async ({ page }) => {
  test.slow();
  await login(page, "franchise@zzp-platform.local");
  await page.goto("/franchise/diensten");

  // Seed-opdrachtgever met afdeling Geriatrie.
  await page.selectOption("#companyId", { label: "Verpleeghuis De Noorderbrug" });
  const dienst = `Rijke dienst ${uniq()}`;
  await page.fill("#title", dienst);
  await page.fill("#description", "Nachtdienst geriatrie met duidelijke eisen en tarief.");
  await page.fill("#rateMin", "40");
  await page.fill("#rateMax", "55");
  await page.locator('label:has(input[name="skillIds"])').first().click();
  await page.locator('label:has(input[name="credentialTypes"][value="VOG"])').click();
  await page.getByRole("button", { name: "Dienst uitzetten" }).click();
  await expect(page.getByText(`"${dienst}" uitgezet.`)).toBeVisible();
  await shot(page, "franchise-dienst-rich-form");

  // Open de dienst via de opdrachtgever-cockpit en controleer dat de eisen erop staan.
  await page.goto("/franchise/opdrachtgevers");
  await page.getByRole("link", { name: /Verpleeghuis De Noorderbrug/ }).click();
  await page.waitForURL(/\/franchise\/opdrachtgevers\/[a-z0-9]+$/);
  await page.getByRole("link", { name: dienst }).click();
  await page.waitForURL(/\/opdrachten\/[a-z0-9]+$/);

  await expect(page.getByRole("heading", { name: dienst })).toBeVisible();
  await expect(page.getByText("Vereiste skills")).toBeVisible();
  await expect(page.getByText("Vereiste certificaten")).toBeVisible();
  await expect(page.getByText("VOG", { exact: true })).toBeVisible();
  await shot(page, "franchise-dienst-rich-detail");
});
