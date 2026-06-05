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

// De franchise-onboarding-cockpit: een opdrachtgever toevoegen mét afdeling, dan vanaf de
// detailpagina per afdeling een dienst uitzetten — alles op één plek.
test("franchiser onboardt een opdrachtgever met afdeling en zet er een dienst uit", async ({
  page,
}) => {
  test.slow();
  await login(page, "franchise@zzp-platform.local");

  // Opdrachtgever toevoegen met één afdeling.
  await page.goto("/franchise/opdrachtgevers");
  const company = `Zorgcentrum ${uniq()}`;
  await page.fill("#companyName", company);
  await page.fill("#location", "Assen");
  await page.fill("#contactName", "Karin de Vries");
  await page.fill("#email", `cockpit-${uniq()}@test.local`);
  await page.fill("#departments", "Geriatrie");
  await page.getByRole("button", { name: "Opdrachtgever toevoegen" }).click();

  // Doorlopen naar de cockpit via de onboarding-link.
  await expect(page.getByText(`${company} toegevoegd.`)).toBeVisible();
  await page.getByRole("link", { name: /Verder met afdelingen/ }).click();
  await page.waitForURL(/\/franchise\/opdrachtgevers\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: company })).toBeVisible();
  await expect(page.getByText("Geriatrie")).toBeVisible();

  // Dienst uitzetten op de afdeling (inklapbaar blok openen).
  await page.getByText("Dienst uitzetten", { exact: true }).click();
  const dienst = `Nachtdienst ${uniq()}`;
  await page.getByLabel("Titel").fill(dienst);
  await page.getByLabel("Omschrijving").fill("Nachtdienst op de afdeling geriatrie, VOG vereist.");
  await page.getByRole("button", { name: "Uitzetten", exact: true }).click();

  // De dienst verschijnt in de afdeling met status "Gepubliceerd".
  await expect(page.getByText(`"${dienst}" uitgezet.`)).toBeVisible();
  await expect(page.getByRole("link", { name: dienst })).toBeVisible();
  await expect(page.getByText("Gepubliceerd").first()).toBeVisible();
  await shot(page, "franchise-cockpit-dienst");

  // Blijft staan na herladen (server-side bewaard).
  await page.reload();
  await expect(page.getByRole("link", { name: dienst })).toBeVisible();
});
