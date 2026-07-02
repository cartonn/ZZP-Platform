import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

test("verlopen factuur vraagt aandacht op dashboard en zijbalk", async ({ page, browser }) => {
  test.slow();
  const title = `Overdue Opdracht ${uniq()}`;

  // Opdrachtgever: opdracht + publiceren.
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Overdue Opdrachtgever");
  await page.fill("#companyName", "Overdue Testbedrijf B.V.");
  await page.fill("#email", `overdue-client-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Project met facturatie.");
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
  await fp.fill("#name", "Overdue Freelancer");
  await fp.fill("#email", `overdue-free-${uniq()}@test.local`);
  await fp.fill("#password", "geheim123");
  await fp.getByRole("button", { name: "Account aanmaken" }).click();
  await fp.waitForURL("**/dashboard");
  await fp.goto(detailUrl);
  await fp.fill("#motivation", "Ik lever graag en factureer netjes.");
  await fp.getByRole("button", { name: "Reactie versturen" }).click();
  await fp.waitForURL("**/reacties");

  // Opdrachtgever accepteert en stelt samenwerking voor.
  await page.goto("/kandidaten");
  await page.getByRole("button", { name: "Accepteren" }).click();
  await expect(page.getByText("Samenwerking voorstellen")).toBeVisible();
  await page.locator('input[name="rate"]').fill("90");
  await page.getByRole("button", { name: "Voorstel versturen" }).click();
  await expect(page.getByRole("link", { name: "Bekijk samenwerking" })).toBeVisible();

  // ZZP'er activeert samenwerking en stuurt een factuur met een vervaldatum in het verleden.
  await fp.goto("/samenwerkingen");
  await fp
    .locator("div.bg-card", { hasText: title })
    .getByRole("button", { name: "Contract ondertekenen" })
    .click();
  await expect(fp.locator("div.bg-card", { hasText: title }).getByText("Actief")).toBeVisible();

  await fp.goto("/facturen/nieuw");
  await fp.fill('input[name="lineDescription"]', "Ontwikkeling sprint 1");
  await fp.fill('input[name="lineQuantity"]', "10");
  await fp.fill('input[name="lineUnit"]', "90");
  await fp.fill("#dueAt", yesterday);
  await fp.getByRole("button", { name: "Factuur opstellen (concept)" }).click();
  await fp.waitForURL(/\/facturen\/[a-z0-9]+$/);
  await fp.getByRole("button", { name: "Versturen" }).click();
  await expect(fp.getByText("Verlopen").first()).toBeVisible();

  // Het systeem trekt het verband: op het dashboard én de zijbalk.
  await fp.goto("/dashboard");
  await expect(fp.getByText(/over de vervaldatum/)).toBeVisible();
  // Facturen zitten nu in de Administratie-hub (/financien); de overdue-badge hangt aan dat item.
  const facturenNav = fp
    .locator('nav[aria-label="Hoofdnavigatie"]')
    .getByRole("link", { name: /Administratie/ });
  await expect(facturenNav).toContainText("1");
  await shot(fp, "31-overdue-invoice");

  await fctx.close();
});
