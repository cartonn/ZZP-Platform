import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { clickForUrl } from "./_robust";

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

// De geleide onboarding-wizard: opdrachtgever → afdelingen → diensten → afronding, in één doorloop.
test("franchiser onboardt een opdrachtgever via de geleide wizard", async ({ page }) => {
  test.slow();
  await login(page, "franchise@zzp-platform.local");

  // Start de wizard vanaf de lijst.
  await page.goto("/franchise/opdrachtgevers");
  await page
    .getByRole("link", { name: /Nieuwe opdrachtgever/ })
    .first()
    .click();
  await page.waitForURL(/\/franchise\/opdrachtgevers\/nieuw/);

  // Stap 1 — opdrachtgever.
  const company = `Verpleeghuis ${uniq()}`;
  await page.fill("#companyName", company);
  await page.fill("#location", "Utrecht");
  await page.fill("#contactName", "Anna de Vries");
  await page.fill("#email", `wizard-${uniq()}@test.local`);
  await page.getByRole("button", { name: "Aanmaken en verder" }).click();
  await expect(page.getByText(`${company} is aangemaakt.`)).toBeVisible();
  await shot(page, "wizard-1-creds");
  await page.getByRole("link", { name: /Volgende: afdelingen/ }).click();
  await page.waitForURL(/stap=afdelingen/);

  // Stap 2 — afdelingen.
  await page.fill("#name", "Geriatrie");
  await page.getByRole("button", { name: /Afdeling toevoegen/ }).click();
  await expect(page.getByText("Geriatrie").first()).toBeVisible();
  await shot(page, "wizard-2-afdelingen");
  await page.getByRole("link", { name: /Volgende: diensten/ }).click();
  await page.waitForURL(/stap=diensten/);

  // Stap 3 — een dienst uitzetten op de (enige) afdeling.
  const dienst = `Nachtdienst ${uniq()}`;
  await page.fill("#title", dienst);
  await page.fill("#description", "Nachtdienst op de afdeling geriatrie, VOG vereist.");
  await page.getByRole("button", { name: "Dienst uitzetten" }).click();
  await expect(page.getByText(`"${dienst}" uitgezet.`)).toBeVisible();
  await shot(page, "wizard-3-diensten");
  // Robuust: de pagina her-rendert net na het uitzetten van de dienst; herhaal de klik tot de
  // afrondingsstap er echt staat.
  await clickForUrl(page.getByRole("link", { name: "Afronden" }), page, /stap=klaar/);

  // Afronding.
  await expect(page.getByRole("heading", { name: `${company} staat klaar` })).toBeVisible();
  await shot(page, "wizard-4-klaar");

  // Naar de cockpit: afdeling én dienst staan erop.
  await page.getByRole("link", { name: "Naar opdrachtgever" }).click();
  await page.waitForURL(/\/franchise\/opdrachtgevers\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: company })).toBeVisible();
  await expect(page.getByText("Geriatrie").first()).toBeVisible();
  await expect(page.getByRole("link", { name: dienst })).toBeVisible();
});
