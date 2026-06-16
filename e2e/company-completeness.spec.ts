import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("bedrijfsprofiel toont compleetheid en concrete aanvulpunten", async ({ page }) => {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Compleet Opdrachtgever");
  await page.fill("#companyName", "Compleet Testbedrijf B.V.");
  await page.fill("#email", `compleet-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  // Vers bedrijf: alleen naam ingevuld -> 0% met alle punten open.
  await page.goto("/bedrijf");
  await expect(page.getByText("Profiel-compleetheid")).toBeVisible();
  await expect(page.getByText("0%")).toBeVisible();
  await expect(page.getByText(/Nog aan te vullen:.*Omschrijving/)).toBeVisible();

  // Dashboard meldt het ook (als afhandelbare taak in de actiezone sinds de command-center-overhaul).
  await page.goto("/dashboard");
  await expect(page.getByText("Bedrijfsprofiel is 0% compleet").first()).toBeVisible();

  // Aanvullen via het bewerken-formulier (de /bedrijf-hub is read-only; het formulier staat op
  // /bedrijf/bewerken sinds de bedrijfsprofiel-hub) -> 90% (alleen logo open).
  await page.goto("/bedrijf/bewerken");
  await page.fill("#description", "Wij bouwen duurzame software voor het MKB.");
  await page.fill("#location", "Utrecht");
  await page.fill("#website", "https://compleet-bedrijf.nl");
  await page.selectOption("#industryId", { index: 1 });
  await page.getByRole("button", { name: "Bedrijfsprofiel opslaan" }).click();
  await expect(page.getByText("Opgeslagen.")).toBeVisible({ timeout: 15000 });

  await page.goto("/bedrijf");
  await expect(page.getByText("90%")).toBeVisible();
  await expect(page.getByText(/Nog aan te vullen:.*Logo/)).toBeVisible();
  await shot(page, "41-bedrijf-completeness");
});
