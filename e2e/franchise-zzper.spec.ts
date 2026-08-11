import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { reloadUntilVisible } from "./_robust";

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
  // Het toevoeg-formulier staat ingeklapt zodra er al ZZP'ers in de roster staan; klap het open.
  await page.getByText("Nieuwe ZZP'er toevoegen").click();
  await page.fill("#name", naam);
  await page.fill("#email", `roster-${uniq()}@test.local`);
  await page.fill("#headline", "Verzorgende IG");
  await page.fill("#location", "Assen");
  await page.selectOption("#availability", "AVAILABLE");
  await page.fill("#bio", "Ervaren in de ouderenzorg, flexibel inzetbaar.");
  // Eerste skill-chip aanvinken.
  await page.locator('label:has(input[name="skillIds"])').first().click();

  await page.getByRole("button", { name: "ZZP'er toevoegen" }).click();
  // Bewijs de mutatie via de roster zelf (#329-robuust: de action-response kan hangen terwijl de
  // write slaagde — de flash-melding is na een reload weg). Filter op naam: door paginering
  // (LIST_PAGE_SIZE) kan de nieuwe rij anders buiten de eerste pagina vallen.
  await page.waitForTimeout(500);
  await page.goto(`/franchise/zzpers?q=${encodeURIComponent(naam)}`);
  await reloadUntilVisible(page, page.getByText(naam).first());
  await shot(page, "franchise-zzper-toegevoegd");
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Beschikbaar$/ })
      .first(),
  ).toBeVisible();
  await page.locator('a[href^="/franchise/zzpers/"]').first().click();
  await page.waitForURL(/\/franchise\/zzpers\/[a-z0-9]+$/);

  // Roster-detail toont beschikbaarheid, minstens één skill en de certificaten-lege-staat.
  await expect(page.getByRole("heading", { name: naam })).toBeVisible();
  await expect(page.getByText("Beschikbaar", { exact: true })).toBeVisible();
  await expect(page.getByText("Skills", { exact: true })).toBeVisible();
  // Certificaten leven op de "Bestanden"-tab van het dossier; voor een verse ZZP'er is die leeg.
  const bestandenLink = page.getByRole("link", { name: "Bestanden" });
  await Promise.all([page.waitForURL(/[?&]tab=bestanden/), bestandenLink.click()]);
  await expect(page.getByText("Nog geen bestanden")).toBeVisible();
  await shot(page, "franchise-zzper-detail");
});
