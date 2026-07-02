import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("ongelezen bericht toont een badge op Berichten in de zijbalk", async ({ page, browser }) => {
  test.slow();
  const title = `Bericht Opdracht ${uniq()}`;

  // Opdrachtgever: opdracht + publiceren.
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Bericht Opdrachtgever");
  await page.fill("#companyName", "Bericht Testbedrijf B.V.");
  await page.fill("#email", `msg-client-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Kort project, snelle start gewenst.");
  await page.selectOption("#workMode", "REMOTE");
  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // ZZP'er reageert.
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await fp.goto("/register");
  await fp.fill("#name", "Bericht Freelancer");
  await fp.fill("#email", `msg-free-${uniq()}@test.local`);
  await fp.fill("#password", "geheim123");
  await fp.getByRole("button", { name: "Account aanmaken" }).click();
  await fp.waitForURL("**/dashboard");
  await fp.goto(detailUrl);
  await fp.fill("#motivation", "Ik ben beschikbaar en wil hier graag aan werken.");
  await fp.getByRole("button", { name: "Reactie versturen" }).click();
  await fp.waitForURL("**/reacties");

  // Opdrachtgever stuurt een bericht naar de kandidaat.
  await page.goto("/kandidaten");
  await page.getByRole("button", { name: "Toon details" }).click();
  await page.getByRole("button", { name: "Bericht sturen" }).click();
  await page.waitForURL(/\/berichten\/[a-z0-9]+$/);
  await page.locator('textarea[name="body"]').fill("Hoi, wanneer kun je starten?");
  await page.getByRole("button", { name: "Versturen" }).click();
  await expect(page.getByText("Hoi, wanneer kun je starten?")).toBeVisible({ timeout: 15000 });

  // ZZP'er ziet vanaf elke pagina dat er een ongelezen bericht wacht.
  await fp.goto("/dashboard");
  const berichtenNav = fp
    .locator('nav[aria-label="Hoofdnavigatie"]')
    .getByRole("link", { name: /Berichten/ });
  await expect(berichtenNav).toContainText("1");
  await shot(fp, "27-nav-badge-berichten");

  await fctx.close();
});
