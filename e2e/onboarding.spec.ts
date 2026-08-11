import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  // FREELANCER is standaard geselecteerd; geen klik nodig.
  await page.fill("#name", "Test Freelancer");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

async function registerClient(page: Page, email: string) {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Test Opdrachtgever");
  await page.fill("#companyName", "Testbedrijf B.V.");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

test("registratiepagina rendert en toont bedrijfsnaam voor opdrachtgever", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Account aanmaken" })).toBeVisible();
  await expect(page.locator("#companyName")).toHaveCount(0);
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await expect(page.locator("#companyName")).toBeVisible();
  await shot(page, "06-register");
});

test("freelancer registreert, vult profiel en publiceert het", async ({ page, browser }) => {
  const email = `freelancer-${uniq()}@test.local`;
  await registerFreelancer(page, email);

  await page.goto("/profiel/bewerken");
  await expect(page.getByRole("heading", { name: "Profiel bewerken" })).toBeVisible();

  await page.fill("#headline", "Senior Frontend Developer");
  await page.fill("#bio", "Tien jaar ervaring met React en TypeScript.");
  await page.fill("#hourlyRate", "85");
  await page.fill("#location", "Amsterdam");
  await page.selectOption("#availability", "AVAILABLE");
  await page.fill("#languages", "nl, en");
  await page.getByText("TypeScript", { exact: true }).click();
  await page.getByRole("radio", { name: /Openbaar/ }).check();
  await page.getByRole("button", { name: "Profiel opslaan" }).click();

  await expect(page.getByText("Opgeslagen.")).toBeVisible();

  // Canonieke staat na reload: server-berekende compleetheid + opgeslagen waarden.
  await page.reload();
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.locator("#availability")).toHaveValue("AVAILABLE");
  await shot(page, "07-profiel");
  const link = page.getByRole("link", { name: /Naar mijn profiel/ });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/zzp\//);

  // PUBLIC: anonieme bezoeker ziet het profiel.
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(href!);
  await expect(anonPage.getByRole("heading", { name: "Test Freelancer" })).toBeVisible();
  await expect(anonPage.getByText("Senior Frontend Developer").first()).toBeVisible();
  await shot(anonPage, "08-public-profile");

  // PRIVATE: zichtbaarheid server-side afgedwongen -> anoniem krijgt 404.
  await page.getByRole("radio", { name: /Privé/ }).check();
  await page.getByRole("button", { name: "Profiel opslaan" }).click();
  await expect(page.getByText("Opgeslagen.")).toBeVisible();

  const anonPage2 = await anon.newPage();
  const resp = await anonPage2.goto(href!);
  expect(resp?.status()).toBe(404);
  await expect(anonPage2.getByRole("heading", { name: "Test Freelancer" })).toHaveCount(0);
  await anon.close();
});

test("opdrachtgever registreert en bewerkt bedrijfsprofiel", async ({ page }) => {
  const email = `client-${uniq()}@test.local`;
  await registerClient(page, email);

  // Het bedrijfsprofiel-formulier staat op /bedrijf/bewerken (de /bedrijf-hub is read-only).
  await page.goto("/bedrijf/bewerken");
  await expect(page.getByRole("heading", { name: "Bedrijfsprofiel" })).toBeVisible();
  await expect(page.locator("#name")).toHaveValue("Testbedrijf B.V.");

  await page.fill("#location", "Utrecht");
  await page.fill("#description", "Wij bouwen web- en mobiele applicaties.");
  await page.selectOption("#industryId", { label: "ICT" });
  await page.getByRole("button", { name: "Bedrijfsprofiel opslaan" }).click();
  await expect(page.getByText("Opgeslagen.")).toBeVisible();

  await page.reload();
  await expect(page.locator("#location")).toHaveValue("Utrecht");
  await expect(page.locator("#industryId")).toHaveValue(/.+/);
  await shot(page, "09-bedrijf");
});
