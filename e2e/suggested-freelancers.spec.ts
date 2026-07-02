import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("opdrachtgever ziet passende ZZP'ers bij de opdracht en kan ze benaderen", async ({
  page,
  browser,
}) => {
  test.slow();
  const id = uniq();
  const freelancerName = `Suggest Freelancer ${id}`;
  const title = `Suggest Opdracht ${id}`;

  // ZZP'er met openbaar, aansluitend profiel (zelfde skill, remote, tarief binnen budget).
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await fp.goto("/register");
  await fp.fill("#name", freelancerName);
  await fp.fill("#email", `suggest-free-${id}@test.local`);
  await fp.fill("#password", "geheim123");
  await fp.getByRole("button", { name: "Account aanmaken" }).click();
  await fp.waitForURL("**/dashboard");
  await fp.goto("/profiel/bewerken");
  await fp.fill("#hourlyRate", "80");
  await fp.selectOption("#workMode", "REMOTE");
  await fp.selectOption("#availability", "AVAILABLE");
  await fp
    .locator("fieldset", { hasText: "Skills" })
    .getByText("TypeScript", { exact: true })
    .click();
  await fp.getByRole("button", { name: "Profiel opslaan" }).click();
  await expect(fp.getByText(/opgeslagen|bijgewerkt/i).first()).toBeVisible({ timeout: 15000 });

  // Opdrachtgever publiceert een passende opdracht (zelfde skill, geen vereist certificaat).
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Suggest Opdrachtgever");
  await page.fill("#companyName", "Suggest Testbedrijf B.V.");
  await page.fill("#email", `suggest-client-${id}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Remote project voor een ervaren ontwikkelaar.");
  await page.selectOption("#workMode", "REMOTE");
  await page.fill("#rateMin", "70");
  await page.fill("#rateMax", "95");
  await page
    .locator("fieldset", { hasText: "Vereiste skills" })
    .getByText("TypeScript", { exact: true })
    .click();
  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // Het systeem stelt de passende ZZP'er voor bij de opdracht.
  await expect(page.getByRole("heading", { name: "Geschikte ZZP'ers" })).toBeVisible();
  const row = page.locator("li", { hasText: freelancerName });
  await expect(row).toBeVisible();
  await expect(row.getByText(/Match \d+%/)).toBeVisible();
  await expect(row.getByText("Beschikbaar", { exact: true })).toBeVisible();
  await shot(page, "29-suggested-freelancers");

  // "Bericht sturen" opent een echt gesprek (geen dode knop).
  await row.getByRole("button", { name: "Bericht sturen" }).click();
  await page.waitForURL(/\/berichten\/[a-z0-9]+$/);
  await expect(page.locator('textarea[name="body"]')).toBeVisible();

  await fctx.close();
});
