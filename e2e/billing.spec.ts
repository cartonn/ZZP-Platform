import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { clickUntil } from "./_robust";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function registerClient(page: Page, email: string) {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Fact Opdrachtgever");
  await page.fill("#companyName", "Fact Testbedrijf B.V.");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}
async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "Fact Freelancer");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

test("factuur opstellen, versturen en als betaald markeren", async ({ page, browser }) => {
  test.slow(); // zware keten: opdracht -> reactie -> samenwerking -> factuur, multi-context
  const title = `Fact Opdracht ${uniq()}`;
  await registerClient(page, `fact-client-${uniq()}@test.local`);

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Project met facturatie.");
  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await registerFreelancer(fp, `fact-free-${uniq()}@test.local`);
  await fp.goto(detailUrl);
  await fp.fill("#motivation", "Ik lever graag en factureer netjes.");
  await fp.getByRole("button", { name: "Reactie versturen" }).click();
  await fp.waitForURL("**/reacties");

  // Accepteren + samenwerking voorstellen.
  await page.goto("/kandidaten");
  await page.getByRole("button", { name: "Toon details" }).click();
  await page.getByRole("button", { name: "Accepteren" }).click();
  await page.getByRole("button", { name: /Geaccepteerd/ }).click();
  await expect(page.getByText("Samenwerking voorstellen")).toBeVisible();
  await page.locator('input[name="rate"]').fill("90");
  await page.getByRole("button", { name: "Voorstel versturen" }).click();
  await expect(page.getByRole("link", { name: "Bekijk samenwerking" })).toBeVisible();

  // Freelancer activeert de samenwerking.
  await fp.goto("/samenwerkingen");
  await fp
    .locator("div.bg-card", { hasText: title })
    .getByRole("button", { name: "Contract ondertekenen" })
    .click();
  await expect(fp.locator("div.bg-card", { hasText: title }).getByText("Actief")).toBeVisible();

  // Factuur opstellen.
  await fp.goto("/facturen/nieuw");
  await fp.fill('input[name="lineDescription"]', "Ontwikkeling sprint 1");
  await fp.fill('input[name="lineQuantity"]', "10");
  await fp.fill('input[name="lineUnit"]', "90");
  await fp.getByRole("button", { name: "Factuur opstellen (concept)" }).click();
  await fp.waitForURL(/\/facturen\/[a-z0-9]+$/);
  await expect(fp.getByText("Concept")).toBeVisible();
  await expect(fp.getByText("€ 900,00").first()).toBeVisible();
  await shot(fp, "25-factuur");

  // Versturen.
  await fp.getByRole("button", { name: "Versturen" }).click();
  await expect(fp.getByText("Verzonden")).toBeVisible();

  // Opdrachtgever markeert als betaald.
  await page.goto("/facturen");
  await expect(page.getByText("€ 900,00").first()).toBeVisible();
  await page
    .getByRole("link", { name: /Fact Freelancer|2026-/ })
    .first()
    .click();
  await page.waitForURL(/\/facturen\/[a-z0-9]+$/);
  await page.getByRole("button", { name: "Markeer als betaald" }).click();
  await expect(page.getByText("Betaald")).toBeVisible();
  await shot(page, "26-factuur-betaald");

  await fctx.close();
});

test("abonnement upgraden naar Zelf-doen", async ({ page }) => {
  await registerFreelancer(page, `abo-${uniq()}@test.local`);
  await page.goto("/abonnement");
  await expect(
    page.locator("div.bg-card", { hasText: "Gratis" }).getByText("Huidig", { exact: true }),
  ).toBeVisible();
  // Na upgrade is Zelf-doen (PlanKey PRO) het huidige plan. Kaart uniek via z'n tagline.
  const zelfdoen = page.locator("div.bg-card", { hasText: "Jij houdt de regie" });
  await clickUntil(
    page.getByRole("button", { name: "Kies Zelf-doen" }),
    zelfdoen.getByText("Huidig", { exact: true }),
  );
  await expect(zelfdoen.getByText("Onbeperkt reageren en samenwerken")).toBeVisible();
  await shot(page, "27-abonnement");
});
