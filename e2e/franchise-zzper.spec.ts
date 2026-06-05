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

// Rijkere ZZP'er-onboarding in de franchise: beschikbaarheid + skills + bio bij het in-de-roster-
// brengen, en een roster-detailpagina voor oversight.
test("franchiser onboardt een ZZP'er met skill en beschikbaarheid, met roster-detail", async ({
  page,
}) => {
  test.slow();
  await login(page, "franchise@zzp-platform.local");
  await page.goto("/franchise/zzpers");

  const naam = `Roster ZZP ${uniq()}`;
  await page.fill("#name", naam);
  await page.fill("#email", `roster-${uniq()}@test.local`);
  await page.fill("#headline", "Verzorgende IG");
  await page.fill("#location", "Assen");
  await page.selectOption("#availability", "AVAILABLE");
  await page.fill("#bio", "Ervaren in de ouderenzorg, flexibel inzetbaar.");
  // Eerste skill-chip aanvinken.
  await page.locator('label:has(input[name="skillIds"])').first().click();

  await page.getByRole("button", { name: "ZZP'er toevoegen" }).click();
  await expect(page.getByText(`${naam} toegevoegd aan je roster.`)).toBeVisible();
  await shot(page, "franchise-zzper-toegevoegd");

  // De nieuwe ZZP'er staat in de roster met "Beschikbaar"; open de detailpagina.
  const row = page.getByRole("link", { name: new RegExp(naam) });
  await expect(row).toBeVisible();
  await expect(row.getByText("Beschikbaar")).toBeVisible();
  await row.click();
  await page.waitForURL(/\/franchise\/zzpers\/[a-z0-9]+$/);

  // Roster-detail toont beschikbaarheid, minstens één skill en de certificaten-lege-staat.
  await expect(page.getByRole("heading", { name: naam })).toBeVisible();
  await expect(page.getByText("Beschikbaar", { exact: true })).toBeVisible();
  await expect(page.getByText("Skills", { exact: true })).toBeVisible();
  await expect(page.getByText("Nog geen certificaten")).toBeVisible();
  await shot(page, "franchise-zzper-detail");
});
